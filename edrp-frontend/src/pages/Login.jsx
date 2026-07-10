import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   setError("");

  //   try {
  //     const data = new URLSearchParams();

  //     data.append("username", formData.email);
  //     data.append("password", formData.password);

  //     const response = await api.post("/login", data);

  //     localStorage.setItem(
  //       "access_token",
  //       response.data.access_token
  //     );

  //     navigate("/dashboard");
  //   } catch (err) {
  //     setError(
  //       err.response?.data?.detail || "Invalid Email or Password"
  //     );
  //   }
  // };
  const handleSubmit = (e) => {
    e.preventDefault();

    setError("");

    localStorage.setItem("access_token", "dummy-token");

    navigate("/dashboard");
};
  return (
    <div className="login-page">

      <div className="login-card">

        <h1>EDRP</h1>

        <p className="subtitle">
          Expert Decision Replay Platform
        </p>

        <h2>Login</h2>

        {error && (
          <p className="error">{error}</p>
        )}

        <form onSubmit={handleSubmit}>

          <input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={formData.email}
            onChange={handleChange}
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={formData.password}
            onChange={handleChange}
            required
          />

          <button type="submit">
            Login
          </button>

        </form>

        <p className="register-link">
          Don't have an account?
          <Link to="/register"> Register</Link>
        </p>

      </div>

    </div>
  );
}

export default Login;