import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function Comments() {
  const [decisionId, setDecisionId] = useState("");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);

  const fetchComments = async () => {
    if (!decisionId) return;

    try {
      const token = localStorage.getItem("token");

      const response = await api.get(`/comments/${decisionId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      setComments(response.data);

    } catch (error) {
      console.log(error);
    }
  };

  const addComment = async (e) => {
  e.preventDefault();

  try {
    const token = localStorage.getItem("token");

    await api.post(
      `/comments/${decisionId}`,
      {
        comment: comment,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    alert("Comment Added Successfully");

    setComment("");

    fetchComments();

  } catch (error) {
    console.log(error.response);
    alert(error.response?.data?.detail || "Failed");
  }
};

  return (
    <Layout>

      <h2 className="mb-4">Comments</h2>

      <div className="card shadow mb-4">

        <div className="card-body">

          <input
            className="form-control mb-3"
            placeholder="Decision ID"
            value={decisionId}
            onChange={(e) => setDecisionId(e.target.value)}
          />

          <button
            className="btn btn-primary mb-3"
            onClick={fetchComments}
          >
            Load Comments
          </button>

          <form onSubmit={addComment}>

            <textarea
              className="form-control mb-3"
              placeholder="Write your comment..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />

            <button className="btn btn-success">
              Add Comment
            </button>

          </form>

        </div>

      </div>

      <div className="card shadow">

        <div className="card-header bg-dark text-white">
          Comments
        </div>

        <div className="card-body">

          {comments.length === 0 ? (
            <p>No comments available.</p>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="border rounded p-3 mb-2">
                <strong>User:</strong> {c.user_id}
                <br />
                <strong>Comment:</strong> {c.comment}
              </div>
            ))
          )}

        </div>

      </div>

    </Layout>
  );
}

export default Comments;