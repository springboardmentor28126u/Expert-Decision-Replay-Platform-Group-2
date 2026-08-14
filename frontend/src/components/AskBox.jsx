import { useState } from "react";
import { Send } from "lucide-react";
import apiClient, { authHeaders } from "../api/client";
import Button from "./ui/Button";

const EXAMPLE_QUESTIONS = [
  "How many decisions are approved?",
  "Show me the category breakdown",
  "Who are the top decision creators?",
];

// Natural-language query box: sends free text to /api/v1/nl-query, which
// classifies it into a small whitelisted set of intents (Gemini-assisted,
// falling back to keyword matching) and answers from existing aggregate
// data — never executes arbitrary SQL.
function AskBox({ token }) {
  const [question, setQuestion] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await apiClient.post(
        "/api/v1/nl-query/",
        { question },
        authHeaders(token)
      );
      setResult(res.data);
    } catch (err) {
      console.error("NL query failed", err);
      setError(err?.response?.data?.detail || "Could not answer that question.");
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="view-section">
      <div className="view-section-header">
        <h2 className="view-section-title">Ask Your Data</h2>
        <p className="view-section-subtitle">Ask a question about decisions and approvals in plain English</p>
      </div>

      <div className="dash-card">
        <form onSubmit={handleAsk} style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder='e.g. "How many decisions are approved?"'
            style={{ flex: "1 1 280px" }}
          />
          <Button type="submit" variant="primary" disabled={loading}>
            <Send size={14} strokeWidth={2} aria-hidden="true" />
            {loading ? "Asking..." : "Ask"}
          </Button>
        </form>

        <div className="dash-card-note" style={{ marginTop: 10 }}>
          Try:{" "}
          {EXAMPLE_QUESTIONS.map((q, i) => (
            <span key={q}>
              <button
                type="button"
                className="message-action-btn"
                style={{ display: "inline", padding: 0 }}
                onClick={() => setQuestion(q)}
              >
                {q}
              </button>
              {i < EXAMPLE_QUESTIONS.length - 1 && " · "}
            </span>
          ))}
        </div>

        {error && (
          <div className="auth-message error" style={{ marginTop: 12 }}>
            {error}
          </div>
        )}

        {result && !error && (
          <div style={{ marginTop: 16 }}>
            <p style={{ color: "var(--text-primary)", lineHeight: 1.6 }}>{result.answer}</p>
            <div className="dash-card-note" style={{ marginTop: 8, fontStyle: "italic" }}>
              Interpreted by {result.interpreted_by === "gemini" ? "Gemini AI" : "keyword matching"} as: {result.intent.replace(/_/g, " ")}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

export default AskBox;
