import ForgotPassword from "./pages/ForgotPassword";
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Account from "./pages/Account";
import Orders from "./pages/Orders";
import Contact from "./pages/Contact";
import About from "./pages/About";
import Admin from "./pages/Admin";
import Wishlist from "./pages/Wishlist";

import "./App.css";
import "./styles/Pages.css";

// ADMIN SECURITY
function AdminRoute({ children }) {
  let currentUser = null;

  try {
    currentUser = JSON.parse(localStorage.getItem("demoUser") || "null");
  } catch (error) {
    console.error("User loading error:", error);
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role !== "admin") {
    return <Navigate to="/" replace />;
  }

  return children;
}

function Store() {
  // LOAD CART FROM LOCALSTORAGE
  const [cart, setCart] = useState(() => {
    try {
      const savedCart = JSON.parse(localStorage.getItem("cart") || "[]");

      if (!Array.isArray(savedCart)) return [];

      return savedCart.map((item) => ({
        ...item,
        quantity: Math.max(1, Number(item.quantity) || 1),
        selected: item.selected !== false,
      }));
    } catch (error) {
      console.error("Cart loading error:", error);
      return [];
    }
  });

  // SAVE CART
  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  // ADD PRODUCT TO CART
  function addToCart(product) {
    const existing = cart.find(
      (item) => String(item.id) === String(product.id),
    );

    const stockAvailable =
      product.stock !== undefined &&
      product.stock !== null &&
      product.stock !== "";

    const stock = stockAvailable ? Number(product.stock) : Infinity;

    if (stock <= 0) {
      alert("Sorry! This product is out of stock.");
      return;
    }

    const currentQuantity = existing ? existing.quantity : 0;

    if (currentQuantity >= stock) {
      alert("Sorry! Available stock limit reached.");
      return;
    }

    if (existing) {
      setCart((currentCart) =>
        currentCart.map((item) =>
          String(item.id) === String(product.id)
            ? {
                ...item,
                quantity: item.quantity + 1,
              }
            : item,
        ),
      );
    } else {
      setCart((currentCart) => [
        ...currentCart,
        {
          ...product,
          quantity: 1,
          selected: true,
        },
      ]);
    }
  }

  // UPDATE PRODUCT QUANTITY
  function updateQuantity(id, amount) {
    const item = cart.find((product) => String(product.id) === String(id));

    if (!item) return;

    const stockAvailable =
      item.stock !== undefined && item.stock !== null && item.stock !== "";

    const stock = stockAvailable ? Number(item.stock) : Infinity;

    const newQuantity = item.quantity + amount;

    if (newQuantity > stock) {
      alert("Sorry! Available stock limit reached.");
      return;
    }

    setCart((currentCart) =>
      currentCart
        .map((product) =>
          String(product.id) === String(id)
            ? {
                ...product,
                quantity: product.quantity + amount,
              }
            : product,
        )
        .filter((product) => product.quantity > 0),
    );
  }

  // REMOVE SINGLE PRODUCT
  function removeFromCart(id) {
    setCart((currentCart) =>
      currentCart.filter((item) => String(item.id) !== String(id)),
    );
  }

  // SELECT OR UNSELECT PRODUCT
  function toggleSelection(id) {
    setCart((currentCart) =>
      currentCart.map((item) =>
        String(item.id) === String(id)
          ? {
              ...item,
              selected: item.selected === false,
            }
          : item,
      ),
    );
  }

  // SELECTED PRODUCTS ONLY
  function getSelectedCart(currentCart) {
    return currentCart.filter((item) => item.selected !== false);
  }

  const selectedCart = getSelectedCart(cart);

  // CLEAR ONLY ORDERED PRODUCTS
  function clearCart(orderedIds = []) {
    const ids = orderedIds.map(String);

    setCart((currentCart) =>
      currentCart.filter((item) => !ids.includes(String(item.id))),
    );
  }

  // NAVBAR CART COUNT
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <>
      <Navbar cartCount={cartCount} />

      <Routes>
        <Route path="/" element={<Home addToCart={addToCart} />} />

        <Route path="/products" element={<Products addToCart={addToCart} />} />

        {/* PRODUCT DETAILS - BOTH URLS SUPPORTED */}
        <Route
          path="/product/:id"
          element={<ProductDetails addToCart={addToCart} />}
        />

        <Route
          path="/products/:id"
          element={<ProductDetails addToCart={addToCart} />}
        />

        <Route
          path="/cart"
          element={
            <Cart
              cart={cart}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              toggleSelection={toggleSelection}
            />
          }
        />

        <Route
          path="/checkout"
          element={
            <Checkout
              cart={selectedCart}
              clearCart={clearCart}
              removeFromCart={removeFromCart}
            />
          }
        />

        <Route path="/login" element={<Login />} />

        <Route path="/register" element={<Register />} />

        <Route path="/forgot-password" element={<ForgotPassword />} />

        <Route path="/account" element={<Account />} />

        <Route path="/orders" element={<Orders />} />

        <Route path="/contact" element={<Contact />} />

        <Route path="/about" element={<About />} />

        {/* WISHLIST */}
        <Route path="/wishlist" element={<Wishlist addToCart={addToCart} />} />

        {/* ADMIN */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          }
        />

        {/* 404 PAGE */}
        <Route
          path="*"
          element={
            <main className="container section">
              <h1 className="section-heading">404 - Page Not Found</h1>

              <a href="/" className="primary-btn">
                Go Home
              </a>
            </main>
          }
        />
      </Routes>

      <Footer />
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Store />
    </BrowserRouter>
  );
}
