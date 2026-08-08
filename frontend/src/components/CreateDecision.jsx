import { useState, useRef } from "react";
import apiClient, { authHeaders } from "../api/client";
import Button from "./ui/Button";

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
      const response = await apiClient.post(
        "/api/v1/decisions",
        {
          title,
          problem_statement: problemStatement,
          category,
        },
        authHeaders(token)
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
            aria-label="Decision title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="auth-field">
          <textarea
            placeholder="Problem statement"
            aria-label="Problem statement"
            value={problemStatement}
            onChange={(e) => setProblemStatement(e.target.value)}
            rows={3}
            required
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
            aria-label="Category"
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
              aria-label="Custom category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              style={{ marginTop: "8px" }}
            />
          )}
        </div>
        <Button type="submit" variant="primary" style={{ width: "100%" }} disabled={isSubmitting}>
          {isSubmitting ? "Creating..." : "Create decision"}
        </Button>
      </form>
      {message && (
        <div className={`auth-message ${isError ? "error" : "success"}`} style={{ marginTop: "12px" }} role="status">
          {message}
        </div>
      )}
    </div>
  );
}

export default CreateDecision;
