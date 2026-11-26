"""MongoDB connection aur JWT setup."""

from urllib.parse import quote, unquote

from flask import current_app
from flask_jwt_extended import JWTManager
from pymongo import ASCENDING, MongoClient

jwt = JWTManager()


def init_db(app):
    uri = app.config["MONGO_URI"]

    if uri.startswith("mongomock://"):
        import mongomock  # sirf tests ke liye

        client = mongomock.MongoClient()
    else:
        client = MongoClient(safe_mongo_uri(uri), serverSelectionTimeoutMS=5000)

    app.extensions["mongo_client"] = client
    app.extensions["mongo_db"] = client[app.config["MONGO_DB_NAME"]]
    create_indexes(app.extensions["mongo_db"])


def safe_mongo_uri(uri):
    """Password mein @ : / jaise nishaan hon to unhein khud theek kar do."""
    scheme, sep, rest = uri.partition("://")
    if not sep or "@" not in rest:
        return uri

    userinfo, _, hosts = rest.rpartition("@")
    user, colon, password = userinfo.partition(":")
    safe = quote(unquote(user), safe="")
    if colon:
        safe += ":" + quote(unquote(password), safe="")

    return f"{scheme}://{safe}@{hosts}"


def get_db():
    return current_app.extensions["mongo_db"]


def create_indexes(db):
    db.users.create_index([("email", ASCENDING)], unique=True)
    db.categories.create_index([("name", ASCENDING)], unique=True)
    db.coupons.create_index([("code", ASCENDING)], unique=True)
    db.products.create_index([("category", ASCENDING)])
    db.orders.create_index([("user_id", ASCENDING)])
    db.reviews.create_index(
        [("product_id", ASCENDING), ("user_id", ASCENDING)], unique=True
    )