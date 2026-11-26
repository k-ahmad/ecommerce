"""
NovaStore backend (Flask + MongoDB).
Chalane ke liye:  python app.py
"""

from flask import Flask, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException

from config import Config
from extensions import init_db, jwt
from routes import auth, orders, products, store
from utils import ApiError


def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    CORS(app, resources={r"/api/*": {"origins": app.config["CORS_ORIGINS"]}})
    jwt.init_app(app)
    init_db(app)

    for module in (auth, products, orders, store):
        app.register_blueprint(module.bp)

    register_error_handlers(app)

    @app.get("/api/health")
    def health():
        return jsonify({"success": True, "status": "ok"})

    return app


def register_error_handlers(app):
    def error(message, status):
        return jsonify({"success": False, "error": message}), status

    @app.errorhandler(ApiError)
    def handle_api_error(e):
        return error(e.message, e.status)

    @app.errorhandler(HTTPException)
    def handle_http_error(e):
        return error(e.description or e.name, e.code)

    @jwt.unauthorized_loader
    def missing_token(reason):
        return error("Please login first.", 401)

    @jwt.invalid_token_loader
    def bad_token(reason):
        return error("Invalid login token. Please login again.", 401)

    @jwt.expired_token_loader
    def expired_token(header, payload):
        return error("Your session has expired. Please login again.", 401)

    @app.errorhandler(Exception)
    def handle_unexpected(e):
        app.logger.exception("Unexpected error")
        return error("Something went wrong on the server.", 500)


# Server par chalane ke liye:  gunicorn "app:create_app()"
if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=5000, debug=app.config["DEBUG"])
