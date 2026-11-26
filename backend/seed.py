"""
Database mein shuru ka data daalo: categories, products, coupons aur admin.

Chalane ke liye:   python seed.py
Admin ka email/password .env file se aata hai (ADMIN_EMAIL, ADMIN_PASSWORD).
Dobara chalane se purana data duplicate nahi hota.
"""

import json
import os
import sys
from pathlib import Path

from app import create_app
from extensions import get_db
from routes.auth import hash_password
from utils import check_password_strength, ApiError, now

CATEGORIES = [
    {"name": "Electronics", "icon": "🎧"},
    {"name": "Fashion", "icon": "👟"},
    {"name": "Accessories", "icon": "⌚"},
    {"name": "Lifestyle", "icon": "✨"},
]

COUPONS = [
    {"code": "NOVA10", "type": "percentage", "value": 10, "minOrder": 1000, "expiry": None, "active": True},
    {"code": "SAVE500", "type": "fixed", "value": 500, "minOrder": 3000, "expiry": None, "active": True},
]


def seed(db, admin_email=None, admin_password=None):
    for c in CATEGORIES:
        db.categories.update_one({"name": c["name"]}, {"$setOnInsert": {**c, "created_at": now()}}, upsert=True)

    products = json.loads((Path(__file__).parent / "seed_data" / "products.json").read_text("utf-8"))
    added = 0
    for p in products:
        doc = {
            "name": p["name"],
            "category": p["category"],
            "price": p["price"],
            "oldPrice": p.get("oldPrice"),
            "stock": p.get("stock", 0),
            "badge": p.get("badge", ""),
            "image": p.get("image", ""),
            "description": p.get("description", ""),
            "rating": p.get("rating", 0),
            "reviewCount": 0,
            "created_at": now(),
            "updated_at": now(),
        }
        result = db.products.update_one({"name": doc["name"]}, {"$setOnInsert": doc}, upsert=True)
        added += 1 if result.upserted_id else 0

    for c in COUPONS:
        db.coupons.update_one({"code": c["code"]}, {"$setOnInsert": {**c, "created_at": now()}}, upsert=True)

    if admin_email and admin_password:
        email = admin_email.strip().lower()
        check_password_strength(admin_password)
        db.users.update_one(
            {"email": email},
            {
                "$set": {"role": "admin", "password_hash": hash_password(admin_password), "is_blocked": False},
                "$setOnInsert": {
                    "name": "Admin", "email": email, "phone": "", "address": "", "city": "",
                    "wishlist": [], "created_at": now(),
                },
            },
            upsert=True,
        )

    return added


if __name__ == "__main__":
    app = create_app()
    with app.app_context():
        try:
            count = seed(get_db(), os.getenv("ADMIN_EMAIL"), os.getenv("ADMIN_PASSWORD"))
        except ApiError as e:
            sys.exit(f"Admin password error: {e.message}")

        print(f"Done. {count} new products added.")
        if not os.getenv("ADMIN_EMAIL"):
            print("Note: ADMIN_EMAIL / ADMIN_PASSWORD .env mein nahi hain, admin nahi bana.")
