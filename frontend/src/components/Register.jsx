import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Register.css";

function Register() {

  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    department: "",
    team: "",
    role: "Employee",
  });

  // Handle input changes
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Register user
  const handleRegister = async (e) => {
    e.preventDefault();

    try {
      const response = await API.post("/register", formData);

      alert("User Registered Successfully!");

      console.log(response.data);

      // Clear form
      setFormData({
        full_name: "",
        email: "",
        password: "",
        department: "",
        team: "",
        role: "Employee",
      });

      // Redirect to Login page
      navigate("/login");

    } catch (error) {
      alert(error.response?.data?.detail || "Registration Failed");
    }
  };

  return (
    <div className="register-container">
      <form className="register-form" onSubmit={handleRegister}>

        <h2>Register</h2>

        <input
          type="text"
          name="full_name"
          placeholder="Full Name"
          value={formData.full_name}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          value={formData.password}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="department"
          placeholder="Department"
          value={formData.department}
          onChange={handleChange}
          required
        />

        <input
          type="text"
          name="team"
          placeholder="Team"
          value={formData.team}
          onChange={handleChange}
          required
        />

        <select
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        >
          <option value="Employee">Employee</option>
          <option value="Reviewer">Reviewer</option>
          <option value="Manager">Manager</option>
          <option value="Administrator">Administrator</option>
        </select>

        <button type="submit">Register</button>

      </form>
    </div>
  );
}

export default Register;