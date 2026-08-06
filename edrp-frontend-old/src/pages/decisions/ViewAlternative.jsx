import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import DashboardLayout from "../../components/layout/DashboardLayout";
import api from "../../services/api";

import "../../styles/viewAlternative.css";

function ViewAlternative() {

    const { id } = useParams();

    const [alternative, setAlternative] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAlternative();
    }, []);

    const loadAlternative = async () => {

        try {

            const response = await api.get(`/alternatives/${id}`);

            setAlternative(response.data);

        } catch (error) {

            console.error(error);

            alert("Failed to load Alternative.");

        } finally {

            setLoading(false);

        }

    };

    if (loading) {

        return (
            <DashboardLayout>
                <h3>Loading...</h3>
            </DashboardLayout>
        );

    }

    return (

        <DashboardLayout>

            <div className="view-alternative-page">

                <h2>Alternative Details</h2>

                <div className="detail-card">

                    <div className="detail-row">
                        <label>ID</label>
                        <span>{alternative.id}</span>
                    </div>

                    <div className="detail-row">
                        <label>Title</label>
                        <span>{alternative.title || "-"}</span>
                    </div>

                    <div className="detail-row">
                        <label>Description</label>
                        <span>{alternative.description}</span>
                    </div>

                    <div className="detail-row">
                        <label>Pros</label>
                        <span>{alternative.pros || "-"}</span>
                    </div>

                    <div className="detail-row">
                        <label>Cons</label>
                        <span>{alternative.cons || "-"}</span>
                    </div>

                    <div className="detail-row">
                        <label>Score</label>
                        <span>{alternative.score ?? "-"}</span>
                    </div>

                    <div className="detail-row">
                        <label>Estimated Cost</label>
                        <span>{alternative.estimated_cost ?? "-"}</span>
                    </div>

                    <div className="detail-row">
                        <label>Feasibility Score</label>
                        <span>{alternative.feasibility_score ?? "-"}</span>
                    </div>

                    <div className="detail-row">
                        <label>Risk Score</label>
                        <span>{alternative.risk_score ?? "-"}</span>
                    </div>

                    <div className="detail-row">
                        <label>Status</label>
                        <span>
                            {alternative.is_selected
                                ? "Selected"
                                : "Not Selected"}
                        </span>
                    </div>

                </div>

                <div className="button-group">

                    <Link
                        to={`/alternatives/edit/${alternative.id}`}
                        className="edit-btn"
                    >
                        Edit
                    </Link>

                    <Link
                        to={`/decisions/${alternative.decision_id}/alternatives`}
                        className="back-btn"
                    >
                        Back
                    </Link>

                </div>

            </div>

        </DashboardLayout>

    );

}

export default ViewAlternative;