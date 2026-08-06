import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import AlternativeList from "../../components/AlternativeList";
import KnowledgeList from "../../components/KnowledgeList";
import AttachmentList from "../../components/AttachmentList";
import VersionHistoryList from "../../components/decision/VersionHistoryList";

import api from "../../services/api";

import "../../styles/dashboard.css";

function DecisionDetails() {

    const { id } = useParams();

    const [user, setUser] = useState(null);
    const [decision, setDecision] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {

        loadData();

    }, [id]);

    const loadData = async () => {

        try {

            const [userRes, decisionRes] = await Promise.all([
                api.get("/users/me"),
                api.get(`/decisions/${id}`)
            ]);

            setUser(userRes.data);
            setDecision(decisionRes.data);

        } catch (err) {

            console.error(err);

        } finally {

            setLoading(false);

        }

    };

    if (loading) {

        return <h2>Loading...</h2>;

    }

    if (!decision || !user) {

        return <h2>Decision Not Found</h2>;

    }

    const isAdmin = user.role === "Administrator";
    const isManager = user.role === "Manager";

    return (

        <DashboardLayout user={user}>

            <div className="dashboard-page">

                <div className="page-header">

                    <h1>Decision Details</h1>

                </div>

                <div className="dashboard-section">

                    <h2>Decision Information</h2>

                    <div className="profile-card">

                        <p><strong>Title :</strong> {decision.title}</p>

                        <p><strong>Description :</strong> {decision.description}</p>

                        <p><strong>Status :</strong> {decision.status}</p>

                        <p><strong>Owner ID :</strong> {decision.owner_id}</p>

                        <p>
                            <strong>Created :</strong>{" "}
                            {decision.created_at
                                ? new Date(decision.created_at).toLocaleString()
                                : "-"}
                        </p>

                        <p>
                            <strong>Updated :</strong>{" "}
                            {decision.updated_at
                                ? new Date(decision.updated_at).toLocaleString()
                                : "-"}
                        </p>

                    </div>

                </div>

                <div className="dashboard-section">

                    <AlternativeList decisionId={decision.id} />

                    <Link
                        to={`/decisions/${decision.id}/alternatives`}
                        className="approve-btn"
                    >
                        View All Alternatives
                    </Link>

                </div>

                <div className="dashboard-section">

                    <KnowledgeList decisionId={decision.id} />

                    <Link
                        to={`/decisions/${decision.id}/knowledge`}
                        className="approve-btn"
                    >
                        View Knowledge
                    </Link>

                </div>

                <div className="dashboard-section">

                    <AttachmentList decisionId={decision.id} />

                    <Link
                        to={`/decisions/${decision.id}/attachments`}
                        className="approve-btn"
                    >
                        View All Attachments
                    </Link>

                </div>

                <div className="dashboard-section">

                    <VersionHistoryList decisionId={decision.id} />

                    <Link
                        to={`/decisions/${decision.id}/history`}
                        className="approve-btn"
                    >
                        View Version History
                    </Link>
                       
                </div>
                <div className="dashboard-section">

                <Link
                    to={`/decisions/${decision.id}/discussion`}
                    className="approve-btn"
                >
                    View Discussions
                </Link>

            </div>

                {(isAdmin || isManager) && (

                    <div className="dashboard-section">

                        <Link
                            to={`/decisions/${decision.id}/edit`}
                            className="approve-btn"
                        >
                            Edit Decision
                        </Link>

                    </div>

                )}

            </div>

        </DashboardLayout>

    );

}

export default DecisionDetails;