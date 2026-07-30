import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import "../styles/Decision.css";
import FileUpload from "./FileUpload";
import FileList from "./FileList";
import Discussion from "./Discussion";
import VersionHistory from "./VersionHistory";
const DecisionForm = () => {

    const navigate = useNavigate();
    const { id } = useParams();

    const isEdit = Boolean(id);

    const [decision, setDecision] = useState({
        title: "",
        description: "",
        status: "Pending"
    });

    useEffect(() => {

        if (isEdit) {
            loadDecision();
        }

    }, []);

    const loadDecision = async () => {

        try {

            const response = await API.get(`/decisions/${id}`);

            setDecision(response.data);

        } catch (error) {

            console.log(error);
            alert("Unable to load decision.");

        }

    };

    const handleChange = (e) => {

        setDecision({
            ...decision,
            [e.target.name]: e.target.value
        });

    };

    const handleSubmit = async (e) => {

        e.preventDefault();

        try {

            if (isEdit) {

                await API.put(`/decisions/${id}`, decision);

                alert("Decision updated successfully.");

            } else {

                await API.post("/decisions/", decision);

                alert("Decision created successfully.");

            }

            navigate("/decisions");

        } catch (error) {

            console.log(error);

            alert("Something went wrong.");

        }

    };

    return (

    <div className="form-container">

        <h2>
            {isEdit ? "Update Decision" : "Create Decision"}
        </h2>

        <form onSubmit={handleSubmit}>

            <label>Decision Title</label>

            <input
                type="text"
                name="title"
                value={decision.title}
                onChange={handleChange}
                required
            />

            <label>Description</label>

            <textarea
                name="description"
                rows="5"
                value={decision.description}
                onChange={handleChange}
                required
            />

            <label>Status</label>

            <select
                name="status"
                value={decision.status}
                onChange={handleChange}
            >
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
            </select>

            <div className="button-group">

                <button
                    type="submit"
                    className="save-btn"
                >
                    {isEdit ? "Update" : "Create"}
                </button>

                <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => navigate("/decisions")}
                >
                    Cancel
                </button>

            </div>

        </form>

        {isEdit && (
            <div style={{ marginTop: "40px" }}>

                <hr />
<br />
                <h2>Decision Documents</h2>

                <FileUpload
                    decisionId={id}
                    onUploadSuccess={() => window.location.reload()}
                />

                <FileList decisionId={id} />

            </div>
        )}

        {isEdit && (
            <Discussion decisionId={id} />
        )}

    </div>

);

};

export default DecisionForm;