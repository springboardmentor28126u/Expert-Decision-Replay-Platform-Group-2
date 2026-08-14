import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../Auth.css";
import {
  FaUser,
  FaEnvelope,
  FaLock,
  FaUserTag,
  FaUserPlus,
  FaShieldAlt,
  FaChartLine,
  FaDatabase,
} from "react-icons/fa";



function Register() {
  const navigate = useNavigate();
  useEffect(() => {
    console.log("Register mounted");
  }, []);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "Employee",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const register = async (e) => {
    e.preventDefault();
    console.log("Register handler invoked", formData);

    try {
      const payload = {
        full_name: formData.full_name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      await api.post("/auth/register", payload, {
        headers: { "Content-Type": "application/json" },
      });

      alert("Registration Successful");
      navigate("/");
    } catch (err) {
      console.error(err);
      const detail = err.response?.data?.detail;
      const message = typeof detail === "string" ? detail : detail?.[0]?.msg || "Registration Failed";
      alert(message);
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
                Join the platform and collaborate on
                organizational decisions, approvals,
                reports and audit tracking.
              </p>

              <div className="feature">
                <FaShieldAlt className="feature-icon" />
                <span>Role-Based Access Control</span>
              </div>

              <div className="feature">
                <FaChartLine className="feature-icon" />
                <span>Decision Approval Workflow</span>
              </div>

              <div className="feature">
                <FaDatabase className="feature-icon" />
                <span>Reports & Audit Logging</span>
              </div>

            </div>

          </div>

          {/* Register Card */}

          <div className="col-lg-5 col-md-8">

            <div className="auth-card">

              <h2 className="text-center fw-bold mb-2">
                Create Account
              </h2>

              <p className="text-center text-muted mb-4">
                Register to access the platform
              </p>

              <form onSubmit={register}>

                {/* Full Name */}

                <div className="input-group mb-3">

                  <span className="input-group-text">
                    <FaUser />
                  </span>

                  <input
                    type="text"
                    name="full_name"
                    className="form-control"
                    placeholder="Full Name"
                    value={formData.full_name}
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* Email */}

                <div className="input-group mb-3">

                  <span className="input-group-text">
                    <FaEnvelope />
                  </span>

                  <input
                    type="email"
                    name="email"
                    className="form-control"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* Password */}

                <div className="input-group mb-3">

                  <span className="input-group-text">
                    <FaLock />
                  </span>

                  <input
                    type="password"
                    name="password"
                    className="form-control"
                    placeholder="Password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />

                </div>

                {/* Role */}

                <div className="input-group mb-4">

                  <span className="input-group-text">
                    <FaUserTag />
                  </span>

                  <select
                    className="form-select"
                    name="role"
                    value={formData.role}
                    onChange={handleChange}
                  >
                    <option value="Employee">
                      Employee
                    </option>

                    <option value="Reviewer">
                      Reviewer
                    </option>

                    <option value="Manager">
                      Manager
                    </option>

                    <option value="Administrator">
                      Administrator
                    </option>

                  </select>

                </div>

                <button type="submit" className="btn btn-primary auth-btn w-100">
                  <FaUserPlus className="me-2" />
                  Register
                </button>

              </form>

              <hr />

              <p className="text-center mb-0">

                Already have an account?

                <Link
                  to="/"
                  className="fw-bold ms-2"
                >
                  Login
                </Link>

              </p>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}

export default Register;