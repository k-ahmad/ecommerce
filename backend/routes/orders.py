"""Coupons aur orders. Qeemat hamesha server calculate karta hai,
frontend ki bheji hui price par bharosa nahi kiya jata."""

from datetime import datetime

from flask import Blueprint, current_app, request
from pymongo import DESCENDING
from pymongo.errors import DuplicateKeyError

from extensions import get_db
from utils import (
    ApiError, admin_required, get_json, login_required, now, ok,
    require_fields, serialize, to_number, to_object_id,
)

bp = Blueprint("orders", __name__, url_prefix="/api")

ORDER_STATUSES = ["Pending", "Shipped", "Delivered", "Cancelled"]


# ---------------- COUPONS ----------------

def find_valid_coupon(code, subtotal):
    """Coupon check karo aur discount wapas do: (coupon, discount)."""
    code = str(code or "").strip().upper()

    if not code:
        raise ApiError("Please enter a coupon code.", 400)

    coupon = get_db().coupons.find_one({"code": code})

    if not coupon:
        raise ApiError("Invalid coupon code.", 400)

    if not coupon.get("active"):
        raise ApiError("This coupon is currently inactive.", 400)

    today = now().date().isoformat()
    if coupon.get("expiry") and coupon["expiry"] < today:
        raise ApiError("This coupon has expired.", 400)

    min_order = coupon.get("minOrder", 0) or 0
    if subtotal < min_order:
        raise ApiError(f"Minimum order amount is Rs. {min_order:,.0f}.", 400)

    if coupon["type"] == "percentage":
        discount = subtotal * coupon["value"] / 100
    else:
        discount = coupon["value"]

    return coupon, round(min(max(0, discount), subtotal))


def coupon_from_body(data, partial=False):
    if not partial:
        require_fields(data, "code", "type", "value")

    coupon = {}

    if "code" in data:
        coupon["code"] = str(data["code"]).strip().upper()[:30]
        if not coupon["code"].isalnum():
            raise ApiError("Coupon code must contain only letters and numbers.", 400)

    if "type" in data:
        if data["type"] not in ("percentage", "fixed"):
            raise ApiError("Coupon type must be 'percentage' or 'fixed'.", 400)
        coupon["type"] = data["type"]

    if "value" in data:
        coupon["value"] = to_number(data["value"], "Coupon value", minimum=1)

    if "minOrder" in data:
        coupon["minOrder"] = to_number(data["minOrder"] or 0, "Minimum order")

    if "expiry" in data:
        expiry = str(data["expiry"] or "").strip()
        if expiry:
            try:
                datetime.strptime(expiry, "%Y-%m-%d")
            except ValueError:
                raise ApiError("Expiry must be in YYYY-MM-DD format.", 400)
        coupon["expiry"] = expiry or None

    if "active" in data:
        coupon["active"] = bool(data["active"])

    ctype = coupon.get("type") or data.get("type")
    if ctype == "percentage" and coupon.get("value", 0) > 100:
        raise ApiError("Percentage discount cannot be more than 100.", 400)

    return coupon


@bp.post("/coupons/validate")
def validate_coupon():
    data = get_json()
    subtotal = to_number(data.get("subtotal", 0), "Subtotal")
    coupon, discount = find_valid_coupon(data.get("code"), subtotal)

    return ok({
        "code": coupon["code"],
        "type": coupon["type"],
        "value": coupon["value"],
        "discount": discount,
    })


@bp.get("/coupons")
@admin_required
def list_coupons(admin):
    return ok([serialize(c) for c in get_db().coupons.find().sort("created_at", DESCENDING)])


@bp.post("/coupons")
@admin_required
def create_coupon(admin):
    coupon = coupon_from_body(get_json())
    coupon.setdefault("minOrder", 0)
    coupon.setdefault("expiry", None)
    coupon.setdefault("active", True)
    coupon["created_at"] = now()

    try:
        result = get_db().coupons.insert_one(coupon)
    except DuplicateKeyError:
        raise ApiError("This coupon code already exists.", 409)

    coupon["_id"] = result.inserted_id
    return ok(serialize(coupon), 201)


@bp.put("/coupons/<coupon_id>")
@admin_required
def update_coupon(admin, coupon_id):
    db = get_db()
    oid = to_object_id(coupon_id, "coupon id")
    existing = db.coupons.find_one({"_id": oid})

    if not existing:
        raise ApiError("Coupon not found.", 404)

    data = get_json()
    updates = coupon_from_body(data, partial=True)

    final_type = updates.get("type", existing["type"])
    final_value = updates.get("value", existing["value"])
    if final_type == "percentage" and final_value > 100:
        raise ApiError("Percentage discount cannot be more than 100.", 400)

    try:
        db.coupons.update_one({"_id": oid}, {"$set": updates})
    except DuplicateKeyError:
        raise ApiError("This coupon code already exists.", 409)

    return ok(serialize(db.coupons.find_one({"_id": oid})))


@bp.delete("/coupons/<coupon_id>")
@admin_required
def delete_coupon(admin, coupon_id):
    result = get_db().coupons.delete_one({"_id": to_object_id(coupon_id, "coupon id")})

    if result.deleted_count == 0:
        raise ApiError("Coupon not found.", 404)

    return ok(message="Coupon deleted.")


# ---------------- ORDERS ----------------

def restore_stock(items):
    products = get_db().products
    for item in items:
        products.update_one({"_id": item["productId"]}, {"$inc": {"stock": item["quantity"]}})


