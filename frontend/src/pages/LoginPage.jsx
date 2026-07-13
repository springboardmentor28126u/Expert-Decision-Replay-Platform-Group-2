import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function LoginPage() {
  const { login, isAuthenticated, isLoading } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/profile";

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  if (isAuthenticated) {
    return <Navigate to={from} replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.email.trim() || !form.password.trim()) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      await login(form);
      navigate(from, { replace: true });
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Login failed. Please try again."
      );
    }
  }

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#f6f6f6",
      }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          width: "360px",
          background: "#fff",
          padding: "32px",
          borderRadius: "10px",
          boxShadow: "0 4px 18px rgba(0,0,0,.08)",
        }}
      >
        <h2 style={{ marginBottom: "24px", textAlign: "center" }}>
          Expert Decision Replay Platform
        </h2>

        <div style={{ marginBottom: "16px" }}>
          <label>Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Enter email"
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "6px",
            }}
          />
        </div>

        <div style={{ marginBottom: "16px" }}>
          <label>Password</label>
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Enter password"
            style={{
              width: "100%",
              padding: "10px",
              marginTop: "6px",
            }}
          />
        </div>

        {error && (
          <p
            style={{
              color: "crimson",
              marginBottom: "16px",
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          style={{
            width: "100%",
            padding: "12px",
            cursor: "pointer",
          }}
        >
          {isLoading ? "Signing in..." : "Login"}
        </button>

        <p
          style={{
            textAlign: "center",
            marginTop: "20px",
          }}
        >
          Don't have an account?{" "}
          <Link to="/register">
            Register
          </Link>
        </p>
      </form>
    </div>
  );
}