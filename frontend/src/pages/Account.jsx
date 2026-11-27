
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
import { getCurrentUser, isLoggedIn } from "../api/client";
import { logout as logoutRequest, refreshMe, updateProfile as saveProfile } from "../data/authStore";

export default function Account() {
  const navigate = useNavigate();

  const [user, setUser] = useState(() =>
    isLoggedIn() ? getCurrentUser() : null
  );

  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    if (user.role === "admin") {
      navigate("/admin", { replace: true });
    }
  }, [user, navigate]);

  // Server se taaza data lao (block hua ho to logout ho jayega)
  useEffect(() => {
    if (!isLoggedIn()) return;

    refreshMe()
      .then((fresh) => {
        setUser(fresh);
        setName(fresh.name || "");
        setPhone(fresh.phone || "");
      })
      .catch((error) => {
        if (error.status === 401 || error.status === 403) {
          alert(error.message);
          setUser(null);
        }
      });
  }, []);

  async function updateProfile(e) {
    e.preventDefault();

    if (!user || user.role !== "customer" || saving) return;

    if (!name.trim() || !phone.trim()) {
      setMessageType("error");
      setMessage("Please fill in your name and phone number.");
      return;
    }

    setSaving(true);
    try {
      const updatedUser = await saveProfile({
        name: name.trim(),
        phone: phone.trim(),
      });
      setUser(updatedUser);
      setMessageType("success");
      setMessage("Profile updated successfully!");
    } catch (error) {
      setMessageType("error");
      setMessage(error.message || "Unable to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  function logout() {
    logoutRequest();
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
                  pattern="[0-9+ \-]{10,15}"
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
