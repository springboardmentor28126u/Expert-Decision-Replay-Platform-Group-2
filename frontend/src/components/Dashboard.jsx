import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Dashboard.css";

function Dashboard() {

  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  // Fetch logged-in user details
  useEffect(() => {

    const fetchUser = async () => {

      try {

        const response = await API.get("/me");

        setUser(response.data);

      } catch (error) {

        alert("Session expired. Please login again.");

        localStorage.removeItem("token");

        navigate("/login");

      }

    };

    fetchUser();

  }, [navigate]);

  // Logout
  const handleLogout = () => {

    localStorage.removeItem("token");

    navigate("/login");

  };

  if (!user) {
    return <h2>Loading...</h2>;
  }

  return (
    <div className="dashboard-container">

      <h1>Dashboard</h1>

      <h2>Welcome {user.full_name}</h2>

      <p><strong>Role:</strong> {user.role}</p>

      <p><strong>Email:</strong> {user.email}</p>

      <p><strong>Department:</strong> {user.department}</p>

      <p><strong>Team:</strong> {user.team}</p>

      <button onClick={handleLogout}>
        Logout
      </button>

    </div>
  );
}

export default Dashboard;