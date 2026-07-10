import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/dashboard.css";

function ReviewerDashboard({ user }) {
    const statistics = [
        {
            title: "Assigned Reviews",
            value: 8
        },
        {
            title: "Pending Feedback",
            value: 5
        },
        {
            title: "Reviewed Decisions",
            value: 12
        },
        {
            title: "Escalated Items",
            value: 2
        }
    ];

    return (
        <DashboardLayout user={user}>
            <div className="dashboard-page">
                <div className="page-header">
                    <h1>Reviewer Dashboard</h1>
                    <p>Welcome back, {user.name}</p>
                </div>

                <div className="stats-grid">
                    {statistics.map((item, index) => (
                        <div className="stat-card" key={index}>
                            <h3>{item.title}</h3>
                            <h2>{item.value}</h2>
                        </div>
                    ))}
                </div>

                <div className="dashboard-section">
                    <h2>Review Queue</h2>
                    <table className="decision-table">
                        <thead>
                            <tr>
                                <th>Decision</th>
                                <th>Owner</th>
                                <th>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr>
                                <td>Cloud Migration
                                </td>
                                <td>Raj</td>
                                <td>
                                    <span className="status pending">Pending</span>
                                </td>
                            </tr>
                            <tr>
                                <td>Security Policy</td>
                                <td>Anjali</td>
                                <td>
                                    <span className="status review">In Review</span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardLayout>
    );
}

export default ReviewerDashboard;
