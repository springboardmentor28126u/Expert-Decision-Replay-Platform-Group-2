import { useState } from "react";
import { Sparkles } from "lucide-react";
import apiClient, { authHeaders } from "../api/client";
import Button from "./ui/Button";

const EXAMPLE_COMMANDS = [
  "Reassign decision <id> to reviewer <name>",
  "Escalate decision <id>",
];

// Two-phase by design, matching POST /api/v1/ai/task: the first call
// (confirm omitted) only interprets and validates the command — it
// never mutates anything. Only the second call, triggered by the user
// explicitly clicking Confirm and echoing back exactly what the
// preview returned, actually executes the reassignment/escalation.
function AITaskRouting({ token, onExecuted }) {
  const [command, setCommand] = useState("");
  const [interpreting, setInterpreting] = useState(false);
  const [interpretError, setInterpretError] = useState("");
  const [preview, setPreview] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [executeResult, setExecuteResult] = useState(null);
  const [executeError, setExecuteError] = useState("");

  const resetOutcome = () => {
    setPreview(null);
    setExecuteResult(null);
    setExecuteError("");
    setInterpretError("");
  };

  const handleInterpret = async (e) => {
    e.preventDefault();
    if (!command.trim()) return;

    resetOutcome();
    setInterpreting(true);
    try {
      const res = await apiClient.post(
        "/api/v1/ai/task",
        { command },
        authHeaders(token)
      );
      setPreview(res.data);
      if (!res.data.success) {
        setInterpretError(res.data.message);
      }
    } catch (err) {
      console.error("Task routing interpretation failed", err);
      setInterpretError(err?.response?.data?.detail || "Could not interpret that command.");
    } finally {
      setInterpreting(false);
    }
  };

  const handleConfirm = async () => {
    if (!preview) return;

    setExecuting(true);
    setExecuteError("");
    try {
      const res = await apiClient.post(
        "/api/v1/ai/task",
        {
          command,
          confirm: true,
          action: preview.action,
          decision_id: preview.decision_id,
          reviewer_id: preview.reviewer_id,
          generated_by: preview.generated_by,
        },
        authHeaders(token)
      );
      setExecuteResult(res.data);
      if (res.data.success) {
        setPreview(null);
        setCommand("");
        if (onExecuted) onExecuted();
      } else {
        setExecuteError(res.data.message);
      }
    } catch (err) {
      console.error("Task routing execution failed", err);
      setExecuteError(err?.response?.data?.detail || "Could not execute that action.");
    } finally {
      setExecuting(false);
    }
  };

  const handleCancel = () => {
    setPreview(null);
    setExecuteResult(null);
    setExecuteError("");
  };

  const showConfirmDialog = Boolean(preview && preview.success && !executeResult);

  return (
    <section className="view-section">
      <div className="view-section-header">
        <h2 className="view-section-title">AI Task Routing</h2>
        <p className="view-section-subtitle">
          Reassign a reviewer or escalate a decision using plain English. Nothing is
          changed until you review and confirm the AI's interpretation.
        </p>
      </div>

      <div className="dash-card">
        <form onSubmit={handleInterpret} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="text"
            value={command}
            onChange={(e) => {
              setCommand(e.target.value);
              resetOutcome();
            }}
            placeholder='e.g. "Reassign decision <id> to reviewer Sarah" or "Escalate decision <id>"'
            style={{ flex: "1 1 320px" }}
            disabled={showConfirmDialog}
          />
          <Button type="submit" variant="primary" disabled={interpreting || showConfirmDialog}>
            <Sparkles size={14} strokeWidth={2} aria-hidden="true" />
            {interpreting ? "Interpreting..." : "Interpret Command"}
          </Button>
        </form>

        <div className="dash-card-note" style={{ marginTop: 10 }}>
          Try: {EXAMPLE_COMMANDS.join(" · ")}
        </div>

        {interpretError && !showConfirmDialog && (
          <div className="auth-message error" style={{ marginTop: 12 }}>
            {interpretError}
          </div>
        )}

        {showConfirmDialog && (
          <div className="dash-card" style={{ marginTop: 16, border: "1px solid var(--accent)" }}>
            <p style={{ fontWeight: 600, marginBottom: 4 }}>AI interpreted this as:</p>
            <p style={{ color: "var(--text-primary)" }}>{preview.message}</p>

            {preview.reviewer_name && (
              <p className="dash-card-note" style={{ marginTop: 4 }}>
                Target reviewer: {preview.reviewer_name}
              </p>
            )}

            <div className="dash-card-note" style={{ marginTop: 8, fontStyle: "italic" }}>
              Interpreted by{" "}
              {preview.generated_by === "gemini"
                ? "Gemini AI"
                : preview.generated_by === "groq"
                ? "Groq AI (Gemini fallback)"
                : "AI"}
            </div>

            <p style={{ marginTop: 12, fontWeight: 600 }}>Execute this action?</p>

            <div className="form-actions-row">
              <Button type="button" variant="primary" onClick={handleConfirm} disabled={executing}>
                {executing ? "Executing..." : "Confirm"}
              </Button>
              <Button type="button" variant="secondary" onClick={handleCancel} disabled={executing}>
                Cancel
              </Button>
            </div>

            {executeError && (
              <div className="auth-message error" style={{ marginTop: 12 }}>
                {executeError}
              </div>
            )}
          </div>
        )}

        {executeResult && executeResult.success && (
          <div className="auth-message success" style={{ marginTop: 16 }}>
            {executeResult.message}
          </div>
        )}
      </div>
    </section>
  );
}

export default AITaskRouting;
