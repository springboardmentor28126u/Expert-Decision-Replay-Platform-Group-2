import { useState, useRef } from "react";
import axios from "axios";
import FileUpload from "./FileUpload";

function CreateDecision({ token, onCreated }) {
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (submittingRef.current) return;
    submittingRef.current = true;
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        "http://127.0.0.1:8000/decisions",
        {
          title,
          problem_statement: problemStatement,
          category,
          attachment_url: attachmentUrl || null,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage("Decision created successfully!");
      setIsError(false);
      setTitle("");
      setProblemStatement("");
      setCategory("");
      setAttachmentUrl("");
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

  const [generatingStatement, setGeneratingStatement] = useState(false);

  const handleGenerateProblemStatement = async () => {
   if (!title.trim()) {
     alert("Enter a title first.");
     return;
   }
  setGeneratingStatement(true);
  try {
    const token = localStorage.getItem("token");
    const res = await axios.post(
      "http://127.0.0.1:8000/ai/generate-problem-statement",
      { title },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setProblemStatement(res.data.problem_statement);
  } catch (err) {
    alert("Couldn't generate a problem statement. Try writing it manually.");
  } finally {
    setGeneratingStatement(false);
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
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
    <span style={{ fontSize: "12px", color: "#9CA3AF" }}>
      Tip: type a title first, then click "Generate with AI" for a draft starting point.
    </span>
    <button
      type="button"
      onClick={handleGenerateProblemStatement}
      disabled={generatingStatement}
      style={{
        background: "none",
        border: "1px solid #4FD1B5",
        color: "#4FD1B5",
        borderRadius: "6px",
        padding: "4px 10px",
        fontSize: "12px",
        cursor: generatingStatement ? "default" : "pointer",
        whiteSpace: "nowrap",
        marginLeft: "8px",
      }}
    >
      {generatingStatement ? "Generating..." : "✨ Generate with AI"}
    </button>
  </div>
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
          <input
            type="text"
            placeholder="Category (e.g. Technical, HR, Finance)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <div className="auth-field">
          <FileUpload onUploadSuccess={(url) => setAttachmentUrl(url)} />
          {attachmentUrl && (
             <p style={{ color: "#4FD1B5", fontSize: "12px", marginTop: "6px" }}>
                File attached ✓
             </p>
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