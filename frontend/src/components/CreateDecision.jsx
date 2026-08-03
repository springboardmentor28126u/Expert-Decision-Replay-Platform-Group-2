import { useState, useRef } from "react";
import axios from "axios";

function CreateDecision({ token, onCreated }) {
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [showCustomCategory, setShowCustomCategory] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/api/v1/decisions",
        {
          title,
          problem_statement: problemStatement,
          category,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Decision created successfully!");
      setIsError(false);
      setTitle("");
      setProblemStatement("");
      setCategory("");
      setShowCustomCategory(false);
      if (onCreated) onCreated(response.data);
    } catch (error) {
      console.error("Error creating decision:", error);
      setIsError(true);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="dash-card" style={{ marginBottom: "20px" }}>
      <p className="dash-card-label" style={{ marginBottom: "12px" }}>Create a new decision</p>
      <form onSubmit={handleSubmit}>
        <div className="auth-field">
          <input
            type="text"
            placeholder="Decision title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <textarea
            placeholder="Problem statement"
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            rows={3}
            required
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
            value={["Technical", "HR", "Finance", "Operations"].includes(category) ? category : (category ? "Other" : "")}
            onChange={(e) => {
              if (e.target.value === "Other") {
                setCategory("");
                setShowCustomCategory(true);
              } else {
                setCategory(e.target.value);
                setShowCustomCategory(false);
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
          {showCustomCategory && (
            <input
              type="text"
              placeholder="Type your custom category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ marginTop: "8px" }}
            />
          )}
        </div>
        <button type="submit" className="auth-button" disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create decision"}
        </button>
      </form>
      {message && (
        <div className={`auth-message ${isError ? "error" : "success"}`} style={{ marginTop: "12px" }}>
          {message}
        </div>
      )}
    </div>
  );
}

export default CreateDecision;