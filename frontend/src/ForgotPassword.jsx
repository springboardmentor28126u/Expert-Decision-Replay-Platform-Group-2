import { useState } from "react";
import "./styles.css";

function ForgotPassword({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-brand">Expert Decision Replay Platform</p>
        <h2 className="auth-title">Reset your password</h2>

        {submitted ? (
          <div className="auth-message success">
            If an account exists for {email}, a password reset link has been sent.
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <p style={{ color: "#9AA5B5", fontSize: "13px", marginBottom: "16px" }}>
              Enter your email and we'll send you instructions to reset your password.
            </p>
            <div className="auth-field">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="auth-button">Send reset link</button>
          </form>
        )}

        <div className="auth-switch">
          <button onClick={onSwitch}>Back to login</button>
        </div>
      </div>
    </div>
  );
}

export default ForgotPassword;