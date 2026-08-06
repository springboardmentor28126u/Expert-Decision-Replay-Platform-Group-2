import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/dashboard.css";
import api from "../../services/api";

import {
    Users,
    UserCheck,
    UsersRound,
    Building2
} from "lucide-react";
function AdminDashboard({ user }) {
    const navigate = useNavigate();

    const [statistics, setStatistics] = useState([]);

    const [recentUsers, setRecentUsers] = useState([]);

    const [teams, setTeams] = useState([]);

    const [loading, setLoading] = useState(true); 
    
    useEffect(() => {
    loadDashboard();
}, []);
const loadDashboard = async () => {

    try {

        const usersResponse = await api.get("/users");

        const teamsResponse = await api.get("/teams");

        const users = usersResponse.data;

        const teamData = teamsResponse.data;

        setRecentUsers(users);

        setTeams(teamData);

        setStatistics([

            {
                title: "Total Users",
                value: users.length,
                icon: <Users />
            },

            {
                title: "Total Teams",
                value: teamData.length,
                icon: <Building2 />
            },

            {
                title: "Administrators",
                value: users.filter(
                    user => user.role === "Administrator"
                ).length,
                icon: <UserCheck />
            },

            {
                title: "Managers",
                value: users.filter(
                    user => user.role === "Manager"
                ).length,
                icon: <UsersRound />
            }

        ]);

    }

    catch (error) {

        console.error("Dashboard Error:", error);

        alert("Failed to load dashboard data.");

    }

    finally {

        setLoading(false);

    }

};
if (loading) {
    return (
        <DashboardLayout user={user}>
            <div className="dashboard-page">
                <h2>Loading...</h2>
            </div>
        </DashboardLayout>
    );
}
    return (

        <DashboardLayout user={user}>

            <div className="dashboard-page">

                <div className="page-header">

                    <h1>
                        Administrator Dashboard
                    </h1>

                    <p>
                        Welcome back, {user.name}
                    </p>

                </div>

                <div className="stats-grid">

                    {

                        statistics.map((item, index) => (

                            <div
                                className="stat-card"
                                key={index}
                            >

                                <div className="card-icon">

                                    {item.icon}

                                </div>

                                <div>

                                    <h3>
                                        {item.title}
                                    </h3>

                                    <h2>
                                        {item.value}
                                    </h2>

                                </div>

                            </div>

                        ))

                    }

                </div>
<div className="dashboard-section">

    <h2>
        Current User
    </h2>

    <div className="profile-card">

        <p>
            <strong>Name:</strong> {user.name}
        </p>

        <p>
            <strong>Email:</strong> {user.email}
        </p>

        <p>
            <strong>Role:</strong> {user.role}
        </p>

    </div>

</div>



<div className="dashboard-section">

    <h2>
        Recent Users
    </h2>

    <table className="decision-table">

        <thead>

            <tr>

                <th>Name</th>

                <th>Email</th>

                <th>Role</th>

            </tr>

        </thead>

        <tbody>

{

recentUsers.length > 0 ? (

        recentUsers.map((item) => (

        <tr key={item.id}>

        <td>{item.name}</td>

        <td>{item.email}</td>

        <td>{item.role}</td>

        </tr>

        ))

        ) : (

        <tr>

        <td colSpan="3">

        No users found

        </td>

        </tr>

        )

        }

</tbody>

    </table>

</div>
<div className="dashboard-section">

    <h2>
        Teams
    </h2>

    <table className="decision-table">

        <thead>

            <tr>

                <th>Team Name</th>

                <th>Manager</th>

            </tr>

        </thead>

        <tbody>

            

{

teams.length > 0 ? (

teams.map((team) => (

<tr key={team.id}>

<td>{team.name}</td>

<td>{team.manager_name || "Not Assigned"}</td>

        </tr>

        ))

        ) : (

        <tr>

        <td colSpan="2">

        No teams found

        </td>

        </tr>

        )

        }

        </tbody>
    </table>

</div>



<div className="dashboard-section">

    <h2>
        Quick Actions
    </h2>

    <div className="approval-list">

        <div className="approval-card">

            <h3>
                View Users
            </h3>

            <p>
                Manage all registered users.
            </p>

                <button
            className="approve-btn"
            onClick={() => navigate("/users")}
            >

            View Users

            </button>

        </div>



        <div className="approval-card">

            <h3>
                Create Team
            </h3>

            <p>
                Create a new team.
            </p>

            <button
            className="approve-btn"
            onClick={() => navigate("/teams/create")}
            >

            Create Team

            </button>

        </div>



        <div className="approval-card">

            <h3>
                Assign Team
            </h3>

            <p>
                Assign users to teams.
            </p>

                        <button
            className="approve-btn"
            onClick={() => navigate("/assign-team")}
            >

            Assign Team

            </button>
        </div>



        <div className="approval-card">

            <h3>
                Change Role
            </h3>

            <p>
                Update user roles.
            </p>

           <button
            className="approve-btn"
            onClick={() => navigate("/change-role")}
            >

            Change Role

            </button>

        </div>

    </div>

</div>

</div>

</DashboardLayout>

);

}

export default AdminDashboard;