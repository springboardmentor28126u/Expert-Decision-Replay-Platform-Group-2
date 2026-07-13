import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  function handleChange(e) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (
      !form.full_name ||
      !form.email ||
      !form.password ||
      !form.confirmPassword
    ) {
      setError("Please fill all fields.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      await register({
        full_name: form.full_name,
        email: form.email,
        password: form.password,
      });

      setSuccess("Registration successful. Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 1200);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Registration failed."
      );
    } finally {
      setLoading(false);
    }
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
          width: 380,
          background: "#fff",
          padding: 32,
          borderRadius: 10,
          boxShadow: "0 4px 18px rgba(0,0,0,.08)",
        }}
      >
        <h2 style={{ textAlign: "center", marginBottom: 24 }}>
          Create Account
        </h2>

        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={form.full_name}
          onChange={handleChange}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={form.email}
          onChange={handleChange}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={form.password}
          onChange={handleChange}
          style={{ width: "100%", padding: 10, marginBottom: 12 }}
        />

        <input
          type="password"
          name="confirmPassword"
          placeholder="Confirm Password"
          value={form.confirmPassword}
          onChange={handleChange}
          style={{ width: "100%", padding: 10, marginBottom: 18 }}
        />

        {error && (
          <p style={{ color: "red", marginBottom: 12 }}>{error}</p>
        )}

        {success && (
          <p style={{ color: "green", marginBottom: 12 }}>{success}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: 12,
            cursor: "pointer",
          }}
        >
          {loading ? "Creating..." : "Register"}
        </button>

        <p style={{ textAlign: "center", marginTop: 18 }}>
          Already have an account?{" "}
          <Link to="/login">Login</Link>
        </p>
      </form>
    </div>
  );
}