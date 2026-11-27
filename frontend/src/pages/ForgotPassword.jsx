import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { forgotPassword, resetPassword } from "../data/authStore";

// Step 1: email do -> server 6 digit code email karta hai
// Step 2: code + naya password -> server password badal deta hai
export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendResetCode(e) {
    e.preventDefault();
    if (loading) return;

    setMessage("");
    setLoading(true);
    try {
      setInfo(await forgotPassword(email));
      setStep(2);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (loading) return;

    setMessage("");

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email, code, newPassword);
      alert("Password reset successfully! Please login.");
      navigate("/login");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  const errorText = message && (
    <p style={{ color: "#ef4444", marginTop: "12px" }}>{message}</p>
  );

  return (
    <main className="container section">
      <div className="form-card">
        <h1 className="section-heading">Forgot Password</h1>

        <p style={{ marginBottom: "22px" }}>
          {step === 1 &&
            "Enter your registered email. We will send you a 6-digit reset code."}
          {step === 2 &&
            "Check your email for the 6-digit code, then create a new password."}
        </p>

        {/* STEP 1: EMAIL */}
        {step === 1 && (
          <form onSubmit={sendResetCode}>
            <label>Email Address</label>

            <input
              type="email"
              placeholder="Enter your registered email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            {errorText}

            <button
              type="submit"
              className="primary-btn"
              style={{ marginTop: "20px" }}
              disabled={loading}
            >
              {loading ? "Sending..." : "Send Reset Code"}
            </button>
          </form>
        )}

        {/* STEP 2: CODE + NEW PASSWORD */}
        {step === 2 && (
          <form onSubmit={handleReset}>
            {info && (
              <p style={{ color: "#a3e635", marginBottom: "16px" }}>{info}</p>
            )}

            <label>Verification Code</label>

            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              placeholder="Enter 6-digit code"
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />

            <label>New Password</label>

            <input
              type="password"
              placeholder="At least 8 characters, letters and numbers"
              minLength="8"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <label>Confirm New Password</label>

            <input
              type="password"
              placeholder="Confirm new password"
              minLength="8"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {errorText}

            <button
              type="submit"
              className="primary-btn"
              style={{ marginTop: "20px" }}
              disabled={loading}
            >
              {loading ? "Saving..." : "Reset Password"}
            </button>

            <button
              type="button"
              className="secondary-btn"
              style={{ marginTop: "12px", width: "100%" }}
              onClick={() => {
                setStep(1);
                setMessage("");
                setCode("");
              }}
            >
              Change Email / Resend Code
            </button>
          </form>
        )}

        <p style={{ marginTop: "22px" }}>
          Remember your password? <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </main>
  );
}
