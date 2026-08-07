import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../services/api";

function Comments() {
  const [decisionId, setDecisionId] = useState("");
  const [comment, setComment] = useState("");
  const [comments, setComments] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await api.get("/me", { headers });
        setCurrentUser(res.data);
      } catch (error) {
        console.log(error);
      }
    };
    loadUser();
  }, []);

  const fetchComments = async () => {
    if (!decisionId) return;

    try {
      const response = await api.get(`/comments/${decisionId}`, { headers });
      setComments(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const addComment = async (e) => {
    e.preventDefault();
    if (!comment.trim() || !decisionId) return;

    try {
      await api.post(
        `/comments/${decisionId}`,
        { comment: comment },
        { headers }
      );

      setComment("");
      fetchComments();
    } catch (error) {
      console.log(error.response);
      alert(error.response?.data?.detail || "Failed to add comment");
    }
  };

  const getInitial = (name) => {
    if (!name) return "?";
    return String(name).charAt(0).toUpperCase();
  };

  const formatTime = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleString([], {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <Layout>
      <div className="container-fluid">
        <h2 className="fw-bold mb-4">Discussion</h2>

        <div className="card shadow border-0">
          <div className="card-header bg-primary text-white d-flex align-items-center justify-content-between flex-wrap gap-2">
            <h5 className="mb-0">Decision Comments</h5>
            <div className="d-flex gap-2">
              <input
                className="form-control form-control-sm"
                style={{ width: "160px" }}
                placeholder="Decision ID"
                value={decisionId}
                onChange={(e) => setDecisionId(e.target.value)}
              />
              <button
                className="btn btn-light btn-sm fw-semibold text-primary"
                onClick={fetchComments}
              >
                Load
              </button>
            </div>
          </div>

          {/* Chat window */}
          <div
            className="card-body"
            style={{
              height: "420px",
              overflowY: "auto",
              backgroundColor: "#f4f7fb",
            }}
          >
            {comments.length === 0 ? (
              <p className="text-muted text-center mt-5">
                No comments yet. Load a decision to see the discussion.
              </p>
            ) : (
              comments.map((c) => {
                const isOwn =
                  currentUser && c.user_id === currentUser.id;

                return (
                  <div
                    key={c.id}
                    className={`d-flex mb-3 ${
                      isOwn ? "justify-content-end" : "justify-content-start"
                    }`}
                  >
                    {!isOwn && (
                      <div
                        className="rounded-circle bg-primary text-white d-flex align-items-center justify-content-center me-2 flex-shrink-0"
                        style={{ width: "36px", height: "36px", fontSize: "14px" }}
                      >
                        {getInitial(c.user_name)}
                      </div>
                    )}

                    <div style={{ maxWidth: "65%" }}>
                      <div
                        className={`px-3 py-2 rounded-3 ${
                          isOwn
                            ? "bg-primary text-white"
                            : "bg-white border"
                        }`}
                        style={{
                          borderTopRightRadius: isOwn ? "4px" : "12px",
                          borderTopLeftRadius: isOwn ? "12px" : "4px",
                        }}
                      >
                        {!isOwn && (
                          <div className="fw-semibold small mb-1">
                            {c.user_name}{" "}
                            <span className="text-muted">({c.user_role})</span>
                          </div>
                        )}
                        <div>{c.comment}</div>
                      </div>
                      <div
                        className={`small text-muted mt-1 ${
                          isOwn ? "text-end" : "text-start"
                        }`}
                      >
                        {formatTime(c.created_at)}
                      </div>
                    </div>

                    {isOwn && (
                      <div
                        className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center ms-2 flex-shrink-0"
                        style={{ width: "36px", height: "36px", fontSize: "14px" }}
                      >
                        {getInitial(c.user_name)}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Message input bar */}
          <div className="card-footer bg-white">
            <form onSubmit={addComment} className="d-flex gap-2">
              <input
                className="form-control"
                placeholder="Type a message..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button className="btn btn-primary px-4" type="submit">
                Send
              </button>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}

export default Comments;