"""
App settings. Saari secret cheezein .env file se aati hain,
code ke andar koi password nahi likha jata.
"""

import os
from datetime import timedelta

from dotenv import load_dotenv

load_dotenv()


class Config:
    # Flask
    SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
    DEBUG = os.getenv("FLASK_DEBUG", "0") == "1"

    # MongoDB (local: mongodb://localhost:27017, online: MongoDB Atlas ka link)
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
    MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "novastore")

    # JWT login token
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-me-too-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(
        days=int(os.getenv("JWT_EXPIRES_DAYS", "7"))
    )

    # Kaun se frontend backend ko call kar sakte hain (comma se alag karein)
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv(
            "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
        ).split(",")
        if origin.strip()
    ]

    # Store settings
    FREE_DELIVERY_ABOVE = int(os.getenv("FREE_DELIVERY_ABOVE", "5000"))
    DELIVERY_FEE = int(os.getenv("DELIVERY_FEE", "250"))

    # Password reset email (SMTP). Khali ho to code sirf server log mein dikhega.
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    MAIL_FROM = os.getenv("MAIL_FROM", "")
    RESET_CODE_MINUTES = int(os.getenv("RESET_CODE_MINUTES", "15"))


class TestConfig(Config):
    TESTING = True
    MONGO_URI = "mongomock://localhost"
    MONGO_DB_NAME = "novastore_test"
    JWT_SECRET_KEY = "test-secret-key-that-is-long-enough-123"
    SECRET_KEY = "test-secret"
