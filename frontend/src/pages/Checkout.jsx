
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

import {
  getProducts,
  saveProducts,
} from "../data/productStore";

import { validateCoupon } from "../data/couponStore";

export default function Checkout({ cart, clearCart, removeFromCart }) {
  const navigate = useNavigate();

  function getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("demoUser") || "null");
    } catch {
      return null;
    }
  }

  const currentUser = getCurrentUser();

  const [form, setForm] = useState({
    name: currentUser?.name || "",
    phone: currentUser?.phone || "",
    address: "",
    city: "",
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

  const total = Math.max(0, subtotal - discount);

  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  function applyCoupon() {
    setCouponError("");
    setCouponMessage("");

    const result = validateCoupon(couponCode, subtotal);

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

  function placeOrder(e) {
    e.preventDefault();

    if (loading) return;

    setError("");

    const user = getCurrentUser();

    if (!user) {
      setError("Please login before placing an order.");
      navigate("/login");
      return;
    }

    if (user.role !== "customer") {
      setError("Only customers can place orders.");
      return;
    }

    let users = [];

    try {
      users = JSON.parse(localStorage.getItem("users") || "[]");
    } catch (error) {
      console.error("Users loading error:", error);
    }

    const savedUser = users.find(
      (item) =>
        item.email?.toLowerCase() === user.email?.toLowerCase()
    );

    if (!savedUser || savedUser.isBlocked) {
      localStorage.removeItem("demoUser");
      setError(
        "Your account is blocked or unavailable. Please login again."
      );
      navigate("/login");
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

    let originalProducts = [];
    let stockUpdated = false;

    try {
      // Coupon ko order place karte waqt dobara verify karo
      let finalCoupon = null;
      let finalDiscount = 0;

      if (appliedCoupon) {
        const result = validateCoupon(
          appliedCoupon.code,
          subtotal
        );

        if (!result.valid) {
          throw new Error(
            result.error || "Your coupon is no longer valid."
          );
        }

        finalCoupon = result.coupon;
        finalDiscount = result.discount;
      }

      const finalTotal = Math.max(
        0,
        subtotal - finalDiscount
      );

      // Latest products and stock load karo
      originalProducts = getProducts();

      const quantities = new Map();

      for (const item of cart) {
        const quantity = Number(item.quantity);

        if (!Number.isInteger(quantity) || quantity <= 0) {
          throw new Error(`Invalid quantity for ${item.name}.`);
        }

        const id = String(item.id);

        quantities.set(
          id,
          (quantities.get(id) || 0) + quantity
        );
      }

      // Stock check
      for (const [id, quantity] of quantities) {
        const product = originalProducts.find(
          (item) => String(item.id) === id
        );

        if (!product) {
          throw new Error(
            "A product in your cart is no longer available. Please refresh your cart."
          );
        }

        const stock = Number(product.stock);

        if (!Number.isFinite(stock) || stock < 0) {
          throw new Error(
            `Stock information is unavailable for ${product.name}.`
          );
        }

        if (stock < quantity) {
          throw new Error(
            `Sorry! Only ${stock} units of ${product.name} are available.`
          );
        }
      }

      // Stock deduct karo
      const updatedProducts = originalProducts.map((product) => {
        const quantity = quantities.get(String(product.id)) || 0;

        if (quantity === 0) return product;

        return {
          ...product,
          stock: Number(product.stock) - quantity,
        };
      });

      const stockSaved = saveProducts(updatedProducts);

      if (stockSaved === false) {
        throw new Error(
          "Unable to update product stock. Please try again."
        );
      }

      stockUpdated = true;

      // Old orders load karo
      const oldOrders = JSON.parse(
        localStorage.getItem("orders") || "[]"
      );

      if (!Array.isArray(oldOrders)) {
        throw new Error("Unable to load previous orders.");
      }

      // Order create karo
      const order = {
        id: Date.now(),

        customer: {
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
          city: form.city.trim(),
          email: user.email,
        },

        email: user.email,

        items: cart.map((item) => ({
          ...item,
        })),

        subtotal,
        discount: finalDiscount,
        coupon: finalCoupon
          ? {
              code: finalCoupon.code,
              type: finalCoupon.type,
              value: finalCoupon.value,
            }
          : null,

        total: finalTotal,

        paymentMethod: "Cash on Delivery",
        status: "Pending",
        date: new Date().toLocaleDateString(),

        stockDeducted: true,
        stockRestored: false,
      };

      // Order save karo
      localStorage.setItem(
        "orders",
        JSON.stringify([order, ...oldOrders])
      );

      clearCart(cart.map((item) => item.id));

      window.dispatchEvent(new Event("ordersUpdated"));

      alert("Your order has been placed successfully!");

      navigate("/orders");
    } catch (error) {
      console.error("Order placement error:", error);

      if (stockUpdated) {
        saveProducts(originalProducts);
      }

      setError(
        error.message || "Unable to place your order. Please try again."
      );
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
            <strong>Free</strong>
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
