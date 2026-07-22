import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "Employee",
  });

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const register = async (e) => {
    e.preventDefault();

    try {
      await api.post("/auth/register", form);

      alert("Registration Successful!");

      navigate("/");
    } catch (err) {
        console.log(err.response);
        console.log(err.response?.data);

    alert(JSON.stringify(err.response?.data) || err.message);
}
  };

  return (
    <div className="container mt-5">
      <div className="row justify-content-center">

        <div className="col-md-6">

          <div className="card shadow p-4">

            <h2 className="text-center mb-4">
              Register
            </h2>

            <form onSubmit={register}>

              <div className="mb-3">
                <label>Full Name</label>
                <input
                  className="form-control"
                  name="full_name"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label>Email</label>
                <input
                  className="form-control"
                  type="email"
                  name="email"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label>Password</label>
                <input
                  className="form-control"
                  type="password"
                  name="password"
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="mb-3">
                <label>Role</label>

                <select
                  className="form-control"
                  name="role"
                  onChange={handleChange}
                >
                  <option>Employee</option>
                  <option>Reviewer</option>
                  <option>Manager</option>
                  <option>Administrator</option>
                </select>
              </div>

              <button className="btn btn-success w-100">
                Register
              </button>

            </form>

            <hr />

            <p className="text-center">
              Already have an account?
              <Link to="/"> Login</Link>
            </p>

          </div>

        </div>

      </div>
    </div>
  );
}

export default Register;