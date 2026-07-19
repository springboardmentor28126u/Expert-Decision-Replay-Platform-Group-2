import { useState, useEffect } from "react";
import axios from "axios";

const API = "http://127.0.0.1:8000";

function Decisions({ token, onSelectDecision, onBack }) {
  const [decisions, setDecisions] = useState([]);
  const [title, setTitle] = useState("");
  const [problemStatement, setProblemStatement] = useState("");
  const [category, setCategory] = useState("");
  const [message, setMessage] = useState("");

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const loadDecisions = async () => {
    try {
      const res = await axios.get(`${API}/decisions/`, authHeader);
      setDecisions(res.data);
    } catch (err) {
      setMessage("Failed to load decisions");
    }
  };

  useEffect(() => {
    loadDecisions();
  }, []);

  const handleCreate = async () => {
    try {
      await axios.post(`${API}/decisions/`, {
        title,
        problem_statement: problemStatement,
        category,
      }, authHeader);
      setTitle("");
      setProblemStatement("");
      setCategory("");
      setMessage("Decision created");
      loadDecisions();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to create decision");
    }
  };

  return (
    <div className="page">
      <div className="card" style={{ maxWidth: 600 }}>
        <button className="logout-btn" style={{ width: "auto", padding: "6px 14px", marginBottom: 16 }} onClick={onBack}>
          ← Back
        </button>

        <div className="eyebrow">Decision Management</div>
        <h1 className="title">Decisions</h1>

        <div className="field">
          <label>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Adopt Remote Work Policy" />
        </div>
        <div className="field">
          <label>Problem Statement</label>
          <input value={problemStatement} onChange={(e) => setProblemStatement(e.target.value)} placeholder="What problem are we solving?" />
        </div>
        <div className="field">
          <label>Category</label>
          <input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. HR, Budget" />
        </div>
        <button className="submit-btn" onClick={handleCreate}>Create Decision</button>
        {message && <div className="message">{message}</div>}

        <div style={{ marginTop: 28 }}>
          {decisions.map((d) => (
            <div
              key={d.id}
              className="dashboard-row"
              style={{ cursor: "pointer", flexDirection: "column", alignItems: "flex-start" }}
              onClick={() => onSelectDecision(d.id)}
            >
              <strong>{d.title}</strong>
              <span style={{ fontSize: 12, color: "#8A8578" }}>{d.category || "Uncategorized"} — {d.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Decisions;