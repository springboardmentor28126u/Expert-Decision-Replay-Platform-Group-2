

import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/dashboard.css";

function ManagerDashboard({ user }) {

    const statistics = [

        {
            title: "Total Team Members",
            value: 0
        },

        {
            title: "Total Teams",
            value: 0
        },

        {
            title: "Assigned Team",
            value: "-"
        },

        {
            title: "Active Users",
            value: 0
        }

    ];


    return (

        <DashboardLayout user={user}>

            <div className="dashboard-page">

                <div className="page-header">

                    <h1>
                        Manager Dashboard
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

                                <h3>
                                    {item.title}
                                </h3>

                                <h2>
                                    {item.value}
                                </h2>

                            </div>

                        ))
                    }

                </div>

             




                {/* Team Decisions */}


                <div className="dashboard-section">

                    <h2>
                        Team Members
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

                            <tr>

                                <td>Raj</td>

                                <td>raj@gmail.com</td>

                                <td>Manager</td>

                            </tr>

                            <tr>

                                <td>Anjali</td>

                                <td>anjali@gmail.com</td>

                                <td>Employee</td>

                            </tr>

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
                        Manage all team members.
                    </p>

                    <button className="approve-btn">
                        View Users
                    </button>

                </div>

                <div className="approval-card">

                    <h3>
                        View Teams
                    </h3>

                    <p>
                        Check assigned teams.
                    </p>

                    <button className="approve-btn">
                        View Teams
                    </button>

                </div>

            </div>

        </div>
                

        </div>

        </DashboardLayout>

    );

}

export default ManagerDashboard;