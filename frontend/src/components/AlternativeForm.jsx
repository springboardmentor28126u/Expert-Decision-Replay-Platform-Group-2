import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import "../styles/Alternative.css";

function AlternativeForm() {

    const navigate = useNavigate();

    const { id, decisionId } = useParams();

    const isEdit = Boolean(id);

    const [alternative, setAlternative] = useState({
        decision_id: decisionId || "",
        title: "",
        description: "",
        pros: "",
        cons: "",
        score: 0
    });

    useEffect(() => {
        if (isEdit) {
            loadAlternative();
        }
    }, []);

    const loadAlternative = async () => {
        try {
            const response = await API.get(`/alternatives/${id}`);
            setAlternative(response.data);
        } catch (error) {
            console.log(error);
            alert("Unable to load alternative.");
        }
    };

    const handleChange = (e) => {
        setAlternative({
            ...alternative,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {

            if (isEdit) {

                await API.put(
                    `/alternatives/${id}`,
                    alternative
                );

                alert("Alternative updated successfully.");

            } else {

                await API.post(
                    "/alternatives/",
                    alternative
                );

                alert("Alternative created successfully.");

            }

            // Go back to Alternative Comparison page
            navigate(`/decision/${alternative.decision_id}/alternatives`);

        } catch (error) {

            console.log(error);
            alert("Something went wrong.");

        }
    };

    return (

        <div className="form-container">

            <h2>
                {isEdit ? "Update Alternative" : "Create Alternative"}
            </h2>

            <form onSubmit={handleSubmit}>

                <label>Title</label>
                <input
                    type="text"
                    name="title"
                    value={alternative.title}
                    onChange={handleChange}
                    required
                />

                <label>Description</label>
                <textarea
                    name="description"
                    rows="4"
                    value={alternative.description}
                    onChange={handleChange}
                    required
                />

                <label>Pros</label>
                <textarea
                    name="pros"
                    rows="3"
                    value={alternative.pros}
                    onChange={handleChange}
                />

                <label>Cons</label>
                <textarea
                    name="cons"
                    rows="3"
                    value={alternative.cons}
                    onChange={handleChange}
                />

                <label>Score</label>
                <input
                    type="number"
                    name="score"
                    min="0"
                    max="10"
                    step="0.1"
                    value={alternative.score}
                    onChange={handleChange}
                />

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
                        onClick={() =>
                            navigate(`/decision/${alternative.decision_id}/alternatives`)
                        }
                    >
                        Cancel
                    </button>

                </div>

            </form>

        </div>

    );
}

export default AlternativeForm;