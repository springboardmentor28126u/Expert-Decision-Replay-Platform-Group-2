import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import api from "../services/api";

function DecisionDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [decision, setDecision] = useState(null);
  const [comments, setComments] = useState([]);
  const [alternatives, setAlternatives] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem("token");

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
      };

      const decisionRes = await api.get(`/decisions/${id}`, { headers });
      setDecision(decisionRes.data);

      const commentRes = await api.get(`/comments/${id}`, { headers });
      setComments(commentRes.data);

      const alternativeRes = await api.get(`/alternatives/${id}`, {
        headers,
      });
      setAlternatives(alternativeRes.data);

      const documentRes = await api.get(`/decisions/${id}/documents`, {
        headers,
      });
      setDocuments(documentRes.data);

      const historyRes = await api.get(
        `/decisions/${id}/history`,
        { headers }
      );
      setHistory(historyRes.data);

    } catch (err) {
      console.log(err.response);
      alert(err.response?.data?.detail || "Failed to load details");
    }
  };

  const deleteDecision = async () => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this decision?"
    );

    if (!confirmDelete) return;

    try {
      const token = localStorage.getItem("token");

      await api.delete(`/decisions/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      alert("Decision deleted successfully");
      navigate("/decisions");

    } catch (err) {
      alert(err.response?.data?.detail || "Delete failed");
    }
  };
  const approveDecision = async () => {
  try {
    const token = localStorage.getItem("token");

    await api.put(
      `/decisions/${id}/approve`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Decision Approved Successfully");

    loadData();

  } catch (err) {
    alert(err.response?.data?.detail || "Approval failed");
  }
};

const rejectDecision = async () => {
  try {
    const token = localStorage.getItem("token");

    await api.put(
      `/decisions/${id}/reject`,
      {},
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Decision Rejected Successfully");

    loadData();

  } catch (err) {
    alert(err.response?.data?.detail || "Rejection failed");
  }
};

  if (!decision) {
    return (
      <Layout>
        <div className="container mt-5">
          <h3>Loading...</h3>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container">

        <h2 className="mb-4">Decision Details</h2>

        <div className="card shadow mb-4">

          <div className="card-body">

            <h3>{decision.title}</h3>

            <hr />

            <p><strong>Description:</strong><br />{decision.description}</p>

            <p><strong>Category:</strong> {decision.category}</p>

            <p><strong>Status:</strong> {decision.status}</p>

            <div className="mt-4">

              <Link
                to={`/decision/edit/${id}`}
                className="btn btn-warning me-2"
              >
                ✏️ Edit
              </Link>
              <Link
                to={`/decision/history/${id}`}
                className="btn btn-info me-2"
              >
               📜 History
              </Link>

              <button
                className="btn btn-success me-2"
                onClick={approveDecision}
              >
                ✅ Approve
              </button>

              <button
                className="btn btn-secondary me-2"
                onClick={rejectDecision}
              >
                ❌ Reject
              </button>

              <button
                className="btn btn-danger"
                onClick={deleteDecision}
              >
                🗑 Delete
              </button>

            </div>

          </div>

        </div>

        <div className="card shadow mb-4">

          <div className="card-header bg-primary text-white">
            Comments
          </div>

          <div className="card-body">

            {comments.length === 0 ? (
              <p>No Comments Available</p>
            ) : (
              comments.map((comment) => (
                <div
                  key={comment.id}
                  className="border rounded p-3 mb-3"
                >
                  {comment.comment}
                </div>
              ))
            )}

          </div>

        </div>

                <div className="card shadow mb-4">

          <div className="card-header bg-success text-white">
            Alternatives
          </div>

          <div className="card-body">

            {alternatives.length === 0 ? (
              <p>No Alternatives Available</p>
            ) : (
              alternatives.map((alternative) => (
                <div
                  key={alternative.id}
                  className="border rounded p-3 mb-3"
                >

                  <h5>{alternative.option_name}</h5>

                  <p><strong>Pros:</strong> {alternative.pros}</p>

                  <p><strong>Cons:</strong> {alternative.cons}</p>

                  <p><strong>Estimated Cost:</strong> {alternative.estimated_cost}</p>

                  <p><strong>Feasibility:</strong> {alternative.feasibility}</p>

                  <p><strong>Risk Level:</strong> {alternative.risk_level}</p>

                </div>
              ))
            )}

          </div>

        </div>

        <div className="card shadow mb-4">

          <div className="card-header bg-dark text-white">
            Documents
          </div>

          <div className="card-body">

            {documents.length === 0 ? (
              <p>No Documents Uploaded</p>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="border rounded p-3 mb-2"
                >
                  📄 {doc.file_name}
                </div>
              ))
            )}

          </div>

        </div>

        <div className="card shadow mb-4">

          <div className="card-header bg-info text-white">
            📜 Decision History
          </div>

          <div className="card-body">

            {history.length === 0 ? (
              <p>No History Available</p>
            ) : (
              history.map((item, index) => (
                <div
                  key={item.id}
                  className="border rounded p-3 mb-3"
                >

                  <h5>Version {history.length - index}</h5>

                  <p>
                    <strong>Title:</strong> {item.title}
                  </p>

                  <p>
                    <strong>Description:</strong> {item.description}
                  </p>

                  <p>
                    <strong>Category:</strong> {item.category}
                  </p>

                  <p>
                    <strong>Status:</strong> {item.status}
                  </p>

                  <p className="text-muted">
                    Updated:
                    {" "}
                    {new Date(item.updated_at).toLocaleString()}
                  </p>

                </div>
              ))
            )}

          </div>

        </div>

      </div>

    </Layout>
  );
}

export default DecisionDetails;