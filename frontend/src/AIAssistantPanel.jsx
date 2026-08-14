import { X, FileText, MessageSquare, Zap } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";

export default function AIAssistantPanel({ isOpen, onClose, decisionId }) {
  const [activeTab, setActiveTab] = useState("summary");
  const [showWelcome, setShowWelcome] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [similarData, setSimilarData] = useState([]);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [taskMessages, setTaskMessages] = useState([]);
  const [taskInput, setTaskInput] = useState("");
  const [attachedFile, setAttachedFile] = useState(null);
  const fileInputRef = useRef(null);  

  useEffect(() => {
    if (isOpen) {
      const seen = localStorage.getItem("aiAssistantWelcomeSeen");
      if (!seen) {
        setShowWelcome(true);
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (activeTab === "summary" && decisionId) {
      setSummaryLoading(true);
      const token = localStorage.getItem("token");

      Promise.all([
        axios.get(`http://127.0.0.1:8000/decisions/${decisionId}/ai-summary`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`http://127.0.0.1:8000/decisions/${decisionId}/similar`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
        .then(([summaryRes, similarRes]) => {
          setSummaryData(summaryRes.data);
          setSimilarData(similarRes.data.similar_decisions || []);
        })
        .catch((err) => console.log("Failed to load AI summary", err))
        .finally(() => setSummaryLoading(false));
    }
  }, [activeTab, decisionId]);

  const dismissWelcome = () => {
    setShowWelcome(false);
    localStorage.setItem("aiAssistantWelcomeSeen", "true");
  };

  const sendChatQuestion = async () => {
  if (!chatInput.trim()) return;

  const question = chatInput;
  const fileToSend = attachedFile;
  setChatMessages((prev) => [
    ...prev,
    { role: "user", text: fileToSend ? `${question} 📎 ${fileToSend.name}` : question },
  ]);
  setChatInput("");
  setAttachedFile(null);

  try {
    const token = localStorage.getItem("token");

    if (fileToSend) {
      const formData = new FormData();
      formData.append("question", question);
      formData.append("file", fileToSend);

      const res = await axios.post("http://127.0.0.1:8000/ai/ask-with-file", formData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
      });
      setChatMessages((prev) => [...prev, { role: "ai", text: res.data.answer }]);
      return;
    }

    if (decisionId) {
      const res = await axios.post(
        `http://127.0.0.1:8000/decisions/${decisionId}/ai-ask`,
        { question },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setChatMessages((prev) => [...prev, { role: "ai", text: res.data.answer }]);
    } else {
      const res = await axios.post(
        "http://127.0.0.1:8000/ai/ask",
        { question, history: chatHistory },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { generated_sql, results } = res.data;
      setChatHistory((prev) => [...prev, { question, sql: generated_sql }]);
      const resultText = results.length === 0 ? "No results found." : `Found ${results.length} result(s).`;
      setChatMessages((prev) => [...prev, { role: "ai", text: resultText, data: results }]);
    }
  } catch (err) {
    const isRateLimited = err.response?.status === 429;
    setChatMessages((prev) => [
      ...prev,
      {
        role: "ai",
        text: isRateLimited
          ? "I've hit my usage limit for now — please wait a minute and try again."
          : "Sorry, I couldn't answer that. Try rephrasing.",
      },
    ]);
  }
};

  if (!isOpen) return null;

  const tabs = [
    { id: "summary", label: "Summary", icon: FileText },
    { id: "ask", label: "Ask a Question", icon: MessageSquare },
    { id: "task", label: "Task Command", icon: Zap },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        right: 0,
        height: "100vh",
        width: "400px",
        backgroundColor: "#171A21",
        borderLeft: "1px solid #2A2E38",
        boxShadow: "-4px 0 16px rgba(0,0,0,0.4)",
        zIndex: 1001,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px", borderBottom: "1px solid #2A2E38" }}>
        <h3 style={{ color: "#fff", margin: 0 }}>AI Assistant</h3>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer" }} aria-label="Close AI Assistant">
          <X color="#fff" size={20} />
        </button>
      </div>

      {showWelcome && (
        <div style={{ margin: "12px 20px", padding: "12px", backgroundColor: "#1E2229", borderRadius: "8px", border: "1px solid #4FD1B5" }}>
          <p style={{ color: "#fff", fontSize: "13px", margin: "0 0 8px 0" }}>
            👋 New here? This panel has 3 tools: view a decision's AI summary, ask questions about your data in plain English, and (for Managers/Admins) run quick actions like escalating a decision.
          </p>
          <button onClick={dismissWelcome} style={{ background: "#4FD1B5", border: "none", borderRadius: "4px", padding: "4px 12px", cursor: "pointer", fontSize: "12px" }}>
            Got it
          </button>
        </div>
      )}

      <div style={{ display: "flex", borderBottom: "1px solid #2A2E38" }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1,
                padding: "12px 8px",
                background: activeTab === tab.id ? "#1E2229" : "transparent",
                border: "none",
                borderBottom: activeTab === tab.id ? "2px solid #4FD1B5" : "2px solid transparent",
                color: activeTab === tab.id ? "#4FD1B5" : "#9CA3AF",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                fontSize: "11px",
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
        {activeTab === "summary" && (
          <div>
            {!decisionId && (
              <p style={{ color: "#9CA3AF" }}>Open a decision to see its AI summary here.</p>
            )}
            {decisionId && summaryLoading && (
              <p style={{ color: "#9CA3AF" }}>Loading summary...</p>
            )}
            {decisionId && !summaryLoading && summaryData && (
              <>
                <h4 style={{ color: "#fff", marginBottom: "8px" }}>{summaryData.title}</h4>
                <p style={{ color: "#9CA3AF", fontSize: "12px", marginBottom: "12px" }}>
                  Status: {summaryData.status} • Category: {summaryData.category} • By: {summaryData.created_by}
                </p>
                <p style={{ color: "#E5E7EB", fontSize: "14px", marginBottom: "20px" }}>{summaryData.summary}</p>

                {similarData.length > 0 && (
                  <>
                    <h4 style={{ color: "#fff", fontSize: "13px", marginBottom: "8px" }}>Similar Past Decisions</h4>
                    {similarData.map((d) => (
                      <div key={d.id} style={{ padding: "8px", backgroundColor: "#1E2229", borderRadius: "6px", marginBottom: "8px" }}>
                        <p style={{ color: "#fff", fontSize: "13px", margin: 0 }}>{d.title}</p>
                        <p style={{ color: "#9CA3AF", fontSize: "11px", margin: 0 }}>{d.status} • {d.category}</p>
                      </div>
                    ))}
                  </>
                )}
              </>
            )}
          </div>
        )}
        {activeTab === "ask" && (
  <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
    <div style={{ flex: 1, overflowY: "auto", marginBottom: "12px" }}>
      {chatMessages.length === 0 && (
        <p style={{ color: "#9CA3AF", fontSize: "13px" }}>
          Ask something like "show me all rejected decisions" or "which decisions are pending approval".
        </p>
      )}
      {chatMessages.map((msg, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
            marginBottom: "10px",
          }}
        >
          <div
            style={{
              maxWidth: "90%",
              padding: "10px 14px",
              borderRadius: "14px",
              backgroundColor: msg.role === "user" ? "#4FD1B5" : "#1E2229",
              color: msg.role === "user" ? "#0F1115" : "#E5E7EB",
              fontSize: "13px",
            }}
          >
            <p style={{ margin: 0 }}>{msg.text}</p>
            {msg.data && msg.data.length > 0 && (
              <div style={{ marginTop: "8px" }}>
                {msg.data.map((row, idx) => (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: "#0F1115",
                      borderRadius: "6px",
                      padding: "8px 10px",
                      marginTop: "6px",
                      fontSize: "12px",
                    }}
                  >
                    <p style={{ margin: 0, color: "#fff", fontWeight: "600" }}>
                      {row.title || `#${row.id}`}
                    </p>
                    <p style={{ margin: "2px 0 0 0", color: "#9CA3AF" }}>
                      {row.status && `Status: ${row.status}`}
                      {row.category && ` • Category: ${row.category}`}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>

    {attachedFile && (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#1E2229",
          borderRadius: "8px",
          padding: "6px 10px",
          marginBottom: "6px",
          fontSize: "12px",
          color: "#9CA3AF",
        }}
      >
        <span>📎 {attachedFile.name}</span>
        <button
          onClick={() => setAttachedFile(null)}
          style={{ background: "none", border: "none", color: "#F0555A", cursor: "pointer" }}
        >
          ✕
        </button>
      </div>
    )}

    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        backgroundColor: "#1E2229",
        borderRadius: "24px",
        padding: "8px 12px",
        border: "1px solid #2A2E38",
      }}
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept=".txt,.pdf,.jpg,.jpeg,.png"
        onChange={(e) => {
          if (e.target.files[0]) setAttachedFile(e.target.files[0]);
        }}
      />
      <button
        onClick={() => fileInputRef.current.click()}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}
        aria-label="Attach file"
      >
        📎
      </button>

      <input
        type="text"
        value={chatInput}
        onChange={(e) => setChatInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") sendChatQuestion();
        }}
        placeholder="Ask a question..."
        style={{
          flex: 1,
          background: "none",
          border: "none",
          outline: "none",
          color: "#fff",
          fontSize: "13px",
        }}
      />

      <button
        onClick={() => startVoiceInput(setChatInput)}
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#4FD1B5",
        }}
        aria-label="Voice input"
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" fill="currentColor"/>
          <path d="M19 10V11C19 14.53 16.39 17.44 13 17.93V21H11V17.93C7.61 17.44 5 14.53 5 11V10H7V11C7 13.76 9.24 16 12 16C14.76 16 17 13.76 17 11V10H19Z" fill="currentColor"/>
        </svg>
      </button>

      <button
        onClick={sendChatQuestion}
        style={{
          background: "#4FD1B5",
          border: "none",
          borderRadius: "50%",
          width: "32px",
          height: "32px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        aria-label="Send question"
      >
        ➤
      </button>
    </div>
  </div>
)}
       {activeTab === "task" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div style={{ flex: 1, overflowY: "auto", marginBottom: "12px" }}>
              {taskMessages.length === 0 && (
                <p style={{ color: "#9CA3AF", fontSize: "13px" }}>
                  Try something like "escalate decision 34" or "reassign reviewer for decision 34 to user 5".
                </p>
              )}
              {taskMessages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      maxWidth: "85%",
                      padding: "10px 14px",
                      borderRadius: "14px",
                      backgroundColor: msg.role === "user" ? "#4FD1B5" : "#1E2229",
                      color: msg.role === "user" ? "#0F1115" : "#E5E7EB",
                      fontSize: "13px",
                    }}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                backgroundColor: "#1E2229",
                borderRadius: "24px",
                padding: "8px 12px",
                border: "1px solid #2A2E38",
              }}
            >
              <input
                type="text"
                value={taskInput}
                onChange={(e) => setTaskInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendTaskCommand();
                }}
                placeholder="Type a command..."
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: "#fff",
                  fontSize: "13px",
                }}
              />
              <button
                onClick={() => startVoiceInput(setTaskInput)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "4px",
                  color: "#4FD1B5",
                }}
                aria-label="Voice input"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 14C13.66 14 15 12.66 15 11V5C15 3.34 13.66 2 12 2C10.34 2 9 3.34 9 5V11C9 12.66 10.34 14 12 14Z" fill="currentColor"/>
                  <path d="M19 10V11C19 14.53 16.39 17.44 13 17.93V21H11V17.93C7.61 17.44 5 14.53 5 11V10H7V11C7 13.76 9.24 16 12 16C14.76 16 17 13.76 17 11V10H19Z" fill="currentColor"/>
                </svg>
              </button>
              <button
                onClick={sendTaskCommand}
                style={{
                  background: "#4FD1B5",
                  border: "none",
                  borderRadius: "50%",
                  width: "32px",
                  height: "32px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                aria-label="Send command"
              >
                ➤
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}