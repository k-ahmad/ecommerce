
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [enteredCode, setEnteredCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [step, setStep] = useState(1);
  const [message, setMessage] = useState("");
  const [demoCode, setDemoCode] = useState("");

  // FIND REGISTERED USER AND GENERATE DEMO CODE
  function sendResetCode(e) {
    e.preventDefault();

    let users = [];

    try {
      users = JSON.parse(
        localStorage.getItem("users") || "[]"
      );
    } catch (error) {
      console.error("Users loading error:", error);
    }

    const enteredEmail = email.trim().toLowerCase();

    const user = users.find(
      (item) => item.email?.toLowerCase() === enteredEmail
    );

    if (!user) {
      setMessage("This email is not registered.");
      return;
    }

    if (user.isBlocked) {
      setMessage("This account is blocked. Contact support.");
      return;
    }

    const generatedCode = String(
      Math.floor(100000 + Math.random() * 900000)
    );

    setCode(generatedCode);
    setDemoCode(generatedCode);
    setMessage("");
    setStep(2);
  }

  // VERIFY CODE
  function verifyCode(e) {
    e.preventDefault();

    if (enteredCode.trim() !== code) {
      setMessage("Incorrect verification code. Try again.");
      return;
    }

    setMessage("");
    setStep(3);
  }

  // SAVE NEW PASSWORD
  function resetPassword(e) {
    e.preventDefault();

    if (newPassword.length < 6) {
      setMessage("Password must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }

    let users = [];

    try {
      users = JSON.parse(
        localStorage.getItem("users") || "[]"
      );
    } catch (error) {
      console.error("Users loading error:", error);
      setMessage("Unable to load user accounts.");
      return;
    }

    const updatedUsers = users.map((user) =>
      user.email?.toLowerCase() === email.trim().toLowerCase()
        ? {
            ...user,
            password: newPassword,
          }
        : user
    );

    localStorage.setItem(
      "users",
      JSON.stringify(updatedUsers)
    );

    // Clear reset information
    setCode("");
    setDemoCode("");
    setEnteredCode("");
    setNewPassword("");
    setConfirmPassword("");

    alert("Password reset successfully! Please login.");
    navigate("/login");
  }

  return (
    <main className="container section">
      <div className="form-card">
        <h1 className="section-heading">
          Forgot Password
        </h1>

        <p style={{ marginBottom: "22px" }}>
          {step === 1 &&
            "Enter your registered email to start resetting your password."}

          {step === 2 &&
            "Enter the 6-digit verification code shown below."}

          {step === 3 &&
            "Create a new password for your account."}
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

            {message && (
              <p style={{ color: "#ef4444", marginTop: "12px" }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              className="primary-btn"
              style={{ marginTop: "20px" }}
            >
              Generate Reset Code
            </button>
          </form>
        )}

        {/* STEP 2: VERIFY CODE */}
        {step === 2 && (
          <form onSubmit={verifyCode}>
            <label>Verification Code</label>

            <input
              type="text"
              inputMode="numeric"
              maxLength="6"
              placeholder="Enter 6-digit code"
              required
              value={enteredCode}
              onChange={(e) =>
                setEnteredCode(e.target.value.replace(/\D/g, ""))
              }
            />

            <div
              style={{
                marginTop: "18px",
                padding: "15px",
                border: "1px dashed #a3e635",
                borderRadius: "10px",
              }}
            >
              <p style={{ marginBottom: "8px" }}>
                Demo verification code:
              </p>

              <strong
                style={{
                  fontSize: "25px",
                  letterSpacing: "5px",
                  color: "#a3e635",
                }}
              >
                {demoCode}
              </strong>

              <p style={{ fontSize: "12px", marginTop: "8px" }}>
                Testing only. No email has been sent.
              </p>
            </div>

            {message && (
              <p style={{ color: "#ef4444", marginTop: "12px" }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              className="primary-btn"
              style={{ marginTop: "20px" }}
            >
              Verify Code
            </button>

            <button
              type="button"
              className="secondary-btn"
              style={{ marginTop: "12px", width: "100%" }}
              onClick={() => {
                setStep(1);
                setMessage("");
                setEnteredCode("");
                setCode("");
                setDemoCode("");
              }}
            >
              Change Email
            </button>
          </form>
        )}

        {/* STEP 3: NEW PASSWORD */}
        {step === 3 && (
          <form onSubmit={resetPassword}>
            <label>New Password</label>

            <input
              type="password"
              placeholder="Enter new password"
              minLength="6"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <label>Confirm New Password</label>

            <input
              type="password"
              placeholder="Confirm new password"
              minLength="6"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {message && (
              <p style={{ color: "#ef4444", marginTop: "12px" }}>
                {message}
              </p>
            )}

            <button
              type="submit"
              className="primary-btn"
              style={{ marginTop: "20px" }}
            >
              Reset Password
            </button>
          </form>
        )}

        <p style={{ marginTop: "22px" }}>
          Remember your password?{" "}
          <Link to="/login">Back to Login</Link>
        </p>
      </div>
    </main>
  );
}
