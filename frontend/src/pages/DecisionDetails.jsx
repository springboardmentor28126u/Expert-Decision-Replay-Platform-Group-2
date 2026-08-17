import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowLeft, Pencil, Download, Paperclip, MessageSquare, Trash2, Lock, ClipboardList, Sparkles } from "lucide-react";
import apiClient, { authHeaders, API_BASE_URL } from "../api/client";
import VersionHistory from "../components/VersionHistory";
import AlternativesPanel from "../components/AlternativesPanel";
import "../styles/discussion.css";
import "../styles/dashboard.css";
import FileUpload from "../components/FileUpload";
import ApprovalHistory from "../components/ApprovalHistory";
import { useConfirm } from "../components/ui/ConfirmContext";
import { useToast } from "../components/ui/ToastContext";
import Badge from "../components/ui/Badge";
import Button from "../components/ui/Button";

const STATUS_TONE = {
  approved: "success",
  rejected: "danger",
  under_review: "warning",
};

function DecisionDetails({ decision, token, profile, onStatusUpdated, onBack }) {
  const confirm = useConfirm();
  const showToast = useToast();
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

  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState("");

  const [similar, setSimilar] = useState(null);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [similarError, setSimilarError] = useState("");

  const [askQuestion, setAskQuestion] = useState("");
  const [askResult, setAskResult] = useState(null);
  const [askLoading, setAskLoading] = useState(false);
  const [askError, setAskError] = useState("");

  const canSeeRecommendation = ["reviewer", "manager", "administrator"].includes(profile.role?.name);
  const [recommendation, setRecommendation] = useState(null);
  const [recommendationLoading, setRecommendationLoading] = useState(false);
  const [recommendationError, setRecommendationError] = useState("");

  const [generatingStatement, setGeneratingStatement] = useState(false);
  const [generateStatementError, setGenerateStatementError] = useState("");

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
      const res = await apiClient.get(
        `/api/v1/comments/decision/${decision.id}`,
        authHeaders(token)
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
      const res = await apiClient.get(
        `/api/v1/attachments/decision/${decision.id}`,
        authHeaders(token)
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

  // AI summary is generated on-demand (only when the tab is first
  // opened) rather than on every decision load — it's an LLM call and
  // shouldn't fire for every decision the user merely glances at.
  const fetchSummary = useCallback(async () => {
    if (!decision?.id) return;
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const res = await apiClient.get(
        `/api/v1/decisions/${decision.id}/summary`,
        authHeaders(token)
      );
      setSummary(res.data);
    } catch (err) {
      console.error("Failed to load summary", err);
      setSummaryError(err?.response?.data?.detail || "Could not generate summary.");
    } finally {
      setSummaryLoading(false);
    }
  }, [decision?.id, token]);

  useEffect(() => {
    if (activeTab === "summary" && !summary && !summaryLoading) {
      fetchSummary();
    }
  }, [activeTab, summary, summaryLoading, fetchSummary]);

  // Same on-demand pattern as fetchSummary — a second, independent
  // LLM-backed lookup, fetched only once the tab is opened.
  const fetchSimilar = useCallback(async () => {
    if (!decision?.id) return;
    setSimilarLoading(true);
    setSimilarError("");
    try {
      const res = await apiClient.get(
        `/api/v1/decisions/${decision.id}/similar`,
        authHeaders(token)
      );
      setSimilar(res.data);
    } catch (err) {
      console.error("Failed to load similar decisions", err);
      setSimilarError(err?.response?.data?.detail || "Could not load similar decisions.");
    } finally {
      setSimilarLoading(false);
    }
  }, [decision?.id, token]);

  useEffect(() => {
    if (activeTab === "summary" && !similar && !similarLoading) {
      fetchSimilar();
    }
  }, [activeTab, similar, similarLoading, fetchSimilar]);

  // Read-only AI recommendation for reviewers/managers/admins — same
  // on-demand pattern as summary/similar (LLM call, fetched only once
  // the tab is opened, not on every decision load).
  const fetchRecommendation = useCallback(async () => {
    if (!decision?.id) return;
    setRecommendationLoading(true);
    setRecommendationError("");
    try {
      const res = await apiClient.get(
        `/api/v1/decisions/${decision.id}/ai-recommendation`,
        authHeaders(token)
      );
      setRecommendation(res.data);
    } catch (err) {
      console.error("Failed to load AI recommendation", err);
      setRecommendationError(err?.response?.data?.detail || "Could not generate a recommendation.");
    } finally {
      setRecommendationLoading(false);
    }
  }, [decision?.id, token]);

  useEffect(() => {
    if (activeTab === "recommendation" && canSeeRecommendation && !recommendation && !recommendationLoading) {
      fetchRecommendation();
    }
  }, [activeTab, canSeeRecommendation, recommendation, recommendationLoading, fetchRecommendation]);

  // Draft assistance only — fills the edit textarea with a suggestion
  // the user can still edit or discard; never saves the decision.
  const handleGenerateProblemStatement = async () => {
    if (!editTitle.trim()) {
      setGenerateStatementError("Enter a title first.");
      return;
    }
    setGeneratingStatement(true);
    setGenerateStatementError("");
    try {
      const res = await apiClient.post(
        "/api/v1/ai/generate-problem-statement",
        { title: editTitle },
        authHeaders(token)
      );
      setEditProblemStatement(res.data.problem_statement);
    } catch (err) {
      console.error("Failed to generate problem statement", err);
      setGenerateStatementError(err?.response?.data?.detail || "Could not generate a problem statement.");
    } finally {
      setGeneratingStatement(false);
    }
  };

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!askQuestion.trim()) return;

    setAskLoading(true);
    setAskError("");
    try {
      const res = await apiClient.post(
        `/api/v1/decisions/${decision.id}/ask`,
        { question: askQuestion },
        authHeaders(token)
      );
      setAskResult(res.data);
    } catch (err) {
      console.error("Failed to get an answer", err);
      setAskError(err?.response?.data?.detail || "Could not get an answer.");
      setAskResult(null);
    } finally {
      setAskLoading(false);
    }
  };

  // Downloads stream through the API with an auth header, so a plain
  // <a href> won't work — fetch the bytes and trigger a client-side save.
  const handleDownloadAttachment = async (attachmentId, fileName) => {
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/attachments/${attachmentId}/download`,
        authHeaders(token)
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
      showToast("Failed to download attachment.", { tone: "error" });
    }
  };

  const handleDeleteAttachment = async (attachmentId) => {
    const ok = await confirm("Delete this attachment?", {
      title: "Delete attachment",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiClient.delete(
        `/api/v1/attachments/${attachmentId}`,
        authHeaders(token)
      );
      fetchAttachments();
    } catch (err) {
      console.error("Failed to delete attachment", err);
      showToast(err?.response?.data?.detail || "Failed to delete attachment.", { tone: "error" });
    }
  };

  // Handle decision status update (manager/admin only)
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    try {
      const res = await apiClient.patch(
        `/api/v1/decisions/${decision.id}/status`,
        { status: newStatus },
        authHeaders(token)
      );
      if (onStatusUpdated) {
        onStatusUpdated(res.data);
      }
    } catch (err) {
      console.error("Failed to update status", err);
      showToast(err?.response?.data?.detail || "Failed to update status.", { tone: "error" });
    }
  };

  // Delete message handler
  const handleDelete = async (msgId) => {
    const ok = await confirm("Are you sure you want to delete this message?", {
      title: "Delete message",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;
    try {
      await apiClient.delete(`/api/v1/comments/${msgId}`, authHeaders(token));
      fetchThread();
    } catch (err) {
      console.error("Failed to delete comment", err);
      showToast(err?.response?.data?.detail || "Failed to delete comment.", { tone: "error" });
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
      await apiClient.post(
        `/api/v1/comments/decision/${decision.id}`,
        {
          content: newMessageText,
          is_meeting_note: newMessageType === "meeting_note",
        },
        authHeaders(token)
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
      showToast("Please enter a message.", { tone: "error" });
      return;
    }

    try {
      await apiClient.post(
        `/api/v1/comments/decision/${decision.id}`,
        {
          content: replyText,
          parent_comment_id: parentId,
          is_meeting_note: false,
        },
        authHeaders(token)
      );

      setReplyText("");
      setReplyToId(null);
      fetchThread();
    } catch (err) {
      console.error("Error posting reply", err);
      showToast(err?.response?.data?.detail || "Failed to post reply.", { tone: "error" });
    }
  };

  // Save inline edit
  const handleSaveEdit = async (e, msgId) => {
    e.preventDefault();
    if (!editText.trim()) {
      showToast("Message cannot be empty.", { tone: "error" });
      return;
    }

    try {
      await apiClient.put(
        `/api/v1/comments/${msgId}`,
        { content: editText },
        authHeaders(token)
      );

      setEditingId(null);
      setEditText("");
      fetchThread();
    } catch (err) {
      console.error("Error editing message", err);
      showToast(err?.response?.data?.detail || "Failed to edit comment.", { tone: "error" });
    }
  };

  const handleSaveDecisionEdit = async () => {
    if (savingRef.current) return;
    savingRef.current = true;
    setIsSaving(true);
    setEditError("");
    try {
      const res = await apiClient.put(
        `/api/v1/decisions/${decision.id}`,
        {
          title: editTitle,
          problem_statement: editProblemStatement,
          category: editCategory,
        },
        authHeaders(token)
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
                <Button type="submit" variant="primary" size="sm">Save Changes</Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setEditingId(null);
                    setEditText("");
                  }}
                >
                  Cancel
                </Button>
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
                      <MessageSquare size={12} strokeWidth={2} aria-hidden="true" />
                      Reply
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
                      <Pencil size={12} strokeWidth={2} aria-hidden="true" />
                      Edit
                    </button>
                  )}
                  {canDelete && (
                    <button className="message-action-btn delete" onClick={() => handleDelete(msg.id)}>
                      <Trash2 size={12} strokeWidth={2} aria-hidden="true" />
                      Delete
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
                <Button type="submit" variant="primary" size="sm">Send Reply</Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setReplyToId(null);
                    setReplyText("");
                  }}
                >
                  Cancel
                </Button>
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
      <Button variant="secondary" size="sm" onClick={onBack}>
        <ArrowLeft size={14} strokeWidth={2} aria-hidden="true" />
        Back to Decisions
      </Button>
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
              <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "8px" }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleGenerateProblemStatement}
                  disabled={generatingStatement || !editTitle.trim()}
                  title={!editTitle.trim() ? "Enter a title first" : "Generate a draft problem statement with AI"}
                >
                  <Sparkles size={13} strokeWidth={2} aria-hidden="true" />
                  {generatingStatement ? "Generating..." : "Generate with AI"}
                </Button>
              </div>
              {generateStatementError && (
                <div className="auth-message error" style={{ marginBottom: "8px" }}>
                  {generateStatementError}
                </div>
              )}
              <textarea
                value={editProblemStatement}
                onChange={(e) => setEditProblemStatement(e.target.value)}
                rows={4}
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
              <Button variant="primary" onClick={handleSaveDecisionEdit} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(decision.title);
                  setEditProblemStatement(decision.problem_statement);
                  setEditCategory(decision.category || "");
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="decision-header-section">
              <div className="decision-title-row">
                <h1 className="decision-title-main" style={{ margin: 0, flex: "1 1 auto" }}>
                  {decision.title}
                </h1>

               <div className="decision-title-actions">
                 <Button variant="secondary" onClick={() => setIsEditing(true)}>
                   <Pencil size={14} strokeWidth={2} aria-hidden="true" />
                   Edit Decision
                 </Button>
                 <Button
                  as="a"
                  href={`${API_BASE_URL}/decisions/${decision.id}/export`}
                  onClick={(e) => {
                    e.preventDefault();
                    fetch(`${API_BASE_URL}/decisions/${decision.id}/export`, {
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
                  variant="secondary"
                  style={{ textDecoration: "none" }}
                >
                  <Download size={14} strokeWidth={2} aria-hidden="true" />
                  Download PDF
                 </Button>
                </div>
              </div>

              <div className="decision-meta-row">
                {decision.category && (
                  <span className="decision-category-pill">{decision.category}</span>
                )}

                <Badge tone={STATUS_TONE[decision.status] || "neutral"}>
                  {decision.status.replace("_", " ")}
                </Badge>

                <span className="decision-date">
                  Created {new Date(decision.created_at).toLocaleString()} by <strong>{decision.created_by?.full_name || "Unknown"}</strong>
                </span>
              </div>
            </div>

            <div className="decision-problem-statement" style={{ borderTop: "none", marginTop: 0, paddingTop: 0 }}>
              <strong>Problem Statement:</strong>
              <p style={{ marginTop: "8px", color: "var(--text-primary)" }}>{decision.problem_statement}</p>
            </div>

            {decision.attachment_url && (
              <div className="decision-attachment-row">
                <a
                  href={`${API_BASE_URL}${decision.attachment_url}`}
                  target="_blank"
                  rel="noreferrer"
                  className="decision-attachment-link"
                  style={{ color: "var(--accent)" }}
                >
                 <Paperclip size={13} strokeWidth={2} aria-hidden="true" /> View file
                </a>

                <a
                  href="#"
                  onClick={(e) => {
                   e.preventDefault();
                   fetch(`${API_BASE_URL}${decision.attachment_url}?download=true`)
                      .then((res) => res.blob())
                      .then((blob) => {
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = decision.attachment_url.split("/").pop();
                        a.click();
                      });
                    }}
                    className="decision-attachment-link"
                    style={{ color: "var(--text-secondary)" }}
                >
                  <Download size={13} strokeWidth={2} aria-hidden="true" /> Download
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
      <div className="underline-tabs" role="tablist" aria-label="Decision sections">
        {[
          { key: "summary", label: "AI Summary" },
          { key: "alternatives", label: "Alternatives" },
          { key: "discussion", label: "Discussion" },
          { key: "attachments", label: "Attachments" },
          { key: "history", label: "Version History" },
          { key: "approvals", label: "Approval History" },
          ...(canSeeRecommendation ? [{ key: "recommendation", label: "AI Recommendation" }] : []),
        ].map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeTab === tab.key}
            className={`underline-tab-btn ${activeTab === tab.key ? "active" : ""}`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === "summary" && (
        <div className="dash-card">
          <p className="dash-card-label" style={{ marginBottom: 12 }}>AI Summary</p>

          {summaryLoading ? (
            <p className="dash-card-note">Generating summary...</p>
          ) : summaryError ? (
            <div className="auth-message error">{summaryError}</div>
          ) : summary ? (
            <>
              <p style={{ color: "var(--text-primary)", lineHeight: 1.6 }}>{summary.summary}</p>

              <div className="dash-card-note" style={{ marginTop: 12 }}>
                {summary.total_alternatives} alternative(s) &middot; {summary.revision_count} revision(s) &middot; {summary.total_comments} comment(s)
                {summary.selected_alternative && <> &middot; Selected: {summary.selected_alternative}</>}
              </div>

              {summary.approval_progress.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <strong>Approval progress:</strong>
                  <ul style={{ marginTop: 6 }}>
                    {summary.approval_progress.map((p) => (
                      <li key={p.level}>
                        Level {p.level} &mdash; {p.reviewer_name}: {p.status}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="dash-card-note" style={{ marginTop: 12, fontStyle: "italic" }}>
                Generated by {summary.generated_by === "gemini" ? "Gemini AI" : "deterministic summarizer"}
              </div>

              <Button variant="secondary" size="sm" onClick={fetchSummary} style={{ marginTop: 12 }}>
                Regenerate
              </Button>
            </>
          ) : null}
        </div>
      )}

      {activeTab === "summary" && (
        <div className="dash-card" style={{ marginTop: 16 }}>
          <p className="dash-card-label" style={{ marginBottom: 12 }}>Similar Decisions</p>

          {similarLoading ? (
            <p className="dash-card-note">Looking for similar decisions...</p>
          ) : similarError ? (
            <div className="auth-message error">{similarError}</div>
          ) : similar && similar.length > 0 ? (
            <ul style={{ marginTop: 4, listStyle: "none", padding: 0 }}>
              {similar.map((s) => (
                <li
                  key={s.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--border-subtle, #2a2a2a)",
                  }}
                >
                  <span>{s.title}</span>
                  <Badge tone={STATUS_TONE[s.status] || "neutral"}>
                    {s.status.replace("_", " ")}
                  </Badge>
                </li>
              ))}
            </ul>
          ) : (
            <p className="dash-card-note">
              No similar decisions found in the same category yet.
            </p>
          )}
        </div>
      )}

      {activeTab === "summary" && (
        <div className="dash-card" style={{ marginTop: 16 }}>
          <p className="dash-card-label" style={{ marginBottom: 12 }}>Ask About This Decision</p>

          <form onSubmit={handleAsk} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <input
              type="text"
              value={askQuestion}
              onChange={(e) => setAskQuestion(e.target.value)}
              placeholder="e.g. Why was this escalated?"
              style={{ flex: "1 1 280px" }}
            />
            <Button type="submit" variant="primary" disabled={askLoading}>
              {askLoading ? "Asking..." : "Ask"}
            </Button>
          </form>

          {askError && (
            <div className="auth-message error" style={{ marginTop: 12 }}>
              {askError}
            </div>
          )}

          {askResult && !askError && (
            <div style={{ marginTop: 16 }}>
              <p style={{ color: "var(--text-primary)", lineHeight: 1.6 }}>{askResult.answer}</p>
              {askResult.generated_by === "unavailable" && (
                <div className="dash-card-note" style={{ marginTop: 8, fontStyle: "italic" }}>
                  AI is temporarily unavailable — this is a fallback message, not a generated answer.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === "recommendation" && canSeeRecommendation && (
        <div className="dash-card">
          <p className="dash-card-label" style={{ marginBottom: 4 }}>AI Recommendation</p>
          <p className="dash-card-note" style={{ marginBottom: 12 }}>
            This is an AI-generated suggestion for your review only. It does not
            approve or reject this decision — you still make the final call.
          </p>

          {recommendationLoading ? (
            <p className="dash-card-note">Analyzing this decision...</p>
          ) : recommendationError ? (
            <div className="auth-message error">{recommendationError}</div>
          ) : recommendation ? (
            <>
              <Badge
                tone={
                  recommendation.recommendation === "approve"
                    ? "success"
                    : recommendation.recommendation === "reject"
                    ? "danger"
                    : "warning"
                }
              >
                {recommendation.recommendation.replace("_", " ")}
              </Badge>

              <p style={{ marginTop: 12, color: "var(--text-primary)", lineHeight: 1.6, whiteSpace: "pre-line" }}>
                {recommendation.reasoning}
              </p>

              <div className="dash-card-note" style={{ marginTop: 12, fontStyle: "italic" }}>
                Generated by{" "}
                {recommendation.generated_by === "gemini"
                  ? "Gemini AI"
                  : recommendation.generated_by === "groq"
                  ? "Groq AI (Gemini fallback)"
                  : "deterministic fallback — AI was unavailable"}
              </div>

              <Button variant="secondary" size="sm" onClick={fetchRecommendation} style={{ marginTop: 12 }}>
                Regenerate
              </Button>
            </>
          ) : null}
        </div>
      )}

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
            <div className="dash-card-note" style={{ color: "var(--danger)", marginTop: 12 }}>
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
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => handleDownloadAttachment(att.id, att.file_name)}
                        >
                          <Download size={13} strokeWidth={2} aria-hidden="true" />
                          Download
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteAttachment(att.id)}
                        >
                          Delete
                        </Button>
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
              <Lock size={14} strokeWidth={2} aria-hidden="true" />
              This decision has been {decision.status}. Comments and replies are closed.
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
                    <MessageSquare size={13} strokeWidth={2} aria-hidden="true" />
                    Add Comment
                  </button>
                  <button
                    type="button"
                    className={`form-tab-btn ${newMessageType === "meeting_note" ? "active" : ""}`}
                    onClick={() => setNewMessageType("meeting_note")}
                  >
                    <ClipboardList size={13} strokeWidth={2} aria-hidden="true" />
                    Add Meeting Note
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
                  <Button type="submit" variant="primary" disabled={submitting}>
                    {submitting
                      ? "Posting..."
                      : newMessageType === "meeting_note"
                      ? "Post Meeting Note"
                      : "Post Comment"}
                  </Button>
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

