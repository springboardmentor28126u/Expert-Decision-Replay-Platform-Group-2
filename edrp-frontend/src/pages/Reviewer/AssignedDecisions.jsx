import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

function AssignedDecisions() {
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    useEffect(() => {
        fetchAssignedDecisions();
    }, []);

    const fetchAssignedDecisions = async () => {
        try {
            const response = await api.get("/decisions");
            setDecisions(response.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <DashboardLayout>
            <div className="container">
                <h2>Assigned Decisions</h2>

                {loading ? (
                    <p>Loading...</p>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Priority</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>

                        <tbody>
                            {decisions.map((decision) => (
                                <tr key={decision.id}>
                                    <td>{decision.title}</td>
                                    <td>{decision.priority}</td>
                                    <td>{decision.status}</td>

                                    <td>
                                        <button
                                            onClick={() =>
                                                navigate(`/review/${decision.id}`)
                                            }
                                        >
                                            Review
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </DashboardLayout>
    );
}

export default AssignedDecisions;