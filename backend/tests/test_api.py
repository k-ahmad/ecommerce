"""Backend ke tests. Chalane ke liye (backend folder mein):  pytest -q"""

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import create_app  # noqa: E402
from config import TestConfig  # noqa: E402
from extensions import get_db  # noqa: E402
from seed import seed  # noqa: E402

ADMIN = ("admin@test.com", "AdminPass123")


@pytest.fixture
def client():
    app = create_app(TestConfig)
    with app.app_context():
        db = get_db()
        for name in db.list_collection_names():
            db[name].delete_many({})
        seed(db, *ADMIN)
    yield app.test_client()


def login(client, email, password):
    r = client.post("/api/auth/login", json={"email": email, "password": password})
    assert r.status_code == 200, r.json
    return {"Authorization": f"Bearer {r.json['data']['token']}"}


def register(client, email="ali@test.com", password="Password123"):
    r = client.post("/api/auth/register", json={"name": "Ali", "email": email, "password": password, "phone": "0300"})
    assert r.status_code == 201, r.json
    return {"Authorization": f"Bearer {r.json['data']['token']}"}


def first_product(client, **params):
    r = client.get("/api/products", query_string={"limit": 100, **params})
    return r.json["data"][0]


CUSTOMER = {"name": "Ali", "phone": "03001234567", "city": "Lahore", "address": "Street 1"}


def test_health_and_seed(client):
    assert client.get("/api/health").status_code == 200
    r = client.get("/api/products", query_string={"limit": 100})
    assert r.json["pagination"]["total"] == 39
    cats = client.get("/api/categories").json["data"]
    assert {c["name"] for c in cats} == {"Electronics", "Fashion", "Accessories", "Lifestyle"}
    assert sum(c["productCount"] for c in cats) == 39


def test_register_login_and_password_rules(client):
    register(client)
    r = client.post("/api/auth/register", json={"name": "A", "email": "ali@test.com", "password": "Password123"})
    assert r.status_code == 409
    r = client.post("/api/auth/register", json={"name": "A", "email": "b@test.com", "password": "short"})
    assert r.status_code == 400
    r = client.post("/api/auth/login", json={"email": "ali@test.com", "password": "wrong"})
    assert r.status_code == 401
    h = login(client, "ali@test.com", "Password123")
    me = client.get("/api/auth/me", headers=h).json["data"]
    assert me["email"] == "ali@test.com" and "password_hash" not in me


def test_customer_cannot_use_admin_routes(client):
    h = register(client)
    assert client.get("/api/admin/stats", headers=h).status_code == 403
    assert client.post("/api/products", json={"name": "x"}, headers=h).status_code == 403
    assert client.get("/api/admin/stats").status_code == 401


def test_search_filter_sort(client):
    r = client.get("/api/products", query_string={"category": "Electronics", "limit": 100})
    assert r.json["pagination"]["total"] == 10
    r = client.get("/api/products", query_string={"sort": "price-low", "limit": 100})
    prices = [p["price"] for p in r.json["data"]]
    assert prices == sorted(prices)
    r = client.get("/api/products", query_string={"search": "headphones"})
    assert any("Headphones" in p["name"] for p in r.json["data"])
    r = client.get("/api/products", query_string={"search": ".*("})  # regex injection safe
    assert r.status_code == 200


def test_admin_product_crud(client):
    h = login(client, *ADMIN)
    r = client.post("/api/products", headers=h, json={
        "name": "Test Lamp", "category": "Lifestyle", "price": 1500, "stock": 3,
        "image": "https://example.com/a.jpg",
    })
    assert r.status_code == 201
    pid = r.json["data"]["id"]
    r = client.post("/api/products", headers=h, json={"name": "X", "category": "Nope", "price": 1, "stock": 1})
    assert r.status_code == 400
    r = client.put(f"/api/products/{pid}", headers=h, json={"price": 1800})
    assert r.json["data"]["price"] == 1800
    assert client.delete(f"/api/products/{pid}", headers=h).status_code == 200
    assert client.get(f"/api/products/{pid}").status_code == 404
    assert client.get("/api/products/not-an-id").status_code == 400


def test_order_uses_server_price_and_reduces_stock(client):
    h = register(client)
    p = first_product(client, category="Electronics")
    r = client.post("/api/orders", headers=h, json={
        "customer": CUSTOMER,
        "items": [{"productId": p["id"], "quantity": 2, "price": 1}],  # fake price ignored
    })
    assert r.status_code == 201, r.json
    order = r.json["data"]
    assert order["subtotal"] == p["price"] * 2
    assert order["status"] == "Pending"
    assert client.get(f"/api/products/{p['id']}").json["data"]["stock"] == p["stock"] - 2
    assert len(client.get("/api/orders/my", headers=h).json["data"]) == 1


def test_order_rejects_too_much_stock_and_rolls_back(client):
    h = register(client)
    products = client.get("/api/products", query_string={"limit": 2}).json["data"]
    a, b = products
    r = client.post("/api/orders", headers=h, json={
        "customer": CUSTOMER,
        "items": [{"productId": a["id"], "quantity": 1}, {"productId": b["id"], "quantity": b["stock"] + 1}],
    })
    assert r.status_code == 409
    assert client.get(f"/api/products/{a['id']}").json["data"]["stock"] == a["stock"]


