"""
Vercel ke liye entry file.
Vercel is file mein "app" naam ki cheez dhoondta hai aur usay chalata hai.
Apne computer par ab bhi:  python app.py
"""

from flask import jsonify

from app import create_app

app = create_app()


@app.get("/")
def home():
    return jsonify({
        "success": True,
        "message": "NovaStore API is running. Try /api/health or /api/products",
    })