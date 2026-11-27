
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  MapPin,
  Phone,
  User,
  ShoppingBag,
  Trash2,
  Tag,
  X,
} from "lucide-react";

import { validateCoupon } from "../data/couponStore";
import { deliveryFeeFor, placeOrder as submitOrder } from "../data/orderStore";
import { getCurrentUser, isLoggedIn } from "../api/client";

export default function Checkout({ cart, clearCart, removeFromCart }) {
  const navigate = useNavigate();

  const currentUser = isLoggedIn() ? getCurrentUser() : null;

  const [form, setForm] = useState({
    name: currentUser?.name || "",
    phone: currentUser?.phone || "",
    address: currentUser?.address || "",
    city: currentUser?.city || "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");

  const subtotal = cart.reduce(
    (sum, item) =>
      sum + Number(item.price) * Number(item.quantity),
    0
  );

  const discount = appliedCoupon
    ? appliedCoupon.discount
    : 0;

  // Delivery fee ka hisaab server wala hi hai (backend .env se match hona chahiye)
  const deliveryFee = deliveryFeeFor(subtotal);
  const total = Math.max(0, subtotal - discount) + deliveryFee;

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  async function applyCoupon() {
    setCouponError("");
    setCouponMessage("");

    const result = await validateCoupon(couponCode, subtotal);

    if (!result.valid) {
      setAppliedCoupon(null);
      setCouponError(result.error);
      return;
    }

    setAppliedCoupon({
      code: result.coupon.code,
      discount: result.discount,
      type: result.coupon.type,
      value: result.coupon.value,
    });

    setCouponMessage(
      `Coupon applied! You saved Rs. ${result.discount.toLocaleString("en-PK")}.`
    );
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
    setCouponError("");
  }

  async function placeOrder(e) {
    e.preventDefault();

    if (loading) return;

    setError("");

    if (!isLoggedIn()) {
      setError("Please login before placing an order.");
      navigate("/login");
      return;
    }

    if (getCurrentUser()?.role !== "customer") {
      setError("Only customers can place orders.");
      return;
    }

    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }

    if (
      !form.name.trim() ||
      !form.phone.trim() ||
      !form.city.trim() ||
      !form.address.trim()
    ) {
      setError("Please complete all delivery details.");
      return;
    }

    setLoading(true);

    try {
      // Stock, qeemat aur coupon sab server check karta hai
      await submitOrder({
        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
        },
        cart,
        couponCode: appliedCoupon?.code,
      });

      clearCart(cart.map((item) => item.id));

      alert("Your order has been placed successfully!");

      navigate("/orders");
    } catch (err) {
      if (err.status === 401) {
        navigate("/login");
      }

      setError(err.message || "Unable to place your order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (cart.length === 0) {
    return (
      <div className="page-container empty-cart">
        <ShoppingBag size={55} />
        <h2>Your Cart is Empty</h2>
        <p>Add products before proceeding to checkout.</p>
        <Link to="/products" className="primary-btn">
          Shop Now
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container checkout-page">
      <h1>Checkout</h1>

      <p>
        Enter your delivery details to complete your order.
      </p>

      <div className="checkout-layout">
        <form
          className="checkout-form"
          onSubmit={placeOrder}
        >
          <h2>Delivery Information</h2>

          <label>
            <User size={17} /> Full Name
          </label>

          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Enter your full name"
            required
          />

          <label>
            <Phone size={17} /> Phone Number
          </label>

          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            placeholder="03XXXXXXXXX"
            pattern="03[0-9]{9}"
            title="Enter a valid Pakistani mobile number, e.g. 03001234567"
            required
          />

          <label>
            <MapPin size={17} /> City
          </label>

          <input
            name="city"
            value={form.city}
            onChange={handleChange}
            placeholder="Enter your city"
            required
          />

          <label>
            <MapPin size={17} /> Complete Address
          </label>

          <textarea
            name="address"
            value={form.address}
            onChange={handleChange}
            placeholder="House number, street, area..."
            rows="4"
            required
          />

          <h2>Payment Method</h2>

          <div className="payment-option">
            <input type="radio" checked readOnly />
            <div>
              <strong>Cash on Delivery</strong>
              <p>Pay when your order arrives.</p>
            </div>
          </div>

          {error && (
            <p className="checkout-error">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="primary-btn place-order-btn"
            disabled={loading}
          >
            {loading
              ? "Processing Order..."
              : `Place Order · Rs. ${total.toLocaleString("en-PK")}`}
          </button>
        </form>

        <aside className="checkout-summary">
          <h2>Your Order</h2>

          {cart.map((item) => (
            <div
              className="checkout-product"
              key={item.id}
            >
              <img
                src={item.image}
                alt={item.name}
              />

              <div className="checkout-product-info">
                <strong>{item.name}</strong>

                <p>Quantity: {item.quantity}</p>

                <b>
                  Rs. {(
                    Number(item.price) * item.quantity
                  ).toLocaleString("en-PK")}
                </b>
              </div>

              <button
                type="button"
                className="checkout-remove-btn"
                onClick={() => {
                  removeFromCart(item.id);
                  removeCoupon();
                }}
                title="Remove this product"
              >
                <Trash2 size={18} />
              </button>
            </div>
          ))}

          {/* COUPON SECTION */}
          <div className="checkout-coupon">
            <h3>
              <Tag size={18} /> Apply Discount Coupon
            </h3>

            {!appliedCoupon ? (
              <>
                <div className="coupon-input-row">
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponError("");
                      setCouponMessage("");
                    }}
                  />

                  <button
                    type="button"
                    className="primary-btn"
                    onClick={applyCoupon}
                  >
                    Apply
                  </button>
                </div>

                {couponError && (
                  <p className="coupon-error">
                    {couponError}
                  </p>
                )}
              </>
            ) : (
              <div className="coupon-applied">
                <div>
                  <strong>{appliedCoupon.code}</strong>
                  <p>{couponMessage}</p>
                </div>

                <button
                  type="button"
                  onClick={removeCoupon}
                  title="Remove coupon"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          <div className="checkout-total">
            <span>Subtotal</span>
            <strong>
              Rs. {subtotal.toLocaleString("en-PK")}
            </strong>
          </div>

          {appliedCoupon && (
            <div className="checkout-total coupon-discount-row">
              <span>Discount</span>
              <strong>
                - Rs. {discount.toLocaleString("en-PK")}
              </strong>
            </div>
          )}

          <div className="checkout-total">
            <span>Delivery</span>
            <strong>
              {deliveryFee === 0
                ? "Free"
                : `Rs. ${deliveryFee.toLocaleString("en-PK")}`}
            </strong>
          </div>

          <div className="checkout-total grand-total">
            <span>Total</span>
            <strong>
              Rs. {total.toLocaleString("en-PK")}
            </strong>
          </div>
        </aside>
      </div>
    </div>
  );
}
