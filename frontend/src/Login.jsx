import { useState } from "react";
import axios from "axios";
import "./styles.css";

function Login({ onSwitch }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [token, setToken] = useState("");
  const [users, setUsers] = useState(null);
  const [usersError, setUsersError] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setUsers(null);
    setUsersError("");
    try {
      const response = await axios.post("http://127.0.0.1:8000/login", {
        email,
        password,
      });
      setToken(response.data.access_token);
      setMessage("Login successful!");
      setIsError(false);
    } catch (error) {
      setToken("");
      setIsError(true);
      if (error.response && error.response.status === 401) {
        setMessage("Invalid email or password.");
      } else {
        setMessage("Something went wrong. Please try again.");
      }
    }
  };

  const handleViewUsers = async () => {
    setUsersError("");
    setUsers(null);
    try {
      const response = await axios.get("http://127.0.0.1:8000/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data);
    } catch (error) {
      if (error.response && error.response.status === 403) {
        setUsersError("403 Forbidden — you don't have permission to view this.");
      } else {
        setUsersError("Something went wrong.");
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

        {token && (
          <div className="users-section">
            <button className="auth-button" onClick={handleViewUsers}>
              View All Users (Admin Only)
            </button>

            {usersError && (
              <div className="auth-message error">{usersError}</div>
            )}

            {users && (
              <ul className="users-list">
                {users.map((u) => (
                  <li key={u.id}>
                    {u.full_name} — {u.email} — <b>{u.role}</b>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;