@bp.post("/orders")
@login_required
def place_order(user):
    data = get_json()
    db = get_db()

    customer = data.get("customer") or {}
    require_fields(customer, "name", "phone", "city", "address")

    raw_items = data.get("items")
    if not isinstance(raw_items, list) or not raw_items:
        raise ApiError("Your cart is empty.", 400)

    # Ek hi product do baar aaye to quantity jama karo
    quantities = {}
    for raw in raw_items:
        if not isinstance(raw, dict):
            raise ApiError("Invalid cart item.", 400)
        oid = to_object_id(raw.get("productId") or raw.get("id"), "product id")
        qty = to_number(raw.get("quantity"), "Quantity", minimum=1, integer=True)
        quantities[oid] = quantities.get(oid, 0) + qty

    if len(quantities) > 50:
        raise ApiError("Too many different products in one order.", 400)

    # Stock kam karo. Har product ke liye condition: stock kaafi ho.
    reserved = []
    order_items = []

    try:
        for oid, qty in quantities.items():
            product = db.products.find_one_and_update(
                {"_id": oid, "stock": {"$gte": qty}},
                {"$inc": {"stock": -qty}},
            )

            if not product:
                existing = db.products.find_one({"_id": oid})
                if not existing:
                    raise ApiError(
                        "A product in your cart is no longer available. Please refresh your cart.", 409
                    )
                raise ApiError(
                    f"Sorry! Only {existing.get('stock', 0)} units of {existing['name']} are available.", 409
                )

            reserved.append({"productId": oid, "quantity": qty})
            order_items.append({
                "productId": oid,
                "name": product["name"],
                "image": product.get("image", ""),
                "category": product.get("category", ""),
                "price": product["price"],
                "quantity": qty,
                "lineTotal": product["price"] * qty,
            })

        subtotal = sum(item["lineTotal"] for item in order_items)

        coupon_info, discount = None, 0
        if data.get("couponCode"):
            coupon, discount = find_valid_coupon(data["couponCode"], subtotal)
            coupon_info = {"code": coupon["code"], "type": coupon["type"], "value": coupon["value"]}

        cfg = current_app.config
        delivery = 0 if subtotal >= cfg["FREE_DELIVERY_ABOVE"] else cfg["DELIVERY_FEE"]

        order = {
            "user_id": user["_id"],
            "email": user["email"],
            "customer": {
                "name": str(customer["name"]).strip()[:80],
                "phone": str(customer["phone"]).strip()[:20],
                "city": str(customer["city"]).strip()[:60],
                "address": str(customer["address"]).strip()[:300],
                "email": user["email"],
            },
            "items": order_items,
            "subtotal": subtotal,
            "discount": discount,
            "deliveryFee": delivery,
            "coupon": coupon_info,
            "total": max(0, subtotal - discount) + delivery,
            "paymentMethod": "Cash on Delivery",
            "status": "Pending",
            "created_at": now(),
            "updated_at": now(),
        }

        result = db.orders.insert_one(order)
        order["_id"] = result.inserted_id

    except Exception:
        # Kuch bhi ghalat hua to kam kiya hua stock wapas karo
        restore_stock(reserved)
        raise

    return ok(serialize(order), 201)


@bp.get("/orders/my")
@login_required
def my_orders(user):
    orders = get_db().orders.find({"user_id": user["_id"]}).sort("created_at", DESCENDING)
    return ok([serialize(o) for o in orders])


def load_order(order_id):
    order = get_db().orders.find_one({"_id": to_object_id(order_id, "order id")})
    if not order:
        raise ApiError("Order not found.", 404)
    return order


@bp.get("/orders/<order_id>")
@login_required
def get_order(user, order_id):
    order = load_order(order_id)

    if order["user_id"] != user["_id"] and user.get("role") != "admin":
        raise ApiError("Order not found.", 404)

    return ok(serialize(order))


def set_status(order, new_status):
    """Status badlo. Cancel hone par stock sirf ek baar wapas hota hai."""
    db = get_db()
    old_status = order["status"]

    if old_status == new_status:
        return order

    if old_status == "Cancelled":
        raise ApiError("A cancelled order cannot be changed.", 409)

    # Sirf usi waqt update karo jab status abhi tak purana hi ho (double click se bachao)
    updated = db.orders.find_one_and_update(
        {"_id": order["_id"], "status": old_status},
        {"$set": {"status": new_status, "updated_at": now()}},
        return_document=True,
    )

    if not updated:
        raise ApiError("Order was updated by someone else. Please refresh.", 409)

    if new_status == "Cancelled":
        restore_stock(order["items"])

    return updated


@bp.post("/orders/<order_id>/cancel")
@login_required
def cancel_order(user, order_id):
    order = load_order(order_id)

    if order["user_id"] != user["_id"]:
        raise ApiError("Order not found.", 404)

    if order["status"] != "Pending":
        raise ApiError("Only pending orders can be cancelled.", 409)

    return ok(serialize(set_status(order, "Cancelled")))


@bp.get("/admin/orders")
@admin_required
def all_orders(admin):
    query = {}
    status = request.args.get("status")
    if status and status != "All":
        query["status"] = status

    orders = get_db().orders.find(query).sort("created_at", DESCENDING)
    return ok([serialize(o) for o in orders])


@bp.put("/admin/orders/<order_id>/status")
@admin_required
def update_order_status(admin, order_id):
    data = get_json()
    new_status = data.get("status")

    if new_status not in ORDER_STATUSES:
        raise ApiError(f"Status must be one of: {', '.join(ORDER_STATUSES)}", 400)

    return ok(serialize(set_status(load_order(order_id), new_status)))
