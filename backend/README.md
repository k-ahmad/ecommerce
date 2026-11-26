# NovaStore Backend (Flask + MongoDB)

Yeh aap ki website aur mobile app dono ka "dimaagh" hai. Saara data (products, users, orders) ab MongoDB database mein save hoga, browser mein nahi.

## Files kya karti hain

| File | Kaam |
|---|---|
| `app.py` | Server shuru karta hai |
| `config.py` | Settings (`.env` file se parhta hai) |
| `extensions.py` | MongoDB connection |
| `utils.py` | Helper functions, login/admin check |
| `mailer.py` | Password reset ki email |
| `routes/auth.py` | Register, login, profile, forgot password |
| `routes/products.py` | Products aur categories |
| `routes/orders.py` | Orders aur coupons |
| `routes/store.py` | Reviews, wishlist, contact, admin stats/customers |
| `seed.py` | Database mein shuru ka data daalta hai |
| `tests/test_api.py` | Automatic tests |

## Chalane ka tareeqa (Windows)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Ab `.env` file kholein aur yeh likhein:
- `MONGO_URI`: apne computer par MongoDB ho to `mongodb://localhost:27017`, warna MongoDB Atlas ka link
- `ADMIN_EMAIL` aur `ADMIN_PASSWORD`: apna admin login
- `SECRET_KEY` aur `JWT_SECRET_KEY`: lambi random strings

Phir:

```bash
python seed.py      # ek baar: products, categories, coupons aur admin banata hai
python app.py       # server chal jayega: http://localhost:5000
```

Check karne ke liye browser mein kholein: http://localhost:5000/api/health

Tests chalane ke liye: `pytest -q`

## Login kaise kaam karta hai

Login/register par server ek **token** deta hai. Frontend har request ke saath yeh header bhejta hai:

```
Authorization: Bearer <token>
```

## Saari APIs

**Auth**
- `POST /api/auth/register`: `{name, email, password, phone}`
- `POST /api/auth/login`: `{email, password}`
- `GET /api/auth/me`, `PUT /api/auth/me` 🔒
- `PUT /api/auth/change-password` 🔒: `{currentPassword, newPassword}`
- `POST /api/auth/forgot-password`: `{email}` (code email par jata hai)
- `POST /api/auth/reset-password`: `{email, code, newPassword}`

**Products & Categories**
- `GET /api/products?search=&category=&minPrice=&maxPrice=&sort=&page=&limit=`
  - sort: `newest`, `price-low`, `price-high`, `rating`, `name`
- `GET /api/products/:id`
- `POST /api/products`, `PUT /api/products/:id`, `DELETE /api/products/:id` 👑
- `GET /api/categories`
- `POST /api/categories`, `PUT /api/categories/:id`, `DELETE /api/categories/:id` 👑

**Orders & Coupons**
- `POST /api/orders` 🔒: `{customer: {name, phone, city, address}, items: [{productId, quantity}], couponCode}`
- `GET /api/orders/my` 🔒, `GET /api/orders/:id` 🔒
- `POST /api/orders/:id/cancel` 🔒 (sirf Pending order)
- `POST /api/coupons/validate`: `{code, subtotal}`
- `GET/POST /api/coupons`, `PUT/DELETE /api/coupons/:id` 👑
- `GET /api/admin/orders?status=` 👑
- `PUT /api/admin/orders/:id/status` 👑: `{status}` (Pending, Shipped, Delivered, Cancelled)

**Reviews, Wishlist, Contact**
- `GET /api/products/:id/reviews`, `POST /api/products/:id/reviews` 🔒 `{rating, comment}`
- `DELETE /api/reviews/:id` 🔒
- `GET /api/wishlist` 🔒, `POST /api/wishlist/:productId` 🔒 (add/remove toggle)
- `POST /api/contact`: `{name, email, subject, message}`

**Admin**
- `GET /api/admin/stats` 👑
- `GET /api/admin/users` 👑, `PUT /api/admin/users/:id/block` 👑
- `GET /api/admin/messages` 👑

🔒 = login zaroori   👑 = sirf admin

## Security ki baatein jo is backend mein hain

- Password **bcrypt** se encrypt hota hai, asal password kahin save nahi hota
- Admin password code mein nahi, `.env` mein hai
- Order ki qeemat server database se calculate karta hai, frontend ki bheji hui qeemat nahi maanta
- Stock check aur stock kam karna ek saath hota hai, is liye do log aakhri piece ek saath nahi khareed sakte
- Order cancel ho to stock wapas aata hai, aur sirf ek baar
- Blocked user login nahi kar sakta
