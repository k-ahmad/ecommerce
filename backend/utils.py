"""Chhote helper functions jo har jagah use hote hain."""

import re
from datetime import datetime, timezone
from functools import wraps

from bson import ObjectId
from bson.errors import InvalidId
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request

from extensions import get_db


class ApiError(Exception):
    """Isay raise karo to user ko saaf error message jayega."""

    def __init__(self, message, status=400):
        super().__init__(message)
        self.message = message
        self.status = status


def now():
    return datetime.now(timezone.utc)


def to_object_id(value, label="id"):
    try:
        return ObjectId(str(value))
    except (InvalidId, TypeError):
        raise ApiError(f"Invalid {label}.", 400)


def serialize(doc):
    """MongoDB document ko JSON ke qabil banao (_id -> id)."""
    if doc is None:
        return None

    result = {}

    for key, value in doc.items():
        if key == "_id":
            result["id"] = str(value)
        elif isinstance(value, ObjectId):
            result[key] = str(value)
        elif isinstance(value, datetime):
            if value.tzinfo is None:
                value = value.replace(tzinfo=timezone.utc)
            result[key] = value.isoformat()
        elif isinstance(value, dict):
            result[key] = serialize(value)
        elif isinstance(value, list):
            result[key] = [
                serialize(v) if isinstance(v, dict)
                else str(v) if isinstance(v, ObjectId)
                else v
                for v in value
            ]
        else:
            result[key] = value

    return result


def get_json():
    data = request.get_json(silent=True)

    if not isinstance(data, dict):
        raise ApiError("Request body must be JSON.", 400)

    return data


def require_fields(data, *fields):
    missing = [
        f for f in fields
        if data.get(f) is None or str(data.get(f)).strip() == ""
    ]

    if missing:
        raise ApiError(f"Missing required fields: {', '.join(missing)}", 400)


def to_number(value, label, minimum=0, integer=False):
    if isinstance(value, bool):
        raise ApiError(f"{label} must be a number.", 400)

    try:
        number = float(value)
    except (TypeError, ValueError):
        raise ApiError(f"{label} must be a number.", 400)

    if number != number or number in (float("inf"), float("-inf")):
        raise ApiError(f"{label} must be a number.", 400)

    if integer:
        if not number.is_integer():
            raise ApiError(f"{label} must be a whole number.", 400)
        number = int(number)

    if number < minimum:
        raise ApiError(f"{label} must be at least {minimum}.", 400)

    return number


EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def clean_email(value):
    email = str(value or "").strip().lower()

    if not EMAIL_RE.match(email):
        raise ApiError("Please enter a valid email address.", 400)

    return email


def check_password_strength(password):
    password = str(password or "")

    if len(password) < 8:
        raise ApiError("Password must be at least 8 characters.", 400)

    if not re.search(r"[A-Za-z]", password) or not re.search(r"\d", password):
        raise ApiError("Password must contain letters and numbers.", 400)

    return password


def current_user():
    """Login user ko database se lao. Blocked user ko rok do."""
    user_id = get_jwt_identity()
    user = get_db().users.find_one({"_id": to_object_id(user_id)})

    if not user:
        raise ApiError("User not found. Please login again.", 401)

    if user.get("is_blocked"):
        raise ApiError("Your account has been blocked.", 403)

    return user


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        return fn(current_user(), *args, **kwargs)

    return wrapper


def admin_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        verify_jwt_in_request()
        user = current_user()

        if user.get("role") != "admin":
            raise ApiError("Admin access only.", 403)

        return fn(user, *args, **kwargs)

    return wrapper


def public_user(user):
    """Password jaisi cheezein hata kar user ka data bhejo."""
    return {
        "id": str(user["_id"]),
        "name": user.get("name", ""),
        "email": user.get("email", ""),
        "phone": user.get("phone", ""),
        "address": user.get("address", ""),
        "city": user.get("city", ""),
        "role": user.get("role", "customer"),
        "isBlocked": bool(user.get("is_blocked")),
        "createdAt": serialize({"d": user.get("created_at")})["d"]
        if user.get("created_at") else None,
    }


def ok(data=None, status=200, **extra):
    body = {"success": True}

    if data is not None:
        body["data"] = data

    body.update(extra)
    return jsonify(body), status
