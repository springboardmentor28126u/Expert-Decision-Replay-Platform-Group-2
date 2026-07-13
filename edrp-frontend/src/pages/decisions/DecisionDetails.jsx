import { Link } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import "../../styles/dashboard.css";

import dummyUser from "../../data/dummyUser";

import AlternativeList from "../../components/AlternativeList";
import KnowledgeList from "../../components/KnowledgeList";
import AttachmentList from "../../components/AttachmentList";
import VersionHistory from "../../components/VersionHistory";

function DecisionDetails() {

    const user = dummyUser;

    const decision = {
        id: 1,
        title: "Cloud Migration",
        description:
            "Migrate company infrastructure from on-premise servers to cloud platform.",
        status: "Draft",
        category: "Technology",
        owner: "Raj",
        created_at: "13 July 2026",
        updated_at: "13 July 2026"
    };

    const isAdmin = user.role === "Administrator";
    const isManager = user.role === "Manager";

    return (

        <DashboardLayout user={user}>

            <div className="dashboard-page">

                <div className="page-header">
                    <h1>Decision Details</h1>
                </div>

                {/* Decision Information */}

                <div className="dashboard-section">

                    <h2>Decision Information</h2>

                    <div className="profile-card">

                        <p><strong>Title :</strong> {decision.title}</p>

                        <p><strong>Description :</strong> {decision.description}</p>

                        <p><strong>Status :</strong> {decision.status}</p>

                        <p><strong>Category :</strong> {decision.category}</p>

                        <p><strong>Owner :</strong> {decision.owner}</p>

                        <p><strong>Created :</strong> {decision.created_at}</p>

                        <p><strong>Updated :</strong> {decision.updated_at}</p>

                    </div>

                </div>

                {/* Alternatives */}

                <AlternativeList decisionId={decision.id} />

                {/* Knowledge */}

                <KnowledgeList decisionId={decision.id} />

                {/* Attachments */}

                <AttachmentList decisionId={decision.id} />

                {/* Version History */}

                <VersionHistory decisionId={decision.id} />

                {(isAdmin || isManager) && (

                    <div className="dashboard-section">

                        <Link
                            to={`/decisions/edit/${decision.id}`}
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