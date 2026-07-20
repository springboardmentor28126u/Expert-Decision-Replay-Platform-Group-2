import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

import "../../styles/dashboard.css";

function DecisionList() {

    const [user, setUser] = useState(null);
    const [decisions, setDecisions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadData();

    }, []);

    const loadData = async () => {

        try {

            const [userRes, decisionRes] = await Promise.all([
                api.get("/users/me"),
                api.get("/decisions")
            ]);

            setUser(userRes.data);
            setDecisions(decisionRes.data);

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);

        }

    };

    const handleDelete = async (id) => {

        if (!window.confirm("Delete this decision?")) return;

        try {

            await api.delete(`/decisions/${id}`);

            setDecisions(
                decisions.filter((item) => item.id !== id)
            );

            alert("Decision Deleted Successfully");

        } catch (err) {

            console.error(err);

            alert(
                err.response?.data?.detail ||
                "Failed to delete decision."
            );

        }

    };

    if (loading) {

        return <h2>Loading...</h2>;

    }

    const isAdmin = user.role === "Administrator";
    const isManager = user.role === "Manager";

    return (

        <DashboardLayout user={user}>

            <div className="dashboard-page">

                <div className="page-header">

                    <h1>Decision Management</h1>

                    {(isAdmin || isManager) && (

                        <Link
                            to="/decisions/create"
                            className="approve-btn"
                        >
                            Create Decision
                        </Link>

                    )}

                </div>

                <table className="decision-table">

                    <thead>

                        <tr>

                            <th>ID</th>
                            <th>Title</th>
                            <th>Status</th>
                            <th>Owner ID</th>
                            <th>Created</th>
                            <th>Actions</th>

                        </tr>

                    </thead>

                    <tbody>

                        {

                            decisions.length > 0 ? (

                                decisions.map((decision) => (

                                    <tr key={decision.id}>

                                        <td>{decision.id}</td>

                                        <td>{decision.title}</td>

                                        <td>{decision.status}</td>

                                        <td>{decision.owner_id}</td>

                                        <td>
                                            {
                                                decision.created_at
                                                    ? new Date(
                                                        decision.created_at
                                                    ).toLocaleDateString()
                                                    : "-"
                                            }
                                        </td>

                                        <td>

                                            <Link
                                                to={`/decisions/${decision.id}`}
                                                className="approve-btn"
                                            >
                                                View
                                            </Link>

                                            {(isAdmin || isManager) && (

                                                <>

                                                    <Link
                                                        to={`/decisions/${decision.id}/edit`}
                                                        className="approve-btn"
                                                    >
                                                        Edit
                                                    </Link>

                                                    <button
                                                        className="reject-btn"
                                                        onClick={() =>
                                                            handleDelete(decision.id)
                                                        }
                                                    >
                                                        Delete
                                                    </button>

                                                </>

                                            )}

                                        </td>

                                    </tr>

                                ))

                            ) : (

                                <tr>

                                    <td
                                        colSpan="6"
                                        style={{ textAlign: "center" }}
                                    >
                                        No Decisions Found
                                    </td>

                                </tr>

                            )

                        }

                    </tbody>

                </table>

            </div>

        </DashboardLayout>

    );

}

export default DecisionList;