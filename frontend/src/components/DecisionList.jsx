import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "../styles/Decision.css";

const DecisionList = () => {
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    try {
      const response = await API.get("/decisions/");
      setDecisions(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching decisions:", error);
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this decision?"
    );

    if (!confirmDelete) return;

    try {
      await API.delete(`/decisions/${id}`);

      setDecisions(
        decisions.filter((decision) => decision.id !== id)
      );

      alert("Decision deleted successfully.");
    } catch (error) {
      console.error(error);
      alert("Unable to delete decision.");
    }
  };

  if (loading) {
    return <h2>Loading Decisions...</h2>;
  }

  return (
    <div className="decision-container">

      {/* Header */}
      <div className="decision-header">

        <h1>Decision Management</h1>

        <div className="header-buttons">

          <button
            className="dashboard-btn"
            onClick={() => navigate("/dashboard")}
          >
            ← Dashboard
          </button>

          <button
            className="add-btn"
            onClick={() => navigate("/decision/new")}
          >
            + Create Decision
          </button>

        </div>

      </div>

      {decisions.length === 0 ? (
        <p>No decisions found.</p>
      ) : (
        <table className="decision-table">

          <thead>
            <tr>
              <th>ID</th>
              <th>Title</th>
              <th>Description</th>
              <th>Status</th>
              <th>Created By</th>
              <th>Created At</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>

            {decisions.map((decision) => (

              <tr key={decision.id}>

                <td>{decision.id}</td>

                <td>{decision.title}</td>

                <td>{decision.description}</td>

                <td>{decision.status}</td>

                <td>{decision.created_by}</td>

                <td>
                  {new Date(decision.created_at).toLocaleString()}
                </td>

                <td>

                  <button
                    className="edit-btn"
                    onClick={() =>
                      navigate(`/decision/edit/${decision.id}`)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="alternative-btn"
                    onClick={() =>
                      navigate(`/decision/${decision.id}/alternatives`)
                    }
                  >
                    Alternatives
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() =>
                      handleDelete(decision.id)
                    }
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))}

          </tbody>

        </table>
      )}

    </div>
  );
};

export default DecisionList;