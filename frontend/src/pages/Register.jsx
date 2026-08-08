import { useState } from "react";
import apiClient from "../api/client";
import "../styles/styles.css";

function Register({ onSwitch, onBackToLanding }) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await apiClient.post("/api/v1/auth/register", {
        full_name: fullName,
        email,
        password,
      });
      setMessage(`Registered successfully! Welcome, ${response.data.full_name}`);
      setIsError(false);
    } catch (error) {
      setIsError(true);
      if (error.response && error.response.status === 400) {
        setMessage("Email already registered.");
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <button className="auth-back-btn" onClick={onBackToLanding}>
          &larr; Back
        </button>
        <p className="auth-brand">Expert Decision Replay Platform</p>
        <h2 className="auth-title">Create your account</h2>

        <form onSubmit={handleRegister}>
          <div className="auth-field">
            <input
              type="text"
              placeholder="Full name"
              aria-label="Full name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <input
              type="email"
              placeholder="Email"
              aria-label="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <input
              type="password"
              placeholder="Password"
              aria-label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button">Register</button>
        </form>

        {message && (
          <div className={`auth-message ${isError ? "error" : "success"}`} role="status">
            {message}
          </div>
        )}

        <div className="auth-switch">
          Already have an account? <button onClick={onSwitch}>Log in</button>
        </div>
      </div>
    </div>
  );
}

export default Register;