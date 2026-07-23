import { useState } from "react";
import axios from "axios";
import FileUpload from "./FileUpload";

function CreateDecision({ token, onCreated }) {
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
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
          <input
            type="text"
            placeholder="Category (e.g. Technical, HR, Finance)"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </div>
        <button type="submit" className="auth-button">Create decision</button>
        <div className="auth-field">
          <FileUpload onUploadSuccess={(url) => setAttachmentUrl(url)} />
          {attachmentUrl && (
             <p style={{ color: "#4FD1B5", fontSize: "12px", marginTop: "6px" }}>
                File attached ✓
             </p>
         )}
        </div>
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