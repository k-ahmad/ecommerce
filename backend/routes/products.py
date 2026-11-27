"""Products aur categories ki APIs."""

import re

from flask import Blueprint, request
from pymongo import ASCENDING, DESCENDING
from pymongo.errors import DuplicateKeyError

from extensions import get_db
from utils import (
    ApiError, admin_required, get_json, now, ok, require_fields, serialize,
    to_number, to_object_id,
)

bp = Blueprint("products", __name__, url_prefix="/api")

SORTS = {
    "newest": [("created_at", DESCENDING)],
    "price-low": [("price", ASCENDING)],
    "price-high": [("price", DESCENDING)],
    "rating": [("rating", DESCENDING)],
    "name": [("name", ASCENDING)],
}


def positive_int(value, default):
    value = str(value or "").strip()
    return int(value) if value.isdigit() and int(value) > 0 else default


def product_from_body(data, partial=False):
    """Admin ke bheje hue data ko check karke saaf product banao."""
    if not partial:
        require_fields(data, "name", "category", "price", "stock")

    product = {}

    if "name" in data:
        product["name"] = str(data["name"]).strip()[:150]
        if not product["name"]:
            raise ApiError("Product name cannot be empty.", 400)

    if "category" in data:
        category = str(data["category"]).strip()
        if not get_db().categories.find_one({"name": category}):
            raise ApiError(f"Category '{category}' does not exist.", 400)
        product["category"] = category

    if "price" in data:
        product["price"] = to_number(data["price"], "Price", minimum=1)

    if "oldPrice" in data:
        old = data["oldPrice"]
        product["oldPrice"] = None if old in (None, "", 0) else to_number(old, "Old price")

    if "stock" in data:
        product["stock"] = to_number(data["stock"], "Stock", integer=True)

    for field, limit in (("description", 2000), ("image", 1000), ("badge", 30)):
        if field in data:
            product[field] = str(data[field] or "").strip()[:limit]

    if "image" in product and product["image"] and not product["image"].startswith(("http://", "https://")):
        raise ApiError("Image must be a valid http(s) URL.", 400)

    return product


# ---------------- PRODUCTS ----------------

@bp.get("/products")
def list_products():
    args = request.args
    query = {}

    search = args.get("search", "").strip()
    if search:
        pattern = re.escape(search[:100])
        query["$or"] = [
            {"name": {"$regex": pattern, "$options": "i"}},
            {"category": {"$regex": pattern, "$options": "i"}},
            {"description": {"$regex": pattern, "$options": "i"}},
        ]

    if args.get("category") and args["category"] != "All":
        query["category"] = args["category"]

    price = {}
    if args.get("minPrice"):
        price["$gte"] = to_number(args["minPrice"], "minPrice")
    if args.get("maxPrice"):
        price["$lte"] = to_number(args["maxPrice"], "maxPrice")
    if price:
        query["price"] = price

    if args.get("inStock") == "true":
        query["stock"] = {"$gt": 0}

    page = positive_int(args.get("page"), default=1)
    limit = min(500, positive_int(args.get("limit"), default=12))
    sort = SORTS.get(args.get("sort", "newest"), SORTS["newest"])

    products = get_db().products
    total = products.count_documents(query)
    items = products.find(query).sort(sort).skip((page - 1) * limit).limit(limit)

    return ok(
        [serialize(p) for p in items],
        pagination={
            "page": page,
            "limit": limit,
            "total": total,
            "pages": (total + limit - 1) // limit,
        },
    )


@bp.get("/products/<product_id>")
def get_product(product_id):
    product = get_db().products.find_one({"_id": to_object_id(product_id, "product id")})

    if not product:
        raise ApiError("Product not found.", 404)

    return ok(serialize(product))


@bp.post("/products")
@admin_required
def create_product(admin):
    product = product_from_body(get_json())
    product.setdefault("description", "")
    product.setdefault("image", "")
    product.setdefault("badge", "")
    product.setdefault("oldPrice", None)
    product.update({"rating": 0, "reviewCount": 0, "created_at": now(), "updated_at": now()})

    result = get_db().products.insert_one(product)
    product["_id"] = result.inserted_id
    return ok(serialize(product), 201)


@bp.put("/products/<product_id>")
@admin_required
def update_product(admin, product_id):
    updates = product_from_body(get_json(), partial=True)

    if not updates:
        raise ApiError("Nothing to update.", 400)

    updates["updated_at"] = now()
    product = get_db().products.find_one_and_update(
        {"_id": to_object_id(product_id, "product id")},
        {"$set": updates},
        return_document=True,
    )

    if not product:
        raise ApiError("Product not found.", 404)

    return ok(serialize(product))


@bp.delete("/products/<product_id>")
@admin_required
def delete_product(admin, product_id):
    oid = to_object_id(product_id, "product id")
    result = get_db().products.delete_one({"_id": oid})

    if result.deleted_count == 0:
        raise ApiError("Product not found.", 404)

    get_db().reviews.delete_many({"product_id": oid})
    get_db().users.update_many({}, {"$pull": {"wishlist": oid}})
    return ok(message="Product deleted.")


# ---------------- CATEGORIES ----------------

@bp.get("/categories")
def list_categories():
    db = get_db()
    counts = {
        row["_id"]: row["count"]
        for row in db.products.aggregate([{"$group": {"_id": "$category", "count": {"$sum": 1}}}])
    }

    categories = []
    for c in db.categories.find().sort("name", ASCENDING):
        item = serialize(c)
        item["productCount"] = counts.get(c["name"], 0)
        categories.append(item)

    return ok(categories)


@bp.post("/categories")
@admin_required
def create_category(admin):
    data = get_json()
    require_fields(data, "name")
    category = {
        "name": str(data["name"]).strip()[:50],
        "icon": str(data.get("icon", "")).strip()[:10],
        "created_at": now(),
    }

    try:
        result = get_db().categories.insert_one(category)
    except DuplicateKeyError:
        raise ApiError("This category already exists.", 409)

    category["_id"] = result.inserted_id
    return ok(serialize(category), 201)


@bp.put("/categories/<category_id>")
@admin_required
def update_category(admin, category_id):
    data = get_json()
    db = get_db()
    oid = to_object_id(category_id, "category id")
    old = db.categories.find_one({"_id": oid})

    if not old:
        raise ApiError("Category not found.", 404)

    updates = {}
    if "name" in data:
        updates["name"] = str(data["name"]).strip()[:50]
        if not updates["name"]:
            raise ApiError("Category name cannot be empty.", 400)
    if "icon" in data:
        updates["icon"] = str(data["icon"] or "").strip()[:10]

    try:
        db.categories.update_one({"_id": oid}, {"$set": updates})
    except DuplicateKeyError:
        raise ApiError("This category already exists.", 409)

    # Category ka naam badla to us ke products bhi update karo
    if updates.get("name") and updates["name"] != old["name"]:
        db.products.update_many({"category": old["name"]}, {"$set": {"category": updates["name"]}})

    return ok(serialize(db.categories.find_one({"_id": oid})))


@bp.delete("/categories/<category_id>")
@admin_required
def delete_category(admin, category_id):
    db = get_db()
    category = db.categories.find_one({"_id": to_object_id(category_id, "category id")})

    if not category:
        raise ApiError("Category not found.", 404)

    if db.products.count_documents({"category": category["name"]}) > 0:
        raise ApiError("Move or delete this category's products first.", 409)

    db.categories.delete_one({"_id": category["_id"]})
    return ok(message="Category deleted.")
