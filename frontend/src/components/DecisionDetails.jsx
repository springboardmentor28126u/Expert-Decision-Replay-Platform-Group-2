import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import "../styles/Decision.css";

const DecisionDetails = () => {

    const { id } = useParams();
    const navigate = useNavigate();

    const [decision, setDecision] = useState(null);

    useEffect(() => {

        loadDecision();

    }, []);

    const loadDecision = async () => {

        try {

            const response = await API.get(`/decisions/${id}`);

            setDecision(response.data);

        } catch (error) {

            console.error(error);

            alert("Unable to load decision.");

        }

    };

    const handleDelete = async () => {

        const confirmDelete = window.confirm(
            "Are you sure you want to delete this decision?"
        );

        if (!confirmDelete) return;

        try {

            await API.delete(`/decisions/${id}`);

            alert("Decision deleted successfully.");

            navigate("/decisions");

        } catch (error) {

            console.error(error);

            alert("Unable to delete decision.");

        }

    };

    if (!decision) {

        return <h2>Loading...</h2>;

    }

    return (

        <div className="details-container">

            <h2>Decision Details</h2>

            <div className="details-card">

                <p>
                    <strong>ID:</strong> {decision.id}
                </p>

                <p>
                    <strong>Title:</strong> {decision.title}
                </p>

                <p>
                    <strong>Description:</strong>
                </p>

                <p>{decision.description}</p>

                <p>
                    <strong>Status:</strong> {decision.status}
                </p>

                <p>
                    <strong>Created By:</strong> {decision.created_by}
                </p>

                <p>
                    <strong>Created At:</strong>{" "}
                    {new Date(decision.created_at).toLocaleString()}
                </p>

            </div>

            <div className="button-group">

                <button
                    className="edit-btn"
                    onClick={() =>
                        navigate(`/decision/edit/${decision.id}`)
                    }
                >
                    Edit
                </button>

                <button
                    className="delete-btn"
                    onClick={handleDelete}
                >
                    Delete
                </button>

                <button
                    className="back-btn"
                    onClick={() => navigate("/decisions")}
                >
                    Back
                </button>

            </div>

        </div>

    );

};

export default DecisionDetails;