import { useCallback, useEffect, useState } from "react";
import { MessageSquarePlus, Send, Trash2 } from "lucide-react";
import apiClient, { authHeaders } from "../api/client";
import Button from "./ui/Button";

// Minimal persistence UI for POST/GET/DELETE /api/v1/ai/conversations
// and POST .../messages. Conversation history always comes from the
// backend (GET .../conversations/{id}) — this component never
// reconstructs history from local state alone, so switching
// conversations, reloading the page, or opening the app later all
// show the same real, server-owned history.
function AIConversationPanel({ token }) {
  const [conversations, setConversations] = useState([]);
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState("");

  const [activeConversation, setActiveConversation] = useState(null);
  const [conversationLoading, setConversationLoading] = useState(false);
  const [conversationError, setConversationError] = useState("");

  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");
  const [sendNotice, setSendNotice] = useState("");

  const fetchConversations = useCallback(async () => {
    setListLoading(true);
    setListError("");
    try {
      const res = await apiClient.get("/api/v1/ai/conversations", authHeaders(token));
      setConversations(res.data);
    } catch (err) {
      console.error("Failed to load AI conversations", err);
      setListError(err?.response?.data?.detail || "Could not load your conversations.");
    } finally {
      setListLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const openConversation = async (conversationId) => {
    setConversationLoading(true);
    setConversationError("");
    setSendError("");
    setSendNotice("");
    try {
      const res = await apiClient.get(`/api/v1/ai/conversations/${conversationId}`, authHeaders(token));
      setActiveConversation(res.data);
    } catch (err) {
      console.error("Failed to load conversation", err);
      setConversationError(err?.response?.data?.detail || "Could not load that conversation.");
      setActiveConversation(null);
    } finally {
      setConversationLoading(false);
    }
  };

  const handleNewConversation = async () => {
    setConversationError("");
    try {
      const res = await apiClient.post("/api/v1/ai/conversations", {}, authHeaders(token));
      setActiveConversation(res.data);
      setConversations((prev) => [res.data, ...prev]);
    } catch (err) {
      console.error("Failed to create conversation", err);
      setConversationError(err?.response?.data?.detail || "Could not start a new conversation.");
    }
  };

  const handleDeleteConversation = async (e, conversationId) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/api/v1/ai/conversations/${conversationId}`, authHeaders(token));
      setConversations((prev) => prev.filter((c) => c.id !== conversationId));
      if (activeConversation?.id === conversationId) {
        setActiveConversation(null);
      }
    } catch (err) {
      console.error("Failed to delete conversation", err);
      setListError(err?.response?.data?.detail || "Could not delete that conversation.");
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!draft.trim() || !activeConversation) return;

    setSending(true);
    setSendError("");
    setSendNotice("");
    try {
      const res = await apiClient.post(
        `/api/v1/ai/conversations/${activeConversation.id}/messages`,
        { content: draft },
        authHeaders(token)
      );
      const newMessages = [res.data.user_message];
      if (res.data.assistant_message) {
        newMessages.push(res.data.assistant_message);
      } else if (res.data.message) {
        setSendNotice(res.data.message);
      }
      setActiveConversation((prev) => ({
        ...prev,
        messages: [...prev.messages, ...newMessages],
      }));
      setDraft("");
      // Title may have just been auto-derived from the first message,
      // and ordering is most-recently-updated-first — refresh the list.
      fetchConversations();
    } catch (err) {
      console.error("Failed to send message", err);
      setSendError(err?.response?.data?.detail || "Could not send that message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <section className="view-section">
      <div className="view-section-header">
        <h2 className="view-section-title">AI Assistant</h2>
        <p className="view-section-subtitle">Your conversations are private and saved automatically.</p>
      </div>

      <div className="dash-card" style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 220px", minWidth: 200 }}>
          <Button variant="secondary" size="sm" onClick={handleNewConversation} style={{ marginBottom: 10 }}>
            <MessageSquarePlus size={13} strokeWidth={2} aria-hidden="true" />
            New Conversation
          </Button>

          {listLoading ? (
            <p className="dash-card-note">Loading conversations...</p>
          ) : listError ? (
            <div className="auth-message error">{listError}</div>
          ) : conversations.length === 0 ? (
            <p className="dash-card-note">No conversations yet — start one above.</p>
          ) : (
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {conversations.map((c) => (
                <li
                  key={c.id}
                  onClick={() => openConversation(c.id)}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "8px 6px",
                    borderRadius: 6,
                    cursor: "pointer",
                    marginBottom: 4,
                    background: activeConversation?.id === c.id ? "var(--surface-hover, rgba(255,255,255,0.06))" : "transparent",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {c.title || "New conversation"}
                  </span>
                  <button
                    type="button"
                    className="message-action-btn delete"
                    onClick={(e) => handleDeleteConversation(e, c.id)}
                    aria-label="Delete conversation"
                  >
                    <Trash2 size={12} strokeWidth={2} aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div style={{ flex: "2 1 320px", minWidth: 280, borderLeft: "1px solid var(--border-subtle, #2a2a2a)", paddingLeft: 20 }}>
          {conversationLoading ? (
            <p className="dash-card-note">Loading conversation...</p>
          ) : conversationError ? (
            <div className="auth-message error">{conversationError}</div>
          ) : !activeConversation ? (
            <p className="dash-card-note">Select a conversation, or start a new one.</p>
          ) : (
            <>
              <div style={{ maxHeight: 320, overflowY: "auto", marginBottom: 12 }}>
                {activeConversation.messages.length === 0 ? (
                  <p className="dash-card-note">Say something to get started.</p>
                ) : (
                  activeConversation.messages.map((m) => (
                    <div key={m.id} style={{ marginBottom: 12 }}>
                      <div style={{ fontWeight: 600, fontSize: 12, color: "var(--text-secondary)" }}>
                        {m.role === "user" ? "You" : "Assistant"}
                        {m.provider && (
                          <span className="dash-card-note" style={{ fontWeight: 400, marginLeft: 6 }}>
                            via {m.provider === "gemini" ? "Gemini" : "Groq"}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: "2px 0 0", color: "var(--text-primary)", lineHeight: 1.5, whiteSpace: "pre-wrap" }}>
                        {m.content}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {sendNotice && (
                <div className="dash-card-note" style={{ marginBottom: 8, fontStyle: "italic" }}>
                  {sendNotice}
                </div>
              )}
              {sendError && <div className="auth-message error" style={{ marginBottom: 8 }}>{sendError}</div>}

              <form onSubmit={handleSend} style={{ display: "flex", gap: 10 }}>
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Message the assistant..."
                  style={{ flex: "1 1 auto" }}
                  disabled={sending}
                />
                <Button type="submit" variant="primary" disabled={sending || !draft.trim()}>
                  <Send size={14} strokeWidth={2} aria-hidden="true" />
                  {sending ? "Sending..." : "Send"}
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default AIConversationPanel;
