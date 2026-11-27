import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ShoppingBag,
  Menu,
  X,
  LogOut,
  Heart,
  UserRound,
} from "lucide-react";
import { useEffect, useState } from "react";
import { getWishlist } from "../data/wishlistStore";
import { getCurrentUser, isLoggedIn } from "../api/client";
import { logout } from "../data/authStore";

function readUser() {
  return isLoggedIn() ? getCurrentUser() : null;
}

export default function Navbar({ cartCount = 0 }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(readUser);
  const [wishlistCount, setWishlistCount] = useState(
    () => getWishlist().length
  );

  const location = useLocation();
  const navigate = useNavigate();

  // Login user ki information load karo (login/logout par update)
  useEffect(() => {
    setUser(readUser());
  }, [location.pathname]);

  useEffect(() => {
    function refreshUser() {
      setUser(readUser());
    }

    window.addEventListener("authChanged", refreshUser);
    return () => window.removeEventListener("authChanged", refreshUser);
  }, []);

  // Wishlist count update karo
  useEffect(() => {
    function refreshWishlistCount() {
      setWishlistCount(getWishlist().length);
    }

    window.addEventListener(
      "wishlistUpdated",
      refreshWishlistCount
    );

    return () => {
      window.removeEventListener(
        "wishlistUpdated",
        refreshWishlistCount
      );
    };
  }, []);

  // Logout function
  function handleLogout() {
    logout();

    setUser(null);
    setOpen(false);

    alert("Logout successful!");

    navigate("/login");
  }

  // Admin links
  const adminLinks = [
    ["Home", "/"],
    ["Shop", "/products"],
    ["About", "/about"],
    ["Contact", "/contact"],
    ["Admin Dashboard", "/admin"],
  ];

  // Customer links
  const customerLinks = [
    ["Home", "/"],
    ["Shop", "/products"],
    ["About", "/about"],
    ["Contact", "/contact"],
    ["My Orders", "/orders"],
    ["My Account", "/account"],
  ];

  // Guest links
  const guestLinks = [
    ["Home", "/"],
    ["Shop", "/products"],
    ["About", "/about"],
    ["Contact", "/contact"],
  ];

  const links = user?.role === "admin"
    ? adminLinks
    : user
    ? customerLinks
    : guestLinks;

  return (
    <header className="navbar">
      <div className="container nav-content">

        <Link
          to="/"
          className="logo"
          onClick={() => setOpen(false)}
        >
          NOVA<span>STORE.</span>
        </Link>

        <button
          className="icon-btn menu-btn"
          onClick={() => setOpen(!open)}
        >
          {open ? <X /> : <Menu />}
        </button>

        <nav className={open ? "nav-links active" : "nav-links"}>
          {links.map(([label, path]) => (
            <NavLink
              key={path}
              to={path}
              onClick={() => setOpen(false)}
            >
              {label}
            </NavLink>
          ))}

          {/* Mobile menu: login/logout yahan dikhte hain */}
          <div className="nav-mobile-auth">
            {!user && (
              <Link to="/login" className="primary-btn" onClick={() => setOpen(false)}>
                <UserRound size={16} />
                Login
              </Link>
            )}

            {user && (
              <button type="button" className="secondary-btn" onClick={handleLogout}>
                <LogOut size={16} />
                Logout
              </button>
            )}
          </div>
        </nav>

        <div className="nav-actions">

          {/* Wishlist Heart Icon */}
          <Link
            to="/wishlist"
            className="icon-btn wishlist-nav-btn"
            onClick={() => setOpen(false)}
            title="My Wishlist"
          >
            <Heart size={20} />
            <span>{wishlistCount}</span>
          </Link>

          {/* Sirf ek button: Login page par "Create Account" ka link maujood hai */}
          {!user && (
            <Link
              to="/login"
              className="primary-btn nav-desktop-only"
            >
              <UserRound size={16} />
              Login
            </Link>
          )}

          {user?.role !== "admin" && (
            <Link
              to="/cart"
              className="icon-btn cart-btn"
              onClick={() => setOpen(false)}
            >
              <ShoppingBag />
              <span>{cartCount}</span>
            </Link>
          )}

          {user && (
            <button
              type="button"
              className="secondary-btn nav-desktop-only"
              onClick={handleLogout}
            >
              <LogOut size={16} />
              Logout
            </button>
          )}

        </div>
      </div>
    </header>
  );
}