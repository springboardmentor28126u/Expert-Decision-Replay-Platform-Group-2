import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Login.css";

function Login() {
  // React Router navigation
  const navigate = useNavigate();

  // State for login form
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  // Handle input changes
  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      // Send login request to FastAPI
      const response = await API.post("/login", loginData);

      // Get JWT token
      const token = response.data.access_token;

      // Save token in localStorage
      localStorage.setItem("token", token);

      console.log("JWT Token:", token);

      alert("Login Successful!");

      // Redirect to Dashboard
      navigate("/dashboard");
    } catch (error) {
      alert(error.response?.data?.detail || "Login Failed");
    }
  };

  return (
    <div className="login-container">
      <form className="login-form" onSubmit={handleLogin}>
        <h2>Login</h2>

        <input
          type="email"
          name="email"
          placeholder="Enter Email"
          value={loginData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Enter Password"
          value={loginData.password}
          onChange={handleChange}
          required
        />

        <button type="submit">
          Login
        </button>

        <p className="login-link">
          Don't have an account?{" "}
          <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}

export default Login;