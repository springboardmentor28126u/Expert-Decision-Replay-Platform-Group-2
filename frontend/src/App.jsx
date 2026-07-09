import { useState } from "react";
import axios from "axios";

const BASE_URL = "http://127.0.0.1:8000/auth";

function App() {
  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("employee");
  const [message, setMessage] = useState("");

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
      setMessage("Login successful! Token saved.");
    } catch (err) {
      setMessage(err.response?.data?.detail || "Login failed");
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: "50px auto", fontFamily: "sans-serif" }}>
      <h2>Expert Decision Replay Platform</h2>

      <div style={{ marginBottom: 10 }}>
        <button onClick={() => setMode("login")}>Login</button>
        <button onClick={() => setMode("register")}>Register</button>
      </div>

      {mode === "register" && (
        <input placeholder="Full Name" value={fullName} onChange={(e) => setFullName(e.target.value)} style={{ display: "block", marginBottom: 8, width: "100%" }} />
      )}
      <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={{ display: "block", marginBottom: 8, width: "100%" }} />
      <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={{ display: "block", marginBottom: 8, width: "100%" }} />

      {mode === "register" && (
        <select value={role} onChange={(e) => setRole(e.target.value)} style={{ display: "block", marginBottom: 8, width: "100%" }}>
          <option value="employee">Employee</option>
          <option value="reviewer">Reviewer</option>
          <option value="manager">Manager</option>
          <option value="administrator">Administrator</option>
        </select>
      )}

      <button onClick={mode === "login" ? handleLogin : handleRegister}>
        {mode === "login" ? "Login" : "Register"}
      </button>

      <p>{message}</p>
    </div>
  );
}

export default App;