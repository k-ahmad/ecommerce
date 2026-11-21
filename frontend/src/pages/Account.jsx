
import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  Package,
  LogOut,
  Save,
  ShieldCheck,
  Edit3,
} from "lucide-react";

export default function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("demoUser") || "null");
    } catch {
      return null;
    }
  });

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.role === "admin") {
      navigate("/admin", { replace: true });
      return;
    }

    if (user.role !== "customer") {
      localStorage.removeItem("demoUser");
      navigate("/login", { replace: true });
      return;
    }

    try {
      const users = JSON.parse(
        localStorage.getItem("users") || "[]"
      );

      const savedUser = users.find(
        (item) =>
          item.email?.toLowerCase() === user.email?.toLowerCase()
      );

      if (savedUser?.isBlocked) {
        localStorage.removeItem("demoUser");
        setUser(null);
        alert("Your account has been blocked. Please contact support.");
        navigate("/login", { replace: true });
      }
    } catch (error) {
      console.error("Account verification error:", error);
    }
  }, [user, navigate]);

  function updateProfile(e) {
    e.preventDefault();

    if (!user || user.role !== "customer") return;

    if (!name.trim() || !phone.trim()) {
      setMessageType("error");
      setMessage("Please fill in your name and phone number.");
      return;
    }

    try {
      const users = JSON.parse(
        localStorage.getItem("users") || "[]"
      );

      const savedUser = users.find(
        (item) =>
          item.email?.toLowerCase() === user.email?.toLowerCase()
      );

      if (savedUser?.isBlocked) {
        localStorage.removeItem("demoUser");
        setUser(null);
        alert("Your account has been blocked.");
        navigate("/login");
        return;
      }

      const updatedUser = {
        ...user,
        name: name.trim(),
        phone: phone.trim(),
      };

      localStorage.setItem(
        "demoUser",
        JSON.stringify(updatedUser)
      );

      const updatedUsers = users.map((item) =>
        item.email?.toLowerCase() === user.email?.toLowerCase()
          ? {
              ...item,
              name: updatedUser.name,
              phone: updatedUser.phone,
            }
          : item
      );

      localStorage.setItem(
        "users",
        JSON.stringify(updatedUsers)
      );

      setUser(updatedUser);
      setMessageType("success");
      setMessage("Profile updated successfully!");
      window.dispatchEvent(new Event("usersUpdated"));
    } catch (error) {
      console.error("Profile update error:", error);
      setMessageType("error");
      setMessage("Unable to update profile. Please try again.");
    }
  }

  function logout() {
    localStorage.removeItem("demoUser");
    setUser(null);
    navigate("/login");
  }

  const initials = (user?.name || user?.email || "U")
    .trim()
    .charAt(0)
    .toUpperCase();

  return (
    <main className="container section page account-page">
      <div className="account-page-heading">
        <div>
          <span className="account-eyebrow">NOVA STORE / PROFILE</span>
          <h1 className="section-heading">My Account</h1>
          <p>Manage your personal information and orders.</p>
        </div>

        <div className="account-secure-label">
          <ShieldCheck size={17} />
          Customer Account
        </div>
      </div>

      {user?.role === "customer" ? (
        <div className="account-layout">
          <aside className="account-sidebar">
            <div className="account-profile-top">
              <div className="account-avatar">{initials}</div>

              <h2>{user.name || "Welcome!"}</h2>
              <p>{user.email}</p>

              <span className="account-member-badge">
                <ShieldCheck size={14} />
                Verified Customer
              </span>
            </div>

            <div className="account-sidebar-divider" />

            <div className="account-sidebar-links">
              <button
                type="button"
                className="account-side-link active"
              >
                <UserRound size={18} />
                My Profile
              </button>

              <button
                type="button"
                className="account-side-link"
                onClick={() => navigate("/orders")}
              >
                <Package size={18} />
                My Orders
              </button>
            </div>

            <button
              type="button"
              className="account-logout-btn"
              onClick={logout}
            >
              <LogOut size={18} />
              Logout
            </button>
          </aside>

          <section className="account-main-card">
            <div className="account-card-heading">
              <div>
                <span className="account-eyebrow">PERSONAL DETAILS</span>
                <h2>Profile Information</h2>
                <p>Update your name and contact information below.</p>
              </div>

              <div className="account-heading-icon">
                <Edit3 size={22} />
              </div>
            </div>

            <form className="account-form" onSubmit={updateProfile}>
              <div className="account-form-group">
                <label htmlFor="account-name">
                  <UserRound size={16} />
                  Full Name
                </label>

                <input
                  id="account-name"
                  type="text"
                  required
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setMessage("");
                  }}
                  placeholder="Enter your full name"
                />
              </div>

              <div className="account-form-group">
                <label htmlFor="account-email">
                  <Mail size={16} />
                  Email Address
                </label>

                <input
                  id="account-email"
                  type="email"
                  value={user.email || ""}
                  readOnly
                />

                <small>Your registered email cannot be changed here.</small>
              </div>

              <div className="account-form-group">
                <label htmlFor="account-phone">
                  <Phone size={16} />
                  Phone Number
                </label>

                <input
                  id="account-phone"
                  type="tel"
                  required
                  pattern="[0-9+ -]{10,15}"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setMessage("");
                  }}
                  placeholder="03XXXXXXXXX"
                />
              </div>

              {message && (
                <div
                  className={`account-message ${
                    messageType === "error" ? "error" : "success"
                  }`}
                >
                  {message}
                </div>
              )}

              <div className="account-form-actions">
                <button type="submit" className="account-save-btn">
                  <Save size={17} />
                  Save Changes
                </button>

                <button
                  type="button"
                  className="account-orders-btn"
                  onClick={() => navigate("/orders")}
                >
                  <Package size={17} />
                  View My Orders
                </button>
              </div>
            </form>

            <div className="account-info-note">
              <ShieldCheck size={19} />
              <p>
                Your account information is stored with your store
                profile and can be updated whenever you need.
              </p>
            </div>
          </section>
        </div>
      ) : (
        <div className="empty-state">
          <p>Please login to view your account.</p>
          <Link to="/login" className="primary-btn">
            Login
          </Link>
        </div>
      )}
    </main>
  );
}
