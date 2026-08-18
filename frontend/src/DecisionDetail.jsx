import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

function DecisionDetail({ token, decisionId, onBack }) {
  const [decision, setDecision] = useState(null);
  const [alternatives, setAlternatives] = useState([]);
  const [comments, setComments] = useState([]);
  const [documents, setDocuments] = useState([]);

  const [altTitle, setAltTitle] = useState("");
  const [altPros, setAltPros] = useState("");
  const [altCons, setAltCons] = useState("");
  const [altCost, setAltCost] = useState("");

  const [commentText, setCommentText] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const loadAll = async () => {
    try {
      const [decRes, altRes, comRes, docRes] = await Promise.all([
        axios.get(`${API}/decisions/${decisionId}`, authHeader),
        axios.get(`${API}/decisions/${decisionId}/alternatives/`, authHeader),
        axios.get(`${API}/decisions/${decisionId}/comments/`, authHeader),
        axios.get(`${API}/decisions/${decisionId}/documents`, authHeader),
      ]);
      setDecision(decRes.data);
      setAlternatives(altRes.data);
      setComments(comRes.data);
      setDocuments(docRes.data);
    } catch (err) {
      setMessage("Failed to load decision details");
    }
  };

  useEffect(() => {
    loadAll();
  }, [decisionId]);

  const handleStatusChange = async (newStatus) => {
    try {
      await axios.put(`${API}/decisions/${decisionId}`, { status: newStatus }, authHeader);
      loadAll();
    } catch (err) {
      setMessage("Failed to update status");
    }
  };

  const handleAddAlternative = async () => {
    try {
      await axios.post(`${API}/decisions/${decisionId}/alternatives/`, {
        title: altTitle,
        pros: altPros,
        cons: altCons,
        estimated_cost: altCost ? parseFloat(altCost) : null,
      }, authHeader);
      setAltTitle(""); setAltPros(""); setAltCons(""); setAltCost("");
      loadAll();
    } catch (err) {
      setMessage("Failed to add alternative");
    }
  };

  const handleAddComment = async () => {
    try {
      await axios.post(`${API}/decisions/${decisionId}/comments/`, { content: commentText }, authHeader);
      setCommentText("");
      loadAll();
    } catch (err) {
      setMessage("Failed to add comment");
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      await axios.post(`${API}/decisions/${decisionId}/documents`, formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setFile(null);
      loadAll();
    } catch (err) {
      setMessage("Failed to upload document");
    }
  };

  if (!decision) return <div className="page"><div className="card">Loading...</div></div>;

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 650 }}>
        <button className="logout-btn" style={{ width: "auto", padding: "6px 14px", marginBottom: 16 }} onClick={onBack}>
          ← Back to Decisions
        </button>

        <div className="eyebrow">{decision.category || "Uncategorized"}</div>
        <h1 className="title">{decision.title}</h1>
        <p style={{ color: "#5B6472", fontSize: 14 }}>{decision.problem_statement}</p>

        <div className="field">
          <label>Status</label>
          <select value={decision.status} onChange={(e) => handleStatusChange(e.target.value)}>
            <option value="draft">Draft</option>
            <option value="under_review">Under Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="archived">Archived</option>
          </select>
        </div>

        <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #E4E0D8" }} />

        <h3 style={{ fontFamily: "Source Serif 4, serif" }}>Alternatives</h3>
        {alternatives.map((a) => (
          <div key={a.id} className="dashboard-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
            <strong>{a.title}</strong>
            <span style={{ fontSize: 12 }}>Pros: {a.pros || "—"}</span>
            <span style={{ fontSize: 12 }}>Cons: {a.cons || "—"}</span>
            {a.estimated_cost && <span style={{ fontSize: 12 }}>Cost: ${a.estimated_cost}</span>}
          </div>
        ))}
        <div className="field" style={{ marginTop: 12 }}>
          <input placeholder="Alternative title" value={altTitle} onChange={(e) => setAltTitle(e.target.value)} style={{ marginBottom: 6 }} />
          <input placeholder="Pros" value={altPros} onChange={(e) => setAltPros(e.target.value)} style={{ marginBottom: 6 }} />
          <input placeholder="Cons" value={altCons} onChange={(e) => setAltCons(e.target.value)} style={{ marginBottom: 6 }} />
          <input placeholder="Estimated cost" value={altCost} onChange={(e) => setAltCost(e.target.value)} />
        </div>
        <button className="submit-btn" onClick={handleAddAlternative}>Add Alternative</button>

        <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #E4E0D8" }} />

        <h3 style={{ fontFamily: "Source Serif 4, serif" }}>Documents</h3>
        {documents.map((d) => (
          <div key={d.id} className="dashboard-row">
            <span>{d.filename}</span>
          </div>
        ))}
        <div className="field" style={{ marginTop: 12 }}>
          <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        <button className="submit-btn" onClick={handleUpload}>Upload Document</button>

        <hr style={{ margin: "24px 0", border: "none", borderTop: "1px solid #E4E0D8" }} />

        <h3 style={{ fontFamily: "Source Serif 4, serif" }}>Discussion</h3>
        {comments.map((c) => (
          <div key={c.id} className="dashboard-row" style={{ flexDirection: "column", alignItems: "flex-start" }}>
            <span>{c.content}</span>
          </div>
        ))}
        <div className="field" style={{ marginTop: 12 }}>
          <input placeholder="Write a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
        </div>
        <button className="submit-btn" onClick={handleAddComment}>Post Comment</button>

        {message && <div className="message">{message}</div>}
      </div>
    </div>
  );
}

export default DecisionDetail;
