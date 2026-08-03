import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import VersionHistory from "../components/VersionHistory";
import AlternativesPanel from "../components/AlternativesPanel";
import "../styles/discussion.css";
import "../styles/dashboard.css";
import FileUpload from "../components/FileUpload";
import ApprovalHistory from "../components/ApprovalHistory";

function DecisionDetails({ decision, token, profile, onStatusUpdated, onBack }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(decision.title);
  const [editProblemStatement, setEditProblemStatement] = useState(decision.problem_statement);
  const [editCategory, setEditCategory] = useState(decision.category || "");
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "alternatives" | "discussion" | "history" | "attachments" | "approvals"
  const [editError, setEditError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const savingRef = useRef(false);
  const [showEditCustomCategory, setShowEditCustomCategory] = useState(false);

  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState("");

  useEffect(() => {
    setEditTitle(decision.title);
    setEditProblemStatement(decision.problem_statement);
    setEditCategory(decision.category || "");
  }, [decision]);

  const isClosed = decision.status === "approved" || decision.status === "rejected";
  
  // Form states for posting a new comment/meeting note
  const [newMessageType, setNewMessageType] = useState("comment"); // "comment" or "meeting_note"
  const [newMessageText, setNewMessageText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // States for inline replies and inline edits
  const [replyToId, setReplyToId] = useState(null); // ID of comment being replied to
  const [replyText, setReplyText] = useState("");

  const [editingId, setEditingId] = useState(null); // ID of comment being edited
  const [editText, setEditText] = useState("");

  // Fetch the discussion thread for this decision. backend/app returns
  // top-level comments with their direct replies already nested one level
  // deep (CommentThreadOut) — no client-side grouping needed.
  const fetchThread = useCallback(async () => {
    if (!decision?.id) return;
    setLoading(true);
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/api/v1/comments/decision/${decision.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessages(res.data);
      setError("");
    } catch (err) {
      console.error("Failed to load thread", err);
      setError("Could not load discussion. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [decision?.id, token]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  // Fetch this decision's attachments.
  const fetchAttachments = useCallback(async () => {
    if (!decision?.id) return;
    setAttachmentsLoading(true);
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/api/v1/attachments/decision/${decision.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttachments(res.data);
      setAttachmentsError("");
    } catch (err) {
      console.error("Failed to load attachments", err);
      setAttachmentsError("Could not load attachments. Please try again.");
    } finally {
      setAttachmentsLoading(false);
    }
  }, [decision?.id, token]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  // Downloads stream through the API with an auth header, so a plain
  // <a href> won't work — fetch the bytes and trigger a client-side save.
  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      const res = await fetch(
        `http://127.0.0.1:8000/api/v1/attachments/${attachmentId}/download`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Download failed");
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download attachment", err);
      alert("Failed to download attachment.");
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    if (!window.confirm("Delete this attachment?")) return;
    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/v1/attachments/${attachmentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAttachments();
    } catch (err) {
      console.error("Failed to delete attachment", err);
      alert(err?.response?.data?.detail || "Failed to delete attachment.");
    }
  };

  // Handle decision status update (manager/admin only)
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      const res = await axios.patch(
        `http://127.0.0.1:8000/api/v1/decisions/${decision.id}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onStatusUpdated) {
        onStatusUpdated(res.data);
      }
    } catch (err) {
      console.error("Failed to update status", err);
      alert(err?.response?.data?.detail || "Failed to update status.");
    }
  };

  // Delete message handler
  const handleDelete = async (msgId) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await axios.delete(`http://127.0.0.1:8000/api/v1/comments/${msgId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchThread();
    } catch (err) {
      console.error("Failed to delete comment", err);
      alert(err?.response?.data?.detail || "Failed to delete comment.");
    }
  };

  // Post top-level comment/meeting note
  const handlePostMessage = async (e) => {
    e.preventDefault();
    if (!newMessageText.trim()) {
      setFormError("Please enter a message.");
      return;
    }

    setSubmitting(true);
    setFormError("");

    try {
      await axios.post(
        `http://127.0.0.1:8000/api/v1/comments/decision/${decision.id}`,
        {
          content: newMessageText,
          is_meeting_note: newMessageType === "meeting_note",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setNewMessageText("");
      fetchThread();
    } catch (err) {
      console.error("Error posting message", err);
      setFormError(err?.response?.data?.detail || "Failed to post message.");
    } finally {
      setSubmitting(false);
    }
  };

  // Post a reply to a top-level comment/meeting note
  const handlePostReply = async (e, parentId) => {
    e.preventDefault();
    if (!replyText.trim()) {
      alert("Please enter a message.");
      return;
    }

    try {
      await axios.post(
        `http://127.0.0.1:8000/api/v1/comments/decision/${decision.id}`,
        {
          content: replyText,
          parent_comment_id: parentId,
          is_meeting_note: false,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setReplyText("");
      setReplyToId(null);
      fetchThread();
    } catch (err) {
      console.error("Error posting reply", err);
      alert(err?.response?.data?.detail || "Failed to post reply.");
    }
  };

  // Save inline edit
  const handleSaveEdit = async (e, msgId) => {
    e.preventDefault();
    if (!editText.trim()) {
      alert("Message cannot be empty.");
      return;
    }

    try {
      await axios.put(
        `http://127.0.0.1:8000/api/v1/comments/${msgId}`,
        { content: editText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEditingId(null);
      setEditText("");
      fetchThread();
    } catch (err) {
      console.error("Error editing message", err);
      alert(err?.response?.data?.detail || "Failed to edit comment.");
    }
  };

  const handleSaveDecisionEdit = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    setEditError("");
    try {
      const res = await axios.put(
        `http://127.0.0.1:8000/api/v1/decisions/${decision.id}`,
        {
          title: editTitle,
          problem_statement: editProblemStatement,
          category: editCategory,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onStatusUpdated) onStatusUpdated(res.data);
      setIsEditing(false);
    } catch (err) {
      setEditError(err?.response?.data?.detail || "Failed to save changes.");
    } finally {
      setIsSaving(false);
      savingRef.current = false;
    }
  };

  // Format Dates nicely
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  // backend/app already returns top-level comments with their direct
  // replies nested one level deep, so no client-side grouping is needed.
  const filteredTopLevel = messages.filter((msg) =>
    newMessageType === "meeting_note" ? msg.is_meeting_note : !msg.is_meeting_note
  );

  // Renders a single message card. Replies only ever nest one level deep
  // (matching what the backend returns), so the "Reply" action is only
  // offered on top-level comments — replying to a reply would create a
  // grandchild comment the list endpoint never returns.
  const renderMessageNode = (msg, isReply = false) => {
    const isOwner = msg.author?.id === profile.id;
    const canDelete = isOwner || profile.role?.name === "manager" || profile.role?.name === "administrator";
    const childReplies = msg.replies || [];
    const isEditing = editingId === msg.id;

    return (
      <div
        key={msg.id}
        className={`discussion-message-node ${isReply ? "is-reply" : "is-root"}`}
       >
        <div className="msg-avatar">
           {(msg.author?.full_name || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
        </div>
        <div className="msg-body-col">
          <div className={`message-card ${msg.is_meeting_note ? "is-meeting-note" : ""}`}>
            <div className="message-header">
             <div className="message-author-info">
               <span className="message-author-name">{msg.author?.full_name || "Unknown User"}</span>
              {msg.is_meeting_note && (
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
              <div className="form-actions-row">
                <button type="submit" className="form-btn primary">Save Changes</button>
                <button
                  type="button"
                  className="form-btn secondary"
                  onClick={() => {
                    setEditingId(null);
                    setEditText("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="message-body">{msg.content}</div>

              {!isClosed && (
                <div className="message-actions">
                  {!isReply && (
                    <button
                      className="message-action-btn"
                      onClick={() => {
                        setReplyToId(replyToId === msg.id ? null : msg.id);
                        setReplyText("");
                      }}
                    >
                      💬 Reply
                    </button>
                  )}
                  {isOwner && (
                    <button
                      className="message-action-btn"
                      onClick={() => {
                        setEditingId(msg.id);
                        setEditText(msg.content);
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
              )}
            </>
          )}
        </div>

        {/* Inline Reply Form */}
        {!isReply && replyToId === msg.id && !isClosed && (
          <form onSubmit={(e) => handlePostReply(e, msg.id)} className="reply-form-wrapper">
            <textarea
              className="form-textarea"
              placeholder={`Replying to ${msg.author?.full_name || "comment"}...`}
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={2}
              required
            />
            <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
              <div className="form-actions-row">
                <button type="submit" className="form-btn primary">Send Reply</button>
                <button
                  type="button"
                  className="form-btn secondary"
                  onClick={() => {
                    setReplyToId(null);
                    setReplyText("");
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Render direct replies (one level only) */}
        {childReplies.length > 0 && (
          <div className="replies-container">
            {childReplies.map((reply) => renderMessageNode(reply, true))}
          </div>
        )}
      </div>
      </div>
    );
  };

  return (
    <div className="decision-details-container">
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: "1px solid var(--border, #2E3646)",
          color: "var(--text-secondary, #9AA5B5)",
          padding: "8px 16px",
          borderRadius: "6px",
          fontSize: "13px",
          cursor: "pointer",
          marginBottom: "16px",
        }}
      >
        ← Back to Decisions
      </button>
      {/* Decision Summary Info — always visible */}
      <div className="decision-header-card">
        {isEditing ? (
          <div>
            <div className="auth-field">
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                style={{ fontSize: "18px", fontWeight: 700 }}
              />
            </div>
            <div className="auth-field">
              <textarea
                value={editProblemStatement}
                onChange={(e) => setEditProblemStatement(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  background: "#12161D",
                  border: "1px solid #2E3646",
                  borderRadius: "6px",
                  color: "#F1F3F6",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>
            <div className="auth-field">
              <select
                value={["Technical", "HR", "Finance", "Operations"].includes(editCategory) ? editCategory : (editCategory ? "Other" : "")}
                onChange={(e) => {
                  if (e.target.value === "Other") {
                    setEditCategory("");
                    setShowEditCustomCategory(true);
                  } else {
                    setEditCategory(e.target.value);
                    setShowEditCustomCategory(false);
                  }
                }}
                style={{
                  width: "100%", padding: "10px 12px", background: "#12161D",
                  border: "1px solid #2E3646", borderRadius: "6px", color: "#F1F3F6", fontSize: "14px", boxSizing: "border-box",
                }}
              >
                <option value="">Select a category</option>
                <option value="Technical">Technical</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Operations">Operations</option>
                <option value="Other">Other</option>
              </select>
              {showEditCustomCategory && (
                <input
                  type="text"
                  placeholder="Type your custom category"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  style={{ marginTop: "8px" }}
                />
              )}
            </div>
            {editError && <div className="auth-message error">{editError}</div>}
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="auth-button" onClick={handleSaveDecisionEdit} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
              <button
                className="dash-back-btn"
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(decision.title);
                  setEditProblemStatement(decision.problem_statement);
                  setEditCategory(decision.category || "");
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="decision-header-section" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "20px", marginBottom: "20px" }}>
              <div className="decision-title-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                <h1 className="decision-title-main" style={{ fontSize: "26px", fontWeight: "700", color: "var(--text-primary)", margin: 0, flex: "1 1 auto" }}>
                  {decision.title}
                </h1>
                
               <div style={{ display: "flex", gap: "10px", marginTop: "16px" }}>
                 <button className="dash-back-btn" onClick={() => setIsEditing(true)}>
                   ✏️ Edit Decision
                 </button>
                 <a
                  href={`http://127.0.0.1:8000/decisions/${decision.id}/export`}
                  onClick={(e) => {
                    e.preventDefault();
                    fetch(`http://127.0.0.1:8000/decisions/${decision.id}/export`, {
                      headers: { Authorization: `Bearer ${token}` },
                    })
                      .then((res) => res.blob())
                      .then((blob) => {
                         const url = window.URL.createObjectURL(blob);
                         const a = document.createElement("a");
                         a.href = url;
                         a.download = `decision_${decision.id}.pdf`;
                         a.click();
                      });
                  }}
                  className="dash-back-btn"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                >
                  ⬇ Download PDF
                 </a>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "16px", flexWrap: "wrap" }}>
                {decision.category && (
                  <span className="decision-category-pill" style={{ background: "rgba(145, 152, 168, 0.15)", color: "var(--text-secondary)", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600" }}>
                    {decision.category}
                  </span>
                )}
                
                <span
                  className="decision-status-badge"
                  style={{
                    padding: "4px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "600",
                    textTransform: "capitalize",
                    background:
                      decision.status === "approved"
                        ? "rgba(45, 212, 167, 0.12)"
                        : decision.status === "rejected"
                        ? "rgba(240, 85, 90, 0.12)"
                        : decision.status === "under_review"
                        ? "rgba(245, 166, 35, 0.12)"
                        : "rgba(145, 152, 168, 0.12)",
                    color:
                      decision.status === "approved"
                        ? "var(--success)"
                        : decision.status === "rejected"
                        ? "var(--danger)"
                        : decision.status === "under_review"
                        ? "var(--warning)"
                        : "var(--text-secondary)",
                    border: `1px solid ${
                      decision.status === "approved"
                        ? "var(--success)"
                        : decision.status === "rejected"
                        ? "var(--danger)"
                        : decision.status === "under_review"
                        ? "var(--warning)"
                        : "var(--text-secondary)"
                    }`
                  }}
                >
                  {decision.status.replace("_", " ")}
                </span>
                
                <span className="decision-date" style={{ color: "var(--text-secondary)", fontSize: "13px" }}>
                  Created {new Date(decision.created_at).toLocaleString()} by <strong>{decision.created_by?.full_name || "Unknown"}</strong>
                </span>
              </div>
            </div>

            <div className="decision-problem-statement" style={{ borderTop: "none", marginTop: 0, paddingTop: 0 }}>
              <strong>Problem Statement:</strong>
              <p style={{ marginTop: "8px", color: "var(--text-primary)" }}>{decision.problem_statement}</p>
            </div>

            {decision.attachment_url && (
              <div style={{ marginTop: "12px", display: "flex", gap: "16px" }}>
                <a
                  href={`http://127.0.0.1:8000${decision.attachment_url}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#4FD1B5", fontSize: "13px", textDecoration: "none" }}
                >
                 📎 View file
                </a>

                <a
                  href="#"
                  onClick={(e) => {
                   e.preventDefault();
                   fetch(`http://127.0.0.1:8000${decision.attachment_url}?download=true`)
                      .then((res) => res.blob())
                      .then((blob) => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = decision.attachment_url.split("/").pop();
                        a.click();
                      });
                    }}
                    style={{ color: "#9AA5B5", fontSize: "13px", textDecoration: "none" }}
                >
                  ⬇ Download
                </a>
               </div>
             )}

            {(profile.role?.name === "manager" || profile.role?.name === "administrator") && (
              <div className="status-control-section">
                <span className="status-control-label">Update Status:</span>
                <select
                  className="status-select"
                  value={decision.status}
                  onChange={handleStatusChange}
                >
                  <option value="draft">Draft</option>
                  <option value="under_review">Under Review</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            )}
          </>
        )}
      </div>

      {/* Tab bar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          borderBottom: "1px solid var(--border, #2E3646)",
          marginTop: "20px",
          marginBottom: "20px",
        }}
      >
        {[
          { key: "alternatives", label: "Alternatives" },
          { key: "discussion", label: "Discussion" },
          { key: "attachments", label: "Attachments" },
          { key: "history", label: "Version History" },
          { key: "approvals", label: "Approval History" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.key ? "2px solid #4FD1B5" : "2px solid transparent",
              color: activeTab === tab.key ? "#4FD1B5" : "var(--text-secondary, #9AA5B5)",
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: "14px",
              padding: "10px 16px",
              cursor: "pointer",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "alternatives" && (
        <AlternativesPanel token={token} decisionId={decision.id} decisionTitle={decision.title} />
      )}

      {activeTab === "attachments" && (
        <div className="dash-card">
          <p className="dash-card-label" style={{ marginBottom: 12 }}>Attachments</p>

          <FileUpload
            token={token}
            targetType="decision"
            targetId={decision.id}
            onUploadSuccess={fetchAttachments}
          />

          {attachmentsError && (
            <div className="dash-card-note" style={{ color: "#FF6B6B", marginTop: 12 }}>
              {attachmentsError}
            </div>
          )}

          {attachmentsLoading ? (
            <p className="dash-card-note" style={{ marginTop: 12 }}>Loading attachments...</p>
          ) : attachments.length === 0 ? (
            <p className="dash-card-note" style={{ marginTop: 12 }}>No attachments yet.</p>
          ) : (
            <table className="dash-table" style={{ marginTop: 12 }}>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Uploaded By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {attachments.map((att) => (
                  <tr key={att.id}>
                    <td>{att.file_name}</td>
                    <td>{att.file_type}</td>
                    <td>{(att.file_size / 1024).toFixed(1)} KB</td>
                    <td>{att.uploaded_by?.full_name || "Unknown"}</td>
                    <td>
                      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                        <button
                          className="dash-logout"
                          onClick={() => handleDownloadAttachment(att.id, att.file_name)}
                          style={{ padding: "6px 10px" }}
                          type="button"
                        >
                          ⬇ Download
                        </button>
                        <button
                          className="dash-logout"
                          onClick={() => handleDeleteAttachment(att.id)}
                          style={{ padding: "6px 10px", borderColor: "#FF6B6B", color: "#FF6B6B" }}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === "history" && (
        <VersionHistory
          token={token}
          decisionId={decision.id}
          onRestored={(updatedDecision) => {
            if (onStatusUpdated) {
              onStatusUpdated(updatedDecision);
            }
          }}
        />
      )}

      {activeTab === "approvals" && (
        <ApprovalHistory
          token={token}
          decisionId={decision.id}
          profile={profile}
        />
      )}

      {activeTab === "discussion" && (
        <div className="discussion-board">
          {isClosed ? (
            <div className="discussion-closed-notice">
              🔒 This decision has been {decision.status}. Comments and replies are closed.
            </div>
          ) : (
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
          )}

          {loading ? (
            <p className="dash-card-note">Loading discussion stream...</p>
          ) : error ? (
            <div className="auth-message error">{error}</div>
          ) : (
            <div className="discussion-stream">
              {filteredTopLevel.length === 0 ? (
                <p className="dash-card-note">
                  {newMessageType === "meeting_note"
                    ? "No meeting notes yet. Start the conversation!"
                    : "No comments yet. Start the conversation!"}
                </p>
              ) : (
                filteredTopLevel.map((msg) => renderMessageNode(msg))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default DecisionDetails;

