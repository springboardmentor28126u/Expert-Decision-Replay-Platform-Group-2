import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

function ReviewerDashboard() {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        assigned: 0,
        pending: 0,
        completed: 0,
        overdue: 0,
    });

    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            // Assigned decisions
            const response = await api.get("/decisions");

            const data = response.data || [];

            setDecisions(data);

            setStats({
                assigned: data.length,
                pending: data.filter(
                    (d) => d.status?.toLowerCase() === "pending"
                ).length,
                completed: data.filter(
                    (d) => d.status?.toLowerCase() === "approved"
                ).length,
                overdue: data.filter(
                    (d) => d.status?.toLowerCase() === "overdue"
                ).length,
            });
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="dashboard-page">

                <h2>Reviewer Dashboard</h2>

                {/* Statistics */}

                <div className="dashboard-cards">

                    <div className="dashboard-card">
                        <h3>{stats.assigned}</h3>
                        <p>Assigned Decisions</p>
                    </div>

                    <div className="dashboard-card">
                        <h3>{stats.pending}</h3>
                        <p>Pending Reviews</p>
                    </div>

                    <div className="dashboard-card">
                        <h3>{stats.completed}</h3>
                        <p>Completed Reviews</p>
                    </div>

                    <div className="dashboard-card">
                        <h3>{stats.overdue}</h3>
                        <p>Overdue</p>
                    </div>

                </div>

                <br />

                <h3>Assigned Decisions</h3>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Created By</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>

                            {decisions.length === 0 ? (
                                <tr>
                                    <td colSpan="5">
                                        No Assigned Decisions
                                    </td>
                                </tr>
                            ) : (
                                decisions.map((decision) => (
                                    <tr key={decision.id}>
                                        <td>{decision.title}</td>

                                        <td>{decision.priority}</td>

                                        <td>{decision.status}</td>

                                        <td>{decision.created_by}</td>

                                        <td>

                                            <button
                                                className="btn btn-primary"
                                                onClick={() =>
                                                    navigate(
                                                        `/decisions/${decision.id}`
                                                    )
                                                }
                                            >
                                                Review
                                            </button>

                                        </td>
                                    </tr>
                                ))
                            )}

                        </tbody>
                    </table>
                )}

            </div>
        </DashboardLayout>
    );
}

export default ReviewerDashboard;