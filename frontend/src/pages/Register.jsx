
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  LockKeyhole,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  ShieldCheck,
} from "lucide-react";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  function register(e) {
    e.preventDefault();

    const users = JSON.parse(localStorage.getItem("users") || "[]");

    const existingUser = users.find(
      (user) =>
        user.email.toLowerCase() === form.email.trim().toLowerCase()
    );

    if (existingUser) {
      alert("This email is already registered. Please login.");
      return;
    }

    const newUser = {
      id: Date.now(),
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      password: form.password,
      isBlocked: false,
    };

    const updatedUsers = [...users, newUser];

    localStorage.setItem("users", JSON.stringify(updatedUsers));
    localStorage.setItem("demoUser", JSON.stringify(newUser));

    alert("Account created successfully!");

    navigate("/account");
  }

  return (
    <main className="register-page">
      <div className="register-glow register-glow-one"></div>
      <div className="register-glow register-glow-two"></div>

      <div className="register-container">

        {/* LEFT SIDE */}
        <div className="register-welcome">

          <div className="register-brand">
            <span className="register-brand-icon">
              <ShoppingBag size={25} />
            </span>

            <span>NOVA<span>STORE</span></span>
          </div>

          <div className="register-welcome-content">

            <span className="register-eyebrow">
              <Sparkles size={15} />
              JOIN THE NOVASTORE FAMILY
            </span>

            <h1>
              Your Next
              <br />
              <span>Shopping</span>
              <br />
              Experience.
            </h1>

            <p>
              Create your account and discover a world of
              quality products, amazing collections and
              convenient online shopping.
            </p>

            <div className="register-benefits">

              <div>
                <span><ShoppingBag size={19} /></span>
                <div>
                  <strong>Discover Products</strong>
                  <small>Explore our latest collections</small>
                </div>
              </div>

              <div>
                <span><ShieldCheck size={19} /></span>
                <div>
                  <strong>Easy Account Access</strong>
                  <small>Enjoy a smooth shopping journey</small>
                </div>
              </div>

            </div>
          </div>

          <div className="register-bottom-text">
            YOUR STYLE. YOUR STORE. YOUR NOVA.
          </div>

        </div>

        {/* RIGHT SIDE - REGISTER FORM */}
        <div className="register-form-side">

          <form className="register-card" onSubmit={register}>

            <div className="register-card-icon">
              <UserRound size={25} />
            </div>

            <span className="register-form-eyebrow">
              CREATE YOUR ACCOUNT
            </span>

            <h2>Join NOVASTORE!</h2>

            <p className="register-description">
              Fill in your details to get started.
            </p>

            {/* FULL NAME */}
            <div className="register-input-group">
              <label htmlFor="register-name">Full Name</label>

              <div className="register-input-wrap">
                <UserRound size={19} />

                <input
                  id="register-name"
                  type="text"
                  placeholder="Enter your full name"
                  required
                  value={form.name}
                  onChange={(e) =>
                    setForm({ ...form, name: e.target.value })
                  }
                />
              </div>
            </div>

            {/* EMAIL */}
            <div className="register-input-group">
              <label htmlFor="register-email">Email Address</label>

              <div className="register-input-wrap">
                <Mail size={19} />

                <input
                  id="register-email"
                  type="email"
                  placeholder="Enter your email"
                  required
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                />
              </div>
            </div>

            {/* PHONE */}
            <div className="register-input-group">
              <label htmlFor="register-phone">Phone Number</label>

              <div className="register-input-wrap">
                <Phone size={19} />

                <input
                  id="register-phone"
                  type="tel"
                  placeholder="03XXXXXXXXX"
                  pattern="[0-9+ -]{10,15}"
                  title="Please enter a valid phone number"
                  required
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="register-input-group">
              <label htmlFor="register-password">Password</label>

              <div className="register-input-wrap">
                <LockKeyhole size={19} />

                <input
                  id="register-password"
                  type="password"
                  placeholder="Create password"
                  minLength="6"
                  required
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                />
              </div>

              <small className="register-password-hint">
                Password must be at least 6 characters.
              </small>
            </div>

            {/* SUBMIT */}
            <button type="submit" className="register-submit">
              Create My Account
              <ArrowRight size={19} />
            </button>

            <div className="register-divider">
              <span></span>
              <small>ALREADY A MEMBER?</small>
              <span></span>
            </div>

            <p className="register-login">
              Already registered?
              <Link to="/login"> Login Here</Link>
            </p>

            <div className="register-secure-note">
              <ShieldCheck size={15} />
              <span>Your account details are protected</span>
            </div>

          </form>
        </div>

      </div>
    </main>
  );
}
