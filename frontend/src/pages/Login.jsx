
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Mail,
  LockKeyhole,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { login as loginRequest } from "../data/authStore";

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [submitting, setSubmitting] = useState(false);

  async function login(e) {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    try {
      // Admin aur customer dono ka login server check karta hai
      const user = await loginRequest(email, password);
      navigate(user.role === "admin" ? "/admin" : "/account");
    } catch (error) {
      alert(error.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-glow login-glow-one"></div>
      <div className="login-glow login-glow-two"></div>

      <div className="login-container">

        {/* LEFT SIDE */}
        <div className="login-welcome">
          <div className="login-brand">
            <span className="login-brand-icon">
              <ShoppingBag size={25} />
            </span>
            <span>NOVA<span>STORE</span></span>
          </div>

          <div className="login-welcome-content">
            <span className="login-eyebrow">
              <Sparkles size={15} />
              WELCOME TO NOVASTORE
            </span>

            <h1>
              Shopping
              <br />
              Made <span>Better.</span>
            </h1>

            <p>
              Discover your favorite products, enjoy a smooth
              shopping experience and find everything you love
              in one place.
            </p>

            <div className="login-benefits">
              <div>
                <span><ShieldCheck size={19} /></span>
                <div>
                  <strong>Secure Shopping</strong>
                  <small>Your account is important to us</small>
                </div>
              </div>

              <div>
                <span><ShoppingBag size={19} /></span>
                <div>
                  <strong>Explore Collections</strong>
                  <small>Discover products you will love</small>
                </div>
              </div>
            </div>
          </div>

          <div className="login-bottom-text">
            YOUR STYLE. YOUR STORE. YOUR NOVA.
          </div>
        </div>

        {/* RIGHT SIDE - LOGIN FORM */}
        <div className="login-form-side">
          <form className="login-card" onSubmit={login}>

            <div className="login-card-icon">
              <LockKeyhole size={25} />
            </div>

            <span className="login-form-eyebrow">
              ACCOUNT ACCESS
            </span>

            <h2>Welcome Back!</h2>

            <p className="login-description">
              Sign in to continue your shopping journey.
            </p>

            <div className="login-input-group">
              <label htmlFor="login-email">Email Address</label>

              <div className="login-input-wrap">
                <Mail size={19} />

                <input
                  id="login-email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="login-input-group">
              <label htmlFor="login-password">Password</label>

              <div className="login-input-wrap">
                <LockKeyhole size={19} />

                <input
                  id="login-password"
                  type="password"
                  placeholder="Enter your password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <div className="login-forgot">
              <Link to="/forgot-password">
                Forgot Password?
              </Link>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={submitting}
            >
              {submitting ? "Logging in..." : "Login to Account"}
              <ArrowRight size={19} />
            </button>

            <div className="login-divider">
              <span></span>
              <small>NEW TO NOVASTORE?</small>
              <span></span>
            </div>

            <p className="login-register">
              Don't have an account?
              <Link to="/register"> Create Account</Link>
            </p>

            <div className="login-secure-note">
              <ShieldCheck size={15} />
              <span>Secure and protected account access</span>
            </div>

          </form>
        </div>

      </div>
    </main>
  );
}
