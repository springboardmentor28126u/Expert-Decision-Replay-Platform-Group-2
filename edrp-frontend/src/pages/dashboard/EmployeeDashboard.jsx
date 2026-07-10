import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/dashboard.css";

function EmployeeDashboard({ user }) {

    const statistics = [

        {
            title: "My Decisions",
            value: 15
        },

        {
            title: "Pending Reviews",
            value: 4
        },

        {
            title: "Approved Decisions",
            value: 10
        },

        {
            title: "Rejected Decisions",
            value: 1
        }

    ];

    return (

        <DashboardLayout user={user}>

            <div className="dashboard-page">

                <div className="page-header">

                    <h1>Employee Dashboard</h1>

                    <p>
                        Welcome back, {user.name}
                    </p>

                </div>

                <div className="stats-grid">

                    {statistics.map((item, index) => (

                        <div
                            className="stat-card"
                            key={index}
                        >

                            <h3>{item.title}</h3>

                            <h2>{item.value}</h2>

                        </div>

                    ))}

                </div>

                <div className="dashboard-section">

                    <h2>My Recent Decisions</h2>

                    <table className="decision-table">

                        <thead>

                            <tr>

                                <th>Decision</th>
                                <th>Status</th>
                                <th>Created On</th>

                            </tr>

                        </thead>

                        <tbody>

                            <tr>

                                <td>Cloud Migration</td>

                                <td>
                                    <span className="status approved">
                                        Approved
                                    </span>
                                </td>

                                <td>08 Jul 2026</td>

                            </tr>

                            <tr>

                                <td>Security Policy</td>

                                <td>
                                    <span className="status pending">
                                        Under Review
                                    </span>
                                </td>

                                <td>09 Jul 2026</td>

                            </tr>

                        </tbody>

                    </table>

                </div>

            </div>

        </DashboardLayout>

    );

}

export default EmployeeDashboard;