def test_coupon_and_delivery(client):
    h = register(client)
    p = first_product(client, category="Electronics", sort="price-high")
    r = client.post("/api/coupons/validate", json={"code": "nova10", "subtotal": p["price"]})
    assert r.json["data"]["discount"] == round(p["price"] * 0.1)
    assert client.post("/api/coupons/validate", json={"code": "SAVE500", "subtotal": 100}).status_code == 400
    r = client.post("/api/orders", headers=h, json={
        "customer": CUSTOMER, "couponCode": "NOVA10",
        "items": [{"productId": p["id"], "quantity": 1}],
    })
    o = r.json["data"]
    assert o["discount"] == round(p["price"] * 0.1)
    assert o["deliveryFee"] == 0  # above free-delivery limit
    assert o["total"] == p["price"] - o["discount"]


def test_cancel_restores_stock_once(client):
    h = register(client)
    admin = login(client, *ADMIN)
    p = first_product(client)
    oid = client.post("/api/orders", headers=h, json={
        "customer": CUSTOMER, "items": [{"productId": p["id"], "quantity": 1}],
    }).json["data"]["id"]
    assert client.post(f"/api/orders/{oid}/cancel", headers=h).status_code == 200
    assert client.post(f"/api/orders/{oid}/cancel", headers=h).status_code == 409
    r = client.put(f"/api/admin/orders/{oid}/status", headers=admin, json={"status": "Shipped"})
    assert r.status_code == 409
    assert client.get(f"/api/products/{p['id']}").json["data"]["stock"] == p["stock"]


def test_other_user_cannot_see_order(client):
    h1 = register(client, "one@test.com")
    h2 = register(client, "two@test.com")
    p = first_product(client)
    oid = client.post("/api/orders", headers=h1, json={
        "customer": CUSTOMER, "items": [{"productId": p["id"], "quantity": 1}],
    }).json["data"]["id"]
    assert client.get(f"/api/orders/{oid}", headers=h2).status_code == 404
    assert client.post(f"/api/orders/{oid}/cancel", headers=h2).status_code == 404


def test_admin_status_stats_and_block(client):
    h = register(client)
    admin = login(client, *ADMIN)
    p = first_product(client)
    oid = client.post("/api/orders", headers=h, json={
        "customer": CUSTOMER, "items": [{"productId": p["id"], "quantity": 1}],
    }).json["data"]["id"]
    client.put(f"/api/admin/orders/{oid}/status", headers=admin, json={"status": "Delivered"})
    s = client.get("/api/admin/stats", headers=admin).json["data"]
    assert s["totalOrders"] == 1 and s["deliveredOrders"] == 1 and s["totalUsers"] == 1
    uid = client.get("/api/admin/users", headers=admin).json["data"][0]["id"]
    client.put(f"/api/admin/users/{uid}/block", headers=admin)
    assert client.get("/api/auth/me", headers=h).status_code == 403
    r = client.post("/api/auth/login", json={"email": "ali@test.com", "password": "Password123"})
    assert r.status_code == 403


def test_reviews_update_rating(client):
    h = register(client)
    p = first_product(client)
    r = client.post(f"/api/products/{p['id']}/reviews", headers=h, json={"rating": 4, "comment": "Good"})
    assert r.status_code == 201
    assert client.post(f"/api/products/{p['id']}/reviews", headers=h, json={"rating": 5}).status_code == 409
    prod = client.get(f"/api/products/{p['id']}").json["data"]
    assert prod["rating"] == 4 and prod["reviewCount"] == 1


def test_wishlist_toggle(client):
    h = register(client)
    p = first_product(client)
    assert client.post(f"/api/wishlist/{p['id']}", headers=h).json["data"]["inWishlist"] is True
    assert len(client.get("/api/wishlist", headers=h).json["data"]) == 1
    assert client.post(f"/api/wishlist/{p['id']}", headers=h).json["data"]["inWishlist"] is False


def test_forgot_and_reset_password(client, monkeypatch):
    register(client)
    sent = {}
    import routes.auth as auth_module
    monkeypatch.setattr(auth_module, "send_email", lambda to, s, body: sent.update(body=body))
    assert client.post("/api/auth/forgot-password", json={"email": "ali@test.com"}).status_code == 200
    code = sent["body"].split("code is: ")[1][:6]
    assert "code" not in client.post("/api/auth/forgot-password", json={"email": "ali@test.com"}).json.get("data", {})
    # naya code bheja gaya, purana bekaar
    code = sent["body"].split("code is: ")[1][:6]
    bad = client.post("/api/auth/reset-password", json={"email": "ali@test.com", "code": "000000" if code != "000000" else "111111", "newPassword": "NewPass123"})
    assert bad.status_code == 400
    r = client.post("/api/auth/reset-password", json={"email": "ali@test.com", "code": code, "newPassword": "NewPass123"})
    assert r.status_code == 200
    login(client, "ali@test.com", "NewPass123")


def test_contact_message(client):
    r = client.post("/api/contact", json={"name": "Sara", "email": "sara@test.com", "message": "Hello"})
    assert r.status_code == 201
    admin = login(client, *ADMIN)
    assert len(client.get("/api/admin/messages", headers=admin).json["data"]) == 1
