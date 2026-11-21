
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Package,
  ShoppingBag,
  CalendarDays,
  Download,
} from "lucide-react";

export default function Orders() {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [checking, setChecking] = useState(true);

  function loadOrders() {
    try {
      const currentUser = JSON.parse(
        localStorage.getItem("demoUser") || "null"
      );

      if (!currentUser) {
        setOrders([]);
        setChecking(false);
        navigate("/login", { replace: true });
        return;
      }

      if (currentUser.role === "admin") {
        setOrders([]);
        setChecking(false);
        navigate("/admin", { replace: true });
        return;
      }

      if (currentUser.role !== "customer") {
        setOrders([]);
        setChecking(false);
        navigate("/login", { replace: true });
        return;
      }

      const users = JSON.parse(
        localStorage.getItem("users") || "[]"
      );

      const savedUser = users.find(
        (item) =>
          item.email?.toLowerCase() ===
          currentUser.email?.toLowerCase()
      );

      if (savedUser?.isBlocked) {
        localStorage.removeItem("demoUser");
        setOrders([]);
        setChecking(false);

        alert(
          "Your account has been blocked. Please contact support."
        );

        navigate("/login", { replace: true });
        return;
      }

      const savedOrders = JSON.parse(
        localStorage.getItem("orders") || "[]"
      );

      if (!currentUser.email) {
        setOrders([]);
        setChecking(false);
        return;
      }

      const userEmail = currentUser.email.toLowerCase();

      const userOrders = savedOrders.filter((order) => {
        const orderEmail = (
          order.email ||
          order.customer?.email ||
          ""
        ).toLowerCase();

        if (orderEmail) {
          return orderEmail === userEmail;
        }

        return (
          order.customer?.name === currentUser.name &&
          order.customer?.phone === currentUser.phone &&
          Boolean(currentUser.phone)
        );
      });

      setOrders(userOrders);
      setChecking(false);
    } catch (error) {
      console.error("Orders loading error:", error);
      setOrders([]);
      setChecking(false);
    }
  }

  useEffect(() => {
    loadOrders();

    window.addEventListener("storage", loadOrders);
    window.addEventListener("focus", loadOrders);
    window.addEventListener("ordersUpdated", loadOrders);

    return () => {
      window.removeEventListener("storage", loadOrders);
      window.removeEventListener("focus", loadOrders);
      window.removeEventListener("ordersUpdated", loadOrders);
    };
  }, []);

  // Invoice ke liye HTML special characters safe karta hai
  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
      const entities = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      };

      return entities[char];
    });
  }

  function formatMoney(value) {
    return Number(value || 0).toLocaleString("en-PK");
  }

  // PDF Invoice
  function downloadInvoice(order) {
    const printWindow = window.open(
      "",
      "_blank",
      "width=900,height=700"
    );

    if (!printWindow) {
      alert(
        "Please allow pop-ups for this website to download your invoice."
      );
      return;
    }

    const items = order.items || [];

    const calculatedSubtotal = items.reduce(
      (sum, item) =>
        sum +
        Number(item.price || 0) *
          Number(item.quantity || 0),
      0
    );

    const subtotal = Number(
      order.subtotal ?? calculatedSubtotal
    );

    const discount = Number(order.discount || 0);

    const total = Number(
      order.total ?? Math.max(0, subtotal - discount)
    );

    const orderId = escapeHTML(
      String(order.id || "N/A").slice(-8)
    );

    const productsHTML = items
      .map((item, index) => {
        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const lineTotal = price * quantity;

        return `
          <tr>
            <td>${index + 1}</td>
            <td>${escapeHTML(item.name || "Product")}</td>
            <td>${quantity}</td>
            <td>Rs. ${formatMoney(price)}</td>
            <td>Rs. ${formatMoney(lineTotal)}</td>
          </tr>
        `;
      })
      .join("");

    const customer = order.customer || {};

    const couponCode =
      typeof order.coupon === "string"
        ? order.coupon
        : order.coupon?.code ||
          order.couponCode ||
          "";

    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Invoice - ${orderId}</title>

        <style>
          * {
            box-sizing: border-box;
          }

          body {
            font-family: Arial, sans-serif;
            color: #222;
            margin: 0;
            padding: 35px;
            background: #fff;
          }

          .invoice {
            max-width: 850px;
            margin: auto;
          }

          .top {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 3px solid #a3e635;
            padding-bottom: 20px;
          }

          h1 {
            margin: 0 0 8px;
            font-size: 30px;
          }

          .store-name {
            font-size: 22px;
            font-weight: bold;
            color: #222;
          }

          .muted {
            color: #666;
            font-size: 13px;
          }

          .invoice-info {
            text-align: right;
          }

          .section {
            margin-top: 28px;
          }

          .section h3 {
            margin-bottom: 10px;
            font-size: 15px;
            border-bottom: 1px solid #ddd;
            padding-bottom: 8px;
          }

          .customer-info p {
            margin: 6px 0;
            font-size: 14px;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }

          th, td {
            padding: 12px 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
            font-size: 13px;
          }

          th {
            background: #f1f5e9;
          }

          .totals {
            width: 320px;
            margin-left: auto;
            margin-top: 22px;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            font-size: 14px;
          }

          .grand-total {
            border-top: 2px solid #222;
            margin-top: 8px;
            padding-top: 12px;
            font-size: 19px;
            font-weight: bold;
          }

          .footer {
            text-align: center;
            border-top: 1px solid #ddd;
            margin-top: 45px;
            padding-top: 18px;
            color: #666;
            font-size: 13px;
          }

          .print-button {
            display: block;
            margin: 25px auto;
            padding: 12px 25px;
            background: #a3e635;
            color: #111;
            border: none;
            border-radius: 6px;
            font-size: 15px;
            font-weight: bold;
            cursor: pointer;
          }

          @media print {
            body {
              padding: 0;
            }

            .print-button {
              display: none;
            }

            .invoice {
              max-width: 100%;
            }
          }
        </style>
      </head>

      <body>
        <div class="invoice">

          <div class="top">
            <div>
              <div class="store-name">E-COMMERCE STORE</div>
              <p class="muted">Thank you for shopping with us.</p>
            </div>

            <div class="invoice-info">
              <h1>INVOICE</h1>
              <p><strong>Invoice #:</strong> ${orderId}</p>
              <p><strong>Date:</strong> ${escapeHTML(order.date || "N/A")}</p>
              <p><strong>Status:</strong> ${escapeHTML(order.status || "Pending")}</p>
            </div>
          </div>

          <div class="section customer-info">
            <h3>Customer Details</h3>
            <p><strong>Name:</strong> ${escapeHTML(customer.name || "N/A")}</p>
            <p><strong>Email:</strong> ${escapeHTML(order.email || customer.email || "N/A")}</p>
            <p><strong>Phone:</strong> ${escapeHTML(customer.phone || "N/A")}</p>
            <p><strong>Address:</strong> ${escapeHTML(customer.address || "N/A")}</p>
            <p><strong>City:</strong> ${escapeHTML(customer.city || "N/A")}</p>
          </div>

          <div class="section">
            <h3>Order Items</h3>

            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Product</th>
                  <th>Qty</th>
                  <th>Price</th>
                  <th>Total</th>
                </tr>
              </thead>

              <tbody>
                ${productsHTML}
              </tbody>
            </table>
          </div>

          <div class="totals">
            <div class="total-row">
              <span>Subtotal</span>
              <strong>Rs. ${formatMoney(subtotal)}</strong>
            </div>

            ${
              couponCode
                ? `<div class="total-row">
                    <span>Coupon (${escapeHTML(couponCode)})</span>
                    <strong>Applied</strong>
                  </div>`
                : ""
            }

            <div class="total-row">
              <span>Discount</span>
              <strong>- Rs. ${formatMoney(discount)}</strong>
            </div>

            <div class="total-row">
              <span>Payment</span>
              <strong>${escapeHTML(order.paymentMethod || "Cash on Delivery")}</strong>
            </div>

            <div class="total-row grand-total">
              <span>Grand Total</span>
              <span>Rs. ${formatMoney(total)}</span>
            </div>
          </div>

          <div class="footer">
            <strong>Thank you for your order!</strong>
            <p>This is a computer-generated invoice.</p>
          </div>

          <button class="print-button" onclick="window.print()">
            Download / Save as PDF
          </button>

        </div>

        <script>
          window.onload = function () {
            window.focus();
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
  }

  if (checking) {
    return (
      <div className="page-container empty-orders">
        <p>Loading your orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="page-container empty-orders">
        <Package size={58} />

        <h1>No Orders Yet</h1>

        <p>
          You haven't placed any orders. Explore our collection
          and find something you love.
        </p>

        <Link to="/products" className="primary-btn">
          Start Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container orders-page">

      <div className="orders-heading">
        <div>
          <h1>My Orders</h1>
          <p>View and track your recent purchases.</p>
        </div>

        <span className="orders-count">
          {orders.length}{" "}
          {orders.length === 1 ? "Order" : "Orders"}
        </span>
      </div>

      <div className="orders-list">

        {orders.map((order) => {
  const trackingSteps = [
    "Pending",
    "Processing",
    "Shipped",
    "Delivered",
  ];

  const currentStatus = order.status || "Pending";
  const currentStep = trackingSteps.indexOf(currentStatus);

  return (
    <article className="order-card" key={order.id}>

      <div className="order-card-header">
        <div>
          <span className="order-label">ORDER ID</span>

          <strong>
            #{String(order.id).slice(-8)}
          </strong>
        </div>

        <span
          className={`order-status ${currentStatus.toLowerCase()}`}
        >
          {currentStatus}
        </span>
      </div>

      <div className="order-meta">
        <span>
          <CalendarDays size={15} />
          {order.date || "Date unavailable"}
        </span>

        <span>
          <ShoppingBag size={15} />
          {order.items?.length || 0} products
        </span>
      </div>

      {/* ORDER TRACKING */}
      <div className="order-tracking">
        <h3>Order Tracking</h3>

        {currentStatus === "Cancelled" ? (
          <div className="tracking-cancelled">
            <strong>Order Cancelled</strong>
            <p>Your order has been cancelled.</p>
          </div>
        ) : (
          <div className="tracking-steps">
            {trackingSteps.map((step, index) => (
              <div
                className={`tracking-step ${
                  currentStep >= index ? "completed" : ""
                }`}
                key={step}
              >
                <div className="tracking-circle">
                  {currentStep > index ? "✓" : index + 1}
                </div>

                <span>{step}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ORDER PRODUCTS */}
      <div className="order-products">
        {(order.items || []).map((item, index) => (
          <div
            className="order-product"
            key={`${item.id}-${index}`}
          >
            <img
              src={item.image}
              alt={item.name}
            />

            <div className="order-product-info">
              <strong>{item.name}</strong>

              <span>
                Quantity: {item.quantity}
              </span>
            </div>

            <strong className="order-product-price">
              Rs.{" "}
              {(
                Number(item.price) *
                Number(item.quantity)
              ).toLocaleString("en-PK")}
            </strong>
          </div>
        ))}
      </div>

      {/* PAYMENT AND TOTAL */}
      <div className="order-card-footer">
        <div>
          <span>Payment</span>

          <strong>
            {order.paymentMethod || "Cash on Delivery"}
          </strong>
        </div>

        <div className="order-total">
          <span>Total Amount</span>

          <strong>
            Rs.{" "}
            {Number(order.total || 0).toLocaleString("en-PK")}
          </strong>
        </div>
      </div>

      {/* DELIVERY ADDRESS */}
      {order.customer && (
        <div className="order-delivery">
          <strong>Delivery Address</strong>

          <p>
            {order.customer.name}, {order.customer.phone}
          </p>

          <p>
            {order.customer.address}, {order.customer.city}
          </p>
        </div>
      )}

      {/* DOWNLOAD INVOICE */}
      <div className="order-invoice-action">
        <button
          type="button"
          className="primary-btn"
          onClick={() => downloadInvoice(order)}
        >
          <Download size={17} />
          Download Invoice
        </button>
      </div>

    </article>
  );
})}
      </div>
    </div>
  );
}
