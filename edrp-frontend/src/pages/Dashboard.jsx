import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import "../styles/dashboard.css";

function Dashboard() {

    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCurrentUser();
    }, []);

    const fetchCurrentUser = async () => {

        try {

            const response = await api.get("/users/me");

            setUser(response.data);

        } catch (error) {

            localStorage.removeItem("access_token");

            navigate("/login");

        } finally {

            setLoading(false);

        }

    };

    const logout = () => {

        localStorage.removeItem("access_token");

        navigate("/login");

    };

    if (loading) {

        return <h2 className="loading">Loading...</h2>;

    }

    return (

        <div className="dashboard">

            <header className="dashboard-header">

                <h1>EDRP Dashboard</h1>

                <button onClick={logout}>
                    Logout
                </button>

            </header>

            <div className="welcome-card">

                <h2>Welcome, {user.name}</h2>

                <p>
                    Manage your profile and teams from here.
                </p>

            </div>

            <div className="profile-card">

                <h2>User Details</h2>

                <div className="row">
                    <span>ID</span>
                    <span>{user.id}</span>
                </div>

                <div className="row">
                    <span>Name</span>
                    <span>{user.name}</span>
                </div>

                <div className="row">
                    <span>Email</span>
                    <span>{user.email}</span>
                </div>

                <div className="row">
                    <span>Role</span>
                    <span>{user.role}</span>
                </div>

            </div>

            <div className="action-cards">

                <div className="card">

                    <h3>Teams</h3>

                    <p>
                        View all teams available in the organization.
                    </p>

                    <button>
                        View Teams
                    </button>

                </div>

                {
                    user.role === "Administrator" &&

                    <div className="card">

                        <h3>Users</h3>

                        <p>
                            Manage users and assign roles.
                        </p>

                        <button>
                            Manage Users
                        </button>

                    </div>
                }

            </div>

        </div>

    );

}

export default Dashboard;