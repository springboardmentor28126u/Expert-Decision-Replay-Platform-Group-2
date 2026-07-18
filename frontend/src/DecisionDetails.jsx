import { useState, useEffect } from "react";
import axios from "axios";

function DecisionDetails({ decision, token, profile, onStatusUpdated }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // Form states for posting a new comment/meeting note
  const [newMessageType, setNewMessageType] = useState("comment"); // "comment" or "meeting_note"
  const [newMessageText, setNewMessageText] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // States for inline replies and inline edits
  const [replyToId, setReplyToId] = useState(null); // ID of comment being replied to
  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState(null);

  const [editingId, setEditingId] = useState(null); // ID of comment being edited
  const [editText, setEditText] = useState("");
  const [editFile, setEditFile] = useState(null);

  // Fetch the discussion thread for this decision
  const fetchThread = async () => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/discussion/decision/${decision.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessages(res.data);
      setError("");
    } catch (err) {
      console.error("Failed to load thread", err);
      setError("Could not load discussion. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (decision?.id) {
      setLoading(true);
      fetchThread();
    }
  }, [decision?.id]);

  // Handle decision status update (manager/admin only)
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      const res = await axios.put(
        `http://127.0.0.1:8000/decisions/${decision.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onStatusUpdated) {
        onStatusUpdated(res.data);
      }
    } catch (err) {
      console.error("Failed to update status", err);
      alert("Error: You might not have permission to update the decision status.");
    }
  };

  // Helper to format attachment URLs
  const getAttachmentUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://127.0.0.1:8000${url}`;
  };

  const isImageFile = (url) => {
    if (!url) return false;
    const extension = url.split(".").pop().toLowerCase();
    return ["jpg", "jpeg", "png"].includes(extension);
  };

  // Delete message handler
  const handleDelete = async (msgId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/discussion/${msgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchThread();
    } catch (err) {
      console.error("Failed to delete comment", err);
      alert("Error: Failed to delete comment.");
    }
  };

  // Post top-level comment/meeting note
  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim() && !selectedFile) {
      setFormError("Please enter a message or select an attachment.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      const formData = new FormData();
      formData.append("decision_id", decision.id);
      formData.append("message", newMessageText);
      if (selectedFile) {
        formData.append("attachment", selectedFile);
      }

      const url =
        newMessageType === "meeting_note"
          ? "http://127.0.0.1:8000/discussion/meeting-note"
          : "http://127.0.0.1:8000/discussion";

      await axios.post(url, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setNewMessageText("");
      setSelectedFile(null);
      fetchThread();
    } catch (err) {
      console.error("Error posting message", err);
      setFormError("Failed to post message. Ensure attachments are PDF, DOCX, JPG, or PNG.");
    } finally {
      setSubmitting(false);
    }
  };

  // Post nested reply
  const handlePostReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim() && !replyFile) {
      alert("Please enter a message or select an attachment.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("parent_id", parentId);
      formData.append("message", replyText);
      if (replyFile) {
        formData.append("attachment", replyFile);
      }

      await axios.post("http://127.0.0.1:8000/discussion/reply", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setReplyText("");
      setReplyFile(null);
      setReplyToId(null);
      fetchThread();
    } catch (err) {
      console.error("Error posting reply", err);
      alert("Failed to post reply. Verify attachment type (PDF, DOCX, JPG, PNG).");
    }
  };

  // Save inline edit
  const handleSaveEdit = async (e, msgId) => {
    e.preventDefault();
    if (!editText.trim() && !editFile) {
      alert("Message cannot be empty unless there is an attachment.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("message", editText);
      if (editFile) {
        formData.append("attachment", editFile);
      }

      await axios.put(`http://127.0.0.1:8000/discussion/${msgId}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setEditingId(null);
      setEditText("");
      setEditFile(null);
      fetchThread();
    } catch (err) {
      console.error("Error editing message", err);
      alert("Failed to edit comment.");
    }
  };

  // Format Dates nicely
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // Build the hierarchical structure of comments
  // Group all child replies by their parent_id
  const topLevel = [];
  const repliesByParent = {};

  messages.forEach((msg) => {
    if (msg.parent_id) {
      if (!repliesByParent[msg.parent_id]) {
        repliesByParent[msg.parent_id] = [];
      }
      repliesByParent[msg.parent_id].push(msg);
    } else {
      topLevel.push(msg);
    }
  });

  // Recursive component to render a single message card and its replies
  const renderMessageNode = (msg) => {
    const isOwner = msg.user_id === profile.id;
    const canDelete = isOwner || profile.role === "manager" || profile.role === "admin";
    const childReplies = repliesByParent[msg.id] || [];
    const isEditing = editingId === msg.id;

    return (
      <div 
        key={msg.id} 
        className={`discussion-message-node ${msg.parent_id ? "is-reply" : "is-root"}`}
      >
        <div className={`message-card ${msg.message_type === "meeting_note" ? "is-meeting-note" : ""}`}>
          <div className="message-header">
            <div className="message-author-info">
              <span className="message-author-name">{msg.user?.full_name || "Unknown User"}</span>
              <span className={`message-author-role ${msg.user?.role || "employee"}`}>
                {msg.user?.role || "employee"}
              </span>
              {msg.message_type === "meeting_note" && (
                <span className="message-type-badge">Official Note</span>
              )}
            </div>
            <span className="message-time">{formatDate(msg.created_at)}</span>
          </div>

          {isEditing ? (
            <form onSubmit={(e) => handleSaveEdit(e, msg.id)} className="edit-form-wrapper">
              <textarea
                className="form-textarea"
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                rows={3}
                required
              />
              <div className="form-file-input-wrapper">
                <label className="form-file-label">
                  📎 Change Attachment (Optional)
                  <input
                    type="file"
                    className="form-file-input"
                    onChange={(e) => setEditFile(e.target.files[0])}
                  />
                </label>
                {editFile && (
                  <div className="form-selected-file">
                    📄 {editFile.name}
                    <button
                      type="button"
                      className="message-action-btn delete"
                      onClick={() => setEditFile(null)}
                      style={{ border: "none", background: "none", cursor: "pointer" }}
                    >
                      (remove)
                    </button>
                  </div>
                )}
              </div>
              <div className="form-actions-row">
                <button type="submit" className="form-btn primary">Save Changes</button>
                <button
                  type="button"
                  className="form-btn secondary"
                  onClick={() => {
                    setEditingId(null);
                    setEditText("");
                    setEditFile(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="message-body">{msg.message}</div>
              {msg.attachment_url && (
                <div className="message-attachment-section">
                  {isImageFile(msg.attachment_url) ? (
                    <a
                      href={getAttachmentUrl(msg.attachment_url)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={getAttachmentUrl(msg.attachment_url)}
                        alt="Attachment preview"
                        className="attachment-preview-img"
                      />
                    </a>
                  ) : (
                    <div className="message-attachment">
                      📎{" "}
                      <a
                        href={getAttachmentUrl(msg.attachment_url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="attachment-link"
                      >
                        {msg.attachment_url.split("/").pop()}
                      </a>
                    </div>
                  )}
                </div>
              )}

              <div className="message-actions">
                <button
                  className="message-action-btn"
                  onClick={() => {
                    setReplyToId(replyToId === msg.id ? null : msg.id);
                    setReplyText("");
                    setReplyFile(null);
                  }}
                >
                  💬 Reply
                </button>
                {isOwner && (
                  <button
                    className="message-action-btn"
                    onClick={() => {
                      setEditingId(msg.id);
                      setEditText(msg.message);
                      setEditFile(null);
                    }}
                  >
                    ✏️ Edit
                  </button>
                )}
                {canDelete && (
                  <button className="message-action-btn delete" onClick={() => handleDelete(msg.id)}>
                    🗑️ Delete
                  </button>
                )}
              </div>
            </>
          )}
        </div>

        {/* Inline Reply Form */}
        {replyToId === msg.id && (
          <form onSubmit={(e) => handlePostReply(e, msg.id)} className="reply-form-wrapper">
            <textarea
              className="form-textarea"
              placeholder={`Replying to ${msg.user?.full_name || "comment"}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              required
            />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="form-file-input-wrapper" style={{ margin: 0 }}>
                <label className="form-file-label">
                  📎 Add Attachment
                  <input
                    type="file"
                    className="form-file-input"
                    onChange={(e) => setReplyFile(e.target.files[0])}
                  />
                </label>
                {replyFile && (
                  <span className="form-selected-file" style={{ display: "inline-flex", marginLeft: "8px" }}>
                    📄 {replyFile.name}
                  </span>
                )}
              </div>
              <div className="form-actions-row">
                <button type="submit" className="form-btn primary">Send Reply</button>
                <button
                  type="button"
                  className="form-btn secondary"
                  onClick={() => {
                    setReplyToId(null);
                    setReplyText("");
                    setReplyFile(null);
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Render nested replies recursively */}
        {childReplies.length > 0 && (
          <div className="replies-container">
            {childReplies.map((reply) => renderMessageNode(reply))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="decision-details-container">
      {/* Decision Summary Info */}
      <div className="decision-header-card">
        <div className="decision-title-row">
          <h1 className="decision-title-main">{decision.title}</h1>
          <div className="decision-meta-pills">
            {decision.category && (
              <span className="decision-category-pill">{decision.category}</span>
            )}
            <span
              className="dash-role-badge"
              style={{
                background:
                  decision.status === "approved"
                    ? "rgba(79, 209, 181, 0.12)"
                    : decision.status === "rejected"
                    ? "rgba(255, 107, 107, 0.12)"
                    : decision.status === "under_review"
                    ? "rgba(242, 166, 35, 0.12)"
                    : "rgba(154, 165, 181, 0.12)",
                color:
                  decision.status === "approved"
                    ? "#4FD1B5"
                    : decision.status === "rejected"
                    ? "#FF6B6B"
                    : decision.status === "under_review"
                    ? "#F2A623"
                    : "#9AA5B5",
              }}
            >
              {decision.status.replace("_", " ")}
            </span>
          </div>
        </div>

        <div className="decision-date">
          Created on {new Date(decision.created_at).toLocaleDateString()}
        </div>

        <div className="decision-problem-statement">
          <strong>Problem Statement:</strong>
          <p>{decision.problem_statement}</p>
        </div>

        {/* Manager/Admin Status update options */}
        {(profile.role === "manager" || profile.role === "admin") && (
          <div className="status-control-section">
            <span className="status-control-label">Update Status:</span>
            <select
              className="status-select"
              value={decision.status}
              onChange={handleStatusChange}
            >
              <option value="draft">Draft</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        )}
      </div>

      {/* Discussion Board Section */}
      <div className="discussion-board">
        <h2 className="discussion-title">Discussion & Meeting Notes</h2>

        {/* Post New Comment / Meeting Note Form */}
        <div className="comment-form-card">
          <form onSubmit={handlePostMessage}>
            <div className="form-tabs">
              <button
                type="button"
                className={`form-tab-btn ${newMessageType === "comment" ? "active" : ""}`}
                onClick={() => setNewMessageType("comment")}
              >
                💬 Add Comment
              </button>
              <button
                type="button"
                className={`form-tab-btn ${newMessageType === "meeting_note" ? "active" : ""}`}
                onClick={() => setNewMessageType("meeting_note")}
              >
                📝 Add Meeting Note
              </button>
            </div>

            <textarea
              className="form-textarea"
              placeholder={
                newMessageType === "meeting_note"
                  ? "Write minutes of the meeting, action items, or formal notes..."
                  : "Share feedback, ask questions, or contribute to this decision..."
              }
              value={newMessageText}
              onChange={(e) => setNewMessageText(e.target.value)}
              rows={4}
              required
            />

            <div className="form-file-input-wrapper">
              <label className="form-file-label">
                📎 Attach File (PDF, DOCX, JPG, PNG)
                <input
                  type="file"
                  className="form-file-input"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                />
              </label>
              {selectedFile && (
                <div className="form-selected-file">
                  📄 {selectedFile.name}
                  <button
                    type="button"
                    className="message-action-btn delete"
                    onClick={() => setSelectedFile(null)}
                    style={{ border: "none", background: "none", cursor: "pointer", marginLeft: "4px" }}
                  >
                    (remove)
                  </button>
                </div>
              )}
            </div>

            {formError && <div className="auth-message error" style={{ marginBottom: "12px" }}>{formError}</div>}

            <div className="form-actions-row">
              <button type="submit" className="form-btn primary" disabled={submitting}>
                {submitting
                  ? "Posting..."
                  : newMessageType === "meeting_note"
                  ? "Post Meeting Note"
                  : "Post Comment"}
              </button>
            </div>
          </form>
        </div>

        {loading ? (
          <p className="dash-card-note">Loading discussion stream...</p>
        ) : error ? (
          <div className="auth-message error">{error}</div>
        ) : (
          <div className="discussion-stream">
            {topLevel.length === 0 ? (
              <p className="dash-card-note">No comments or meeting notes yet. Start the conversation!</p>
            ) : (
              topLevel.map((msg) => renderMessageNode(msg))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default DecisionDetails;
