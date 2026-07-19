import { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";
import Decisions from "./Decisions";
import DecisionDetail from "./DecisionDetail";

const BASE_URL = "http://127.0.0.1:8000/auth";

function App() {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [message, setMessage] = useState("");
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [view, setView] = useState("dashboard");
  const [selectedDecisionId, setSelectedDecisionId] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      const payload = JSON.parse(atob(savedToken.split(".")[1]));
      setLoggedInUser({ email: payload.sub, role: payload.role });
      setToken(savedToken);
    }
  }, []);

  const handleRegister = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/register`, {
        full_name: fullName,
        email: email,
        password: password,
        role: role,
      });
      setMessage(`Registered successfully: ${res.data.full_name} (${res.data.role})`);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Registration failed");
    }
  };

  const handleLogin = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/login`, { email, password });
      localStorage.setItem("token", res.data.access_token);
      const payload = JSON.parse(atob(res.data.access_token.split(".")[1]));
      setLoggedInUser({ email: payload.sub, role: payload.role });
      setToken(res.data.access_token);
      setMessage("");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Login failed");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setLoggedInUser(null);
    setToken(null);
    setView("dashboard");
    setEmail("");
    setPassword("");
  };

if (loggedInUser && view === "decisionDetail") {
    return (
      <DecisionDetail
        token={token}
        decisionId={selectedDecisionId}
        onBack={() => setView("decisions")}
      />
    );
  }

  if (loggedInUser && view === "decisions") {
    return (
      <Decisions
        token={token}
        onBack={() => setView("dashboard")}
        onSelectDecision={(id) => {
          setSelectedDecisionId(id);
          setView("decisionDetail");
        }}
      />
    );
  }

  if (loggedInUser) {
    return (
      <div className="page">
        <div className="card">
          <div className="eyebrow">Session Active</div>
          <h1 className="title">Welcome back</h1>
          <div className="dashboard-row">
            <span>Email</span>
            <span>{loggedInUser.email}</span>
          </div>
          <div className="dashboard-row">
            <span>Role</span>
            <span>{loggedInUser.role}</span>
          </div>
          <button className="submit-btn" style={{ marginTop: 20 }} onClick={() => setView("decisions")}>
            Go to Decisions
          </button>
          <button className="logout-btn" onClick={handleLogout}>Log out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="card">
        <div className="eyebrow">Decision Records, Preserved</div>
        <h1 className="title">Expert Decision<br />Replay Platform</h1>

        <div className="tabs">
          <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Login</button>
          <button className={`tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>Register</button>
        </div>

        {mode === "register" && (
          <div className="field">
            <label>Full name</label>
            <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Sphoorthi Paidi" />
          </div>
        )}

        <div className="field">
          <label>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
        </div>

        <div className="field">
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>

        {mode === "register" && (
          <div className="field">
            <label>Role</label>
            <select value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="employee">Employee</option>
              <option value="reviewer">Reviewer</option>
              <option value="manager">Manager</option>
              <option value="administrator">Administrator</option>
            </select>
          </div>
        )}

        <button className="submit-btn" onClick={mode === "login" ? handleLogin : handleRegister}>
          {mode === "login" ? "Log in" : "Create account"}
        </button>

        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
}

export default App;