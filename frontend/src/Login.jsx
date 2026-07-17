import { useState } from "react";
import axios from "axios";
import "./styles.css";

function Login({ onLoginSuccess, onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("http://127.0.0.1:8000/login", {
        email,
        password,
      });
      setMessage("Login successful!");
      setIsError(false);
      onLoginSuccess(response.data.access_token);
    } catch (error) {
      setIsError(true);
      if (error.response && error.response.status === 401) {
        setMessage("Invalid email or password.");
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <p className="auth-brand">Expert Decision Replay Platform</p>
        <h2 className="auth-title">Log in to your account</h2>

        <form onSubmit={handleLogin}>
          <div className="auth-field">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-field">
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-button">Log in</button>
        </form>

        {message && (
          <div className={`auth-message ${isError ? "error" : "success"}`}>
            {message}
          </div>
        )}

        <div className="auth-switch">
          Don't have an account? <button onClick={onSwitch}>Register</button>
        </div>
      </div>
    </div>
  );
}

export default Login;