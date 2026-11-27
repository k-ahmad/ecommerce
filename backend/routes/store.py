"""Reviews, wishlist, contact messages aur admin ke customers/stats."""

from flask import Blueprint
from pymongo import DESCENDING
from pymongo.errors import DuplicateKeyError

from extensions import get_db
from utils import (
    ApiError, admin_required, clean_email, get_json, login_required, now, ok,
    public_user, require_fields, serialize, to_number, to_object_id,
)

bp = Blueprint("store", __name__, url_prefix="/api")


# ---------------- REVIEWS ----------------

def refresh_rating(product_id):
    """Product ki average rating dobara calculate karo."""
    db = get_db()
    rows = list(db.reviews.aggregate([
        {"$match": {"product_id": product_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$rating"}, "count": {"$sum": 1}}},
    ]))
    avg = round(rows[0]["avg"], 1) if rows else 0
    count = rows[0]["count"] if rows else 0
    db.products.update_one({"_id": product_id}, {"$set": {"rating": avg, "reviewCount": count}})


@bp.get("/products/<product_id>/reviews")
def product_reviews(product_id):
    oid = to_object_id(product_id, "product id")
    reviews = get_db().reviews.find({"product_id": oid}).sort("created_at", DESCENDING)
    return ok([serialize(r) for r in reviews])


@bp.post("/products/<product_id>/reviews")
@login_required
def add_review(user, product_id):
    db = get_db()
    oid = to_object_id(product_id, "product id")

    if not db.products.find_one({"_id": oid}, {"_id": 1}):
        raise ApiError("Product not found.", 404)

    data = get_json()
    rating = to_number(data.get("rating"), "Rating", minimum=1, integer=True)
    if rating > 5:
        raise ApiError("Rating must be between 1 and 5.", 400)

    review = {
        "product_id": oid,
        "user_id": user["_id"],
        "userName": user.get("name", "Customer"),
        "rating": rating,
        "comment": str(data.get("comment", "")).strip()[:1000],
        "created_at": now(),
    }

    try:
        result = db.reviews.insert_one(review)
    except DuplicateKeyError:
        raise ApiError("You have already reviewed this product.", 409)

    review["_id"] = result.inserted_id
    refresh_rating(oid)
    return ok(serialize(review), 201)


@bp.delete("/reviews/<review_id>")
@login_required
def delete_review(user, review_id):
    db = get_db()
    review = db.reviews.find_one({"_id": to_object_id(review_id, "review id")})

    if not review or (review["user_id"] != user["_id"] and user.get("role") != "admin"):
        raise ApiError("Review not found.", 404)

    db.reviews.delete_one({"_id": review["_id"]})
    refresh_rating(review["product_id"])
    return ok(message="Review deleted.")


# ---------------- WISHLIST ----------------

@bp.get("/wishlist")
@login_required
def get_wishlist(user):
    ids = user.get("wishlist", [])
    products = get_db().products.find({"_id": {"$in": ids}})
    return ok([serialize(p) for p in products])


@bp.post("/wishlist/<product_id>")
@login_required
def toggle_wishlist(user, product_id):
    db = get_db()
    oid = to_object_id(product_id, "product id")

    if oid in user.get("wishlist", []):
        db.users.update_one({"_id": user["_id"]}, {"$pull": {"wishlist": oid}})
        return ok({"inWishlist": False})

    if not db.products.find_one({"_id": oid}, {"_id": 1}):
        raise ApiError("Product not found.", 404)

    db.users.update_one({"_id": user["_id"]}, {"$addToSet": {"wishlist": oid}})
    return ok({"inWishlist": True})


# ---------------- CONTACT ----------------

@bp.post("/contact")
def contact():
    data = get_json()
    require_fields(data, "name", "email", "message")

    message = {
        "name": str(data["name"]).strip()[:80],
        "email": clean_email(data["email"]),
        "phone": str(data.get("phone", "")).strip()[:20],
        "subject": str(data.get("subject", "")).strip()[:150],
        "message": str(data["message"]).strip()[:3000],
        "read": False,
        "created_at": now(),
    }
    get_db().contact_messages.insert_one(message)
    return ok(message="Thank you! Your message has been sent.", status=201)


@bp.get("/admin/messages")
@admin_required
def list_messages(admin):
    rows = get_db().contact_messages.find().sort("created_at", DESCENDING)
    return ok([serialize(m) for m in rows])


# ---------------- ADMIN: CUSTOMERS & STATS ----------------

@bp.get("/admin/users")
@admin_required
def list_users(admin):
    users = get_db().users.find({"role": {"$ne": "admin"}}).sort("created_at", DESCENDING)
    return ok([public_user(u) for u in users])


@bp.put("/admin/users/<user_id>/block")
@admin_required
def toggle_block(admin, user_id):
    db = get_db()
    target = db.users.find_one({"_id": to_object_id(user_id, "user id")})

    if not target:
        raise ApiError("User not found.", 404)

    if target.get("role") == "admin":
        raise ApiError("Admin accounts cannot be blocked.", 400)

    blocked = not target.get("is_blocked", False)
    db.users.update_one({"_id": target["_id"]}, {"$set": {"is_blocked": blocked}})
    target["is_blocked"] = blocked
    return ok(public_user(target))


@bp.get("/admin/stats")
@admin_required
def stats(admin):
    db = get_db()
    by_status = {
        row["_id"]: row
        for row in db.orders.aggregate([
            {"$group": {"_id": "$status", "count": {"$sum": 1}, "sales": {"$sum": "$total"}}}
        ])
    }

    return ok({
        "totalOrders": sum(r["count"] for r in by_status.values()),
        "pendingOrders": by_status.get("Pending", {}).get("count", 0),
        "deliveredOrders": by_status.get("Delivered", {}).get("count", 0),
        "cancelledOrders": by_status.get("Cancelled", {}).get("count", 0),
        # Sirf delivered orders ko sale maana jata hai
        "totalSales": by_status.get("Delivered", {}).get("sales", 0),
        "totalProducts": db.products.count_documents({}),
        "lowStockProducts": db.products.count_documents({"stock": {"$lte": 5}}),
        "totalUsers": db.users.count_documents({"role": {"$ne": "admin"}}),
        "blockedUsers": db.users.count_documents({"is_blocked": True}),
        "unreadMessages": db.contact_messages.count_documents({"read": False}),
    })
