import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import API from "../services/api";
import "../styles/Alternative.css";

function AlternativeList() {
  const navigate = useNavigate();
  const { decisionId } = useParams();

  const [alternatives, setAlternatives] = useState([]);

  useEffect(() => {
    loadAlternatives();
  }, []);

  const loadAlternatives = async () => {
    try {
      const response = await API.get(
        `/alternatives/decision/${decisionId}`
      );

      setAlternatives(response.data);
    } catch (error) {
      console.log(error);
      alert("Unable to load alternatives.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this alternative?")) {
      return;
    }

    try {
      await API.delete(`/alternatives/${id}`);

      alert("Alternative deleted successfully.");

      loadAlternatives();
    } catch (error) {
      console.log(error);
      alert("Delete failed.");
    }
  };

  return (
    <div className="alternative-container">

      <div className="alternative-header">

        <h1>Alternative Comparison</h1>

        <div>

          <button
            className="back-btn"
            onClick={() => navigate("/decisions")}
          >
            ← Back
          </button>

          <button
            className="add-btn"
            onClick={() =>
              navigate(`/alternative/new/${decisionId}`)
            }
          >
            + Add Alternative
          </button>

          <button
            className="compare-btn"
            onClick={() =>
              navigate(`/comparison/${decisionId}`)
            }
          >
            Compare Alternatives
          </button>

        </div>

      </div>

      <table className="alternative-table">

        <thead>

          <tr>

            <th>Title</th>
            <th>Description</th>
            <th>Pros</th>
            <th>Cons</th>
            <th>Score</th>
            <th>Actions</th>

          </tr>

        </thead>

        <tbody>

          {alternatives.length === 0 ? (

            <tr>
              <td colSpan="6">
                No Alternatives Found
              </td>
            </tr>

          ) : (

            alternatives.map((alternative) => (

              <tr key={alternative.id}>

                <td>{alternative.title}</td>

                <td>{alternative.description}</td>

                <td>{alternative.pros}</td>

                <td>{alternative.cons}</td>

                <td>{alternative.score}</td>

                <td>

                  <button
                    className="edit-btn"
                    onClick={() =>
                      navigate(`/alternative/edit/${alternative.id}`)
                    }
                  >
                    Edit
                  </button>

                  <button
                    className="delete-btn"
                    onClick={() =>
                      handleDelete(alternative.id)
                    }
                  >
                    Delete
                  </button>

                </td>

              </tr>

            ))

          )}

        </tbody>

      </table>

    </div>
  );
}

export default AlternativeList;