import { useState } from "react";
import api from "../services/api";
import { Link, useNavigate } from "react-router-dom";
import {
  FaEnvelope,
  FaLock,
  FaSignInAlt,
  FaShieldAlt,
  FaChartLine,
  FaDatabase,
} from "react-icons/fa";
import "../Auth.css";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const login = async (e) => {
    e.preventDefault();
    console.log("Login handler invoked", { username });

    try {
      const formData = new URLSearchParams();
      formData.append("username", username);
      formData.append("password", password);

      const response = await api.post("/auth/login", formData, {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      sessionStorage.setItem("token", response.data.access_token);
      navigate("/dashboard");
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.detail || "Invalid email or password.");
    }
  };

  return (
    <div className="auth-page">

      <div className="container">

        <div className="row justify-content-center align-items-center min-vh-100">

          {/* Left Side */}

          <div className="col-lg-6 d-none d-lg-flex">

            <div className="auth-left">

              <h1 className="display-5 fw-bold mb-4">
                Expert Decision Replay Platform
              </h1>

              <p className="lead mb-5">
                Securely manage organizational decisions,
                approvals, reports and audit logs from
                one centralized platform.
              </p>

              <div className="feature">

                <FaShieldAlt className="feature-icon" />

                <span>
                  Role-Based Access Control
                </span>

              </div>

              <div className="feature">

                <FaChartLine className="feature-icon" />

                <span>
                  Decision Approval Workflow
                </span>

              </div>

              <div className="feature">

                <FaDatabase className="feature-icon" />

                <span>
                  Reports & Audit Logging
                </span>

              </div>

            </div>

          </div>

          {/* Login Card */}

          <div className="col-lg-5 col-md-8">

            <div className="auth-card">

              <h2 className="text-center fw-bold mb-2">
                Welcome Back
              </h2>

              <p className="text-center text-muted mb-4">
                Sign in to continue
              </p>

              <form onSubmit={login}>

                <div className="input-group mb-3">

                  <span className="input-group-text">
                    <FaEnvelope />
                  </span>

                  <input
                    type="email"
                    className="form-control"
                    placeholder="Email Address"
                    value={username}
                    onChange={(e) =>
                      setUsername(e.target.value)
                    }
                    required
                  />

                </div>

                <div className="input-group mb-4">

                  <span className="input-group-text">
                    <FaLock />
                  </span>

                  <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value)
                    }
                    required
                  />

                </div>

                <button
                  type="submit"
                  className="btn btn-primary auth-btn w-100"
                >
                  <FaSignInAlt className="me-2" />
                  Login
                </button>

              </form>

              <hr />

              <p className="text-center mb-0">

                Don't have an account?

                <Link
                  to="/register"
                  className="fw-bold ms-2"
                >
                  Register
                </Link>

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Login;
