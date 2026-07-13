import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/dashboard.css";

import {
    Users,
    UserCheck,
    UsersRound,
    Building2
} from "lucide-react";

function AdminDashboard({ user }) {

    const statistics = [

        {
            title: "Total Users",
            value: 0,
            icon: <Users />
        },

        {
            title: "Total Teams",
            value: 0,
            icon: <Building2 />
        },

        {
            title: "Administrators",
            value: 0,
            icon: <UserCheck />
        },

        {
            title: "Managers",
            value: 0,
            icon: <UsersRound />
        }

    ];

    const recentUsers = [

        {
            name: "Raj",
            email: "raj@gmail.com",
            role: "Administrator"
        },

        {
            name: "Anjali",
            email: "anjali@gmail.com",
            role: "Employee"
        },

        {
            name: "Rahul",
            email: "rahul@gmail.com",
            role: "Manager"
        }

    ];

    const teams = [

        {
            name: "Frontend Team",
            manager: "Raj"
        },

        {
            name: "Backend Team",
            manager: "Rahul"
        },

        {
            name: "QA Team",
            manager: "Anjali"
        }

    ];
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

                recentUsers.map((item, index) => (

                    <tr key={index}>

                        <td>
                            {item.name}
                        </td>

                        <td>
                            {item.email}
                        </td>

                        <td>
                            {item.role}
                        </td>

                    </tr>

                ))

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

                teams.map((team, index) => (

                    <tr key={index}>

                        <td>
                            {team.name}
                        </td>

                        <td>
                            {team.manager}
                        </td>

                    </tr>

                ))

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

            <button className="approve-btn">
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

            <button className="approve-btn">
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

            <button className="approve-btn">
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

            <button className="approve-btn">
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