"""Register, login, profile aur forgot password."""

import secrets
from datetime import timedelta

import bcrypt
from flask import Blueprint, current_app
from flask_jwt_extended import create_access_token
from pymongo.errors import DuplicateKeyError

from extensions import get_db
from mailer import send_email
from utils import (
    ApiError, check_password_strength, clean_email, get_json, login_required,
    now, ok, public_user, require_fields,
)

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def hash_password(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def password_matches(password, hashed):
    try:
        return bcrypt.checkpw(str(password).encode(), hashed.encode())
    except (ValueError, AttributeError):
        return False


def make_token(user):
    return create_access_token(
        identity=str(user["_id"]),
        additional_claims={"role": user.get("role", "customer")},
    )


@bp.post("/register")
def register():
    data = get_json()
    require_fields(data, "name", "email", "password")

    user = {
        "name": str(data["name"]).strip()[:80],
        "email": clean_email(data["email"]),
        "phone": str(data.get("phone", "")).strip()[:20],
        "address": "",
        "city": "",
        "password_hash": hash_password(check_password_strength(data["password"])),
        "role": "customer",
        "is_blocked": False,
        "wishlist": [],
        "created_at": now(),
    }

    try:
        result = get_db().users.insert_one(user)
    except DuplicateKeyError:
        raise ApiError("This email is already registered. Please login.", 409)

    user["_id"] = result.inserted_id
    return ok({"token": make_token(user), "user": public_user(user)}, 201)


@bp.post("/login")
def login():
    data = get_json()
    require_fields(data, "email", "password")

    user = get_db().users.find_one({"email": str(data["email"]).strip().lower()})

    if not user or not password_matches(data["password"], user.get("password_hash")):
        raise ApiError("Invalid email or password.", 401)

    if user.get("is_blocked"):
        raise ApiError("Your account has been blocked. Please contact support.", 403)

    return ok({"token": make_token(user), "user": public_user(user)})


@bp.get("/me")
@login_required
def me(user):
    return ok(public_user(user))


@bp.put("/me")
@login_required
def update_me(user):
    data = get_json()
    updates = {}

    for field, limit in (("name", 80), ("phone", 20), ("address", 300), ("city", 60)):
        if field in data:
            updates[field] = str(data[field] or "").strip()[:limit]

    if "name" in updates and not updates["name"]:
        raise ApiError("Name cannot be empty.", 400)

    if updates:
        get_db().users.update_one({"_id": user["_id"]}, {"$set": updates})
        user.update(updates)

    return ok(public_user(user))


@bp.put("/change-password")
@login_required
def change_password(user):
    data = get_json()
    require_fields(data, "currentPassword", "newPassword")

    if not password_matches(data["currentPassword"], user.get("password_hash")):
        raise ApiError("Current password is incorrect.", 400)

    new_hash = hash_password(check_password_strength(data["newPassword"]))
    get_db().users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": new_hash}})
    return ok(message="Password changed successfully.")


@bp.post("/forgot-password")
def forgot_password():
    data = get_json()
    email = clean_email(data.get("email"))
    user = get_db().users.find_one({"email": email})

    # Security: email registered ho ya na ho, jawab ek jaisa do
    if user and not user.get("is_blocked"):
        code = f"{secrets.randbelow(1_000_000):06d}"
        minutes = current_app.config["RESET_CODE_MINUTES"]

        get_db().users.update_one(
            {"_id": user["_id"]},
            {"$set": {
                "reset_code_hash": hash_password(code),
                "reset_expires": now() + timedelta(minutes=minutes),
                "reset_attempts": 0,
            }},
        )

        send_email(
            email,
            "NovaStore password reset code",
            f"Your password reset code is: {code}\n"
            f"It will expire in {minutes} minutes.\n"
            "If you did not request this, ignore this email.",
        )

    return ok(message="If this email is registered, a reset code has been sent.")


@bp.post("/reset-password")
def reset_password():
    data = get_json()
    require_fields(data, "email", "code", "newPassword")

    email = clean_email(data["email"])
    users = get_db().users
    user = users.find_one({"email": email})
    invalid = ApiError("Invalid or expired reset code.", 400)

    if not user or not user.get("reset_code_hash"):
        raise invalid

    expires = user.get("reset_expires")
    if expires is not None and expires.tzinfo is None:
        from datetime import timezone
        expires = expires.replace(tzinfo=timezone.utc)

    if not expires or expires < now() or user.get("reset_attempts", 0) >= 5:
        raise invalid

    if not password_matches(str(data["code"]).strip(), user["reset_code_hash"]):
        users.update_one({"_id": user["_id"]}, {"$inc": {"reset_attempts": 1}})
        raise invalid

    new_hash = hash_password(check_password_strength(data["newPassword"]))
    users.update_one(
        {"_id": user["_id"]},
        {
            "$set": {"password_hash": new_hash},
            "$unset": {"reset_code_hash": "", "reset_expires": "", "reset_attempts": ""},
        },
    )
    return ok(message="Password reset successfully. Please login.")
