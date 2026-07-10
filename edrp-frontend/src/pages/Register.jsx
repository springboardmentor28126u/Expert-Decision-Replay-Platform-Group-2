import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/register.css";

function Register() {

    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: ""
    });

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const handleChange = (e) => {

        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        setError("");
        setSuccess("");

        try {

            await api.post("/users", formData);

            setSuccess("Registration Successful");

            setTimeout(() => {
                navigate("/login");
            }, 1500);

        } catch (err) {

            setError(
                err.response?.data?.detail || "Registration Failed"
            );

        }

    };

    return (

        <div className="register-page">

            <div className="register-card">

                <h1>EDRP</h1>

                <p className="subtitle">
                    Expert Decision Replay Platform
                </p>

                <h2>Create Account</h2>

                {error && <p className="error">{error}</p>}

                {success && <p className="success">{success}</p>}

                <form onSubmit={handleSubmit}>

                    <input
                        type="text"
                        name="name"
                        placeholder="Enter Full Name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />

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
                        Register
                    </button>

                </form>

                <p className="login-link">
                    Already have an account?
                    <Link to="/login"> Login</Link>
                </p>

            </div>

        </div>

    );

}

export default Register;