import { X, FileText, MessageSquare, Zap, Mic, Paperclip, Send, PanelLeft, PictureInPicture2, History } from "lucide-react";
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
  const [chatLoading, setChatLoading] = useState(false);
  const [taskLoading, setTaskLoading] = useState(false);
  const [panelWidth, setPanelWidth] = useState(400);
  const isResizing = useRef(false);
  const [dockPosition, setDockPosition] = useState("right");
  const [isFloating, setIsFloating] = useState(false);
  const [floatPos, setFloatPos] = useState({ x: 100, y: 100 });
  const [floatSize, setFloatSize] = useState({ width: 380, height: 520 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });
  const isResizingFloat = useRef(false);
  const resizeStart = useRef({});
  const chatScrollRef = useRef(null);
  const taskScrollRef = useRef(null);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [historyItems, setHistoryItems] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const askSuggestions = [
    "Show pending decisions",
    "List rejected decisions",
    "What decisions were approved this week?"
  ];

  const taskSuggestions = [
    "Escalate decision 34",
    "Reassign reviewer for decision 34 to user 5",
    "Mark decision 34 as high priority"
  ];

  const startResize = (e) => {
    isResizing.current = true;
    document.body.style.cursor = "ew-resize";
  };

  const startDrag = (e) => {
    if (!isFloating) return;
    isDragging.current = true;
    dragOffset.current = { x: e.clientX - floatPos.x, y: e.clientY - floatPos.y };
  };

  const startFloatResize = (e, direction) => {
    e.stopPropagation();
    console.log("resize started, direction:", direction);
    isResizingFloat.current = direction;
    resizeStart.current = {
      mouseX: e.clientX, mouseY: e.clientY,
      x: floatPos.x, y: floatPos.y,
      width: floatSize.width, height: floatSize.height,
    };
  };

  const scrollToHistoryStart = (ref) => {
    if (ref.current) {
      ref.current.scrollTop = 0;
    }
  };
  const toggleHistoryDropdown = async () => {
    if (showHistoryDropdown) {
      setShowHistoryDropdown(false);
      return;
    }
    setHistoryLoading(true);
    setShowHistoryDropdown(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get(
         `http://127.0.0.1:8000/ai/history?tab_type=${activeTab === "ask" ? "ask" : "task"}`,
         { headers: { Authorization: `Bearer ${token}` } }
      );
      setHistoryItems(res.data);
    } catch (err) {
      setHistoryItems([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const revisitHistoryItem = (item) => {
    const revived = [
      { role: "user", text: item.question },
      { role: "ai", text: item.answer },
    ];
    if (activeTab === "ask") {
      setChatMessages((prev) => [...prev, ...revived]);
    } else {
      setTaskMessages((prev) => [...prev, ...revived]);
    }
    setShowHistoryDropdown(false);
  };

  const startVoiceInput = (setInputFn) => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice input isn't supported in this browser. Try Chrome.");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInputFn((prev) => prev + transcript);
    };
    recognition.onerror = () => {
      console.log("Voice input error");
    };
    recognition.start();
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (isResizing.current) {
        const newWidth = dockPosition === "right" ? window.innerWidth - e.clientX : e.clientX;
        if (newWidth > 320 && newWidth < 700) setPanelWidth(newWidth);
      }
      if (isDragging.current) {
        setFloatPos({ x: e.clientX - dragOffset.current.x, y: e.clientY - dragOffset.current.y });
      }
      if (isResizingFloat.current) {
        const dir = isResizingFloat.current;
        const dx = e.clientX - resizeStart.current.mouseX;
        const dy = e.clientY - resizeStart.current.mouseY;
        let { x, y, width, height } = resizeStart.current;

        if (dir.includes("r")) width = Math.max(320, width + dx);
        if (dir.includes("l")) { width = Math.max(320, width - dx); x = x + (resizeStart.current.width - width); }
        if (dir.includes("b")) height = Math.max(300, height + dy);
        if (dir.includes("t")) { height = Math.max(300, height - dy); y = y + (resizeStart.current.height - height); }

        setFloatSize({ width, height });
        setFloatPos({ x, y });
      }
    };
    const handleMouseUp = () => {
      isResizing.current = false;
      isDragging.current = false;
      isResizingFloat.current = false;
      document.body.style.cursor = "default";
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dockPosition, floatPos]);

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
    if (!chatInput.trim() || chatLoading) return;

    const question = chatInput;
    const fileToSend = attachedFile;

    setChatMessages((prev) => [
      ...prev,
      { role: "user", text: fileToSend ? `${question} 📎 ${fileToSend.name}` : question },
    ]);
    setChatInput("");
    setAttachedFile(null);
    setChatLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (fileToSend) {
        const formData = new FormData();
        formData.append("question", question);
        formData.append("file", fileToSend);

        const res = await axios.post("http://127.0.0.1:8000/ai/ask-with-file", formData, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
        });
        setChatMessages((prev) => [...prev, { role: "ai", text: res.data.answer || res.data.message }]);
        return;
      }

      if (decisionId) {
        const res = await axios.post(
          `http://127.0.0.1:8000/decisions/${decisionId}/ai-ask`,
          { question },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setChatMessages((prev) => [
          ...prev,
          { role: "ai", text: res.data.answer || res.data.message || "Here is what I found:" }
        ]);
      } else {
        const res = await axios.post(
          "http://127.0.0.1:8000/ai/ask",
          { question, history: chatHistory },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const { generated_sql, results, data, decisions } = res.data;
        const returnedRows = results || data || decisions || [];

        if (generated_sql) {
          setChatHistory((prev) => [...prev, { question, sql: generated_sql }]);
        }

        const resultText = returnedRows.length === 0
          ? "No matching decisions found."
          : `Found ${returnedRows.length} decision(s):`;

        setChatMessages((prev) => [
          ...prev,
          { role: "ai", text: resultText, data: returnedRows }
        ]);
      }
    } catch (err) {
      const isRateLimited = err.response?.status === 429;
      setChatMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: isRateLimited
            ? "I've hit my usage limit — please wait a minute and try again."
            : "Sorry, I couldn't answer that. Try rephrasing your prompt.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const sendTaskCommand = async () => {
    if (!taskInput.trim() || taskLoading) return;

    const command = taskInput;
    setTaskMessages((prev) => [...prev, { role: "user", text: command }]);
    setTaskInput("");
    setTaskLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://127.0.0.1:8000/ai/task",
        { command },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { action, decision_id, status } = res.data;
      const text =
        action === "escalate"
          ? `Escalated decision #${decision_id}.`
          : action === "reassign_reviewer"
          ? `Reassigned reviewer for decision #${decision_id}.`
          : "Done.";

      setTaskMessages((prev) => [...prev, { role: "ai", text }]);
    } catch (err) {
      const isRateLimited = err.response?.status === 429;
      const detail = err.response?.data?.detail;
      setTaskMessages((prev) => [
        ...prev,
        {
          role: "ai",
          text: isRateLimited
            ? "I've hit my usage limit for now — please wait a minute and try again."
            : detail || "Sorry, I couldn't run that command. Try rephrasing.",
        },
      ]);
    } finally {
      setTaskLoading(false);
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
      style={
        isFloating
          ? {
              position: "fixed",
              top: `${floatPos.y}px`,
              left: `${floatPos.x}px`,
              width: `${floatSize.width}px`,
              height: `${floatSize.height}px`,
              backgroundColor: "rgba(23, 26, 33, 0.92)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid #2A2E38",
              borderRadius: "12px",
              boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
              zIndex: 1001,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }
          : {
              position: "fixed",
              top: 0,
              [dockPosition]: 0,
              height: "100vh",
              width: `${panelWidth}px`,
              backgroundColor: "rgba(23, 26, 33, 0.85)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              [dockPosition === "right" ? "borderLeft" : "borderRight"]: "1px solid #2A2E38",
              boxShadow: "-4px 0 16px rgba(0,0,0,0.4)",
              zIndex: 1001,
              display: "flex",
              flexDirection: "column",
            }
      }
    >
      {!isFloating && (
        <div
          onMouseDown={startResize}
          style={{
            position: "absolute",
            top: 0,
            [dockPosition === "right" ? "left" : "right"]: 0,
            width: "5px",
            height: "100%",
            cursor: "ew-resize",
            zIndex: 10,
          }}
        />
      )}

      <div
        onMouseDown={startDrag}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 20px",
          borderBottom: "1px solid #2A2E38",
          cursor: isFloating ? "move" : "default",
        }}
      >
        <h3 style={{ color: "#fff", margin: 0 }}>Decision Copilot</h3>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={() => setIsFloating(!isFloating)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
            aria-label="Toggle floating window"
            title="Pop out"
          >
            <PictureInPicture2 color="#9CA3AF" size={18} />
          </button>
          {!isFloating && (
            <button
              onClick={() => setDockPosition(dockPosition === "right" ? "left" : "right")}
              style={{ background: "none", border: "none", cursor: "pointer" }}
              aria-label="Move panel to other side"
              title="Move to other side"
            >
              <PanelLeft color="#9CA3AF" size={18} />
            </button>
          )}
          <div style={{ position: "relative" }}>
            <button
              onClick={toggleHistoryDropdown}
              style={{ background: "none", border: "none", cursor: "pointer" }}
              aria-label="View past questions"
              title="History"
            >
              <History color="#9CA3AF" size={18} />
            </button>

            {showHistoryDropdown && (
              <div
                style={{
                  position: "absolute",
                  top: "28px",
                  right: 0,
                  width: "280px",
                  maxHeight: "320px",
                  overflowY: "auto",
                  backgroundColor: "#1E2229",
                  border: "1px solid #2A2E38",
                  borderRadius: "10px",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
                  zIndex: 20,
                  padding: "8px",
                }}
              >
                <p style={{ color: "#9CA3AF", fontSize: "11px", margin: "4px 8px 8px" }}>
                  Past questions ({activeTab === "ask" ? "Ask a Question" : "Task Command"})
                </p>
                {historyLoading && (
                  <p style={{ color: "#9CA3AF", fontSize: "12px", padding: "8px" }}>Loading...</p>
                )}
                {!historyLoading && historyItems.length === 0 && (
                  <p style={{ color: "#9CA3AF", fontSize: "12px", padding: "8px" }}>No past questions yet.</p>
                )}
                {!historyLoading && historyItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => revisitHistoryItem(item)}
                    style={{
                      padding: "8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      marginBottom: "4px",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#0F1115")}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                  >
                    <p style={{ color: "#fff", fontSize: "12px", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                       {item.question}
                    </p>
                    <p style={{ color: "#9CA3AF", fontSize: "10px", margin: "2px 0 0" }}>
                      {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer" }}
            aria-label="Close AI Assistant"
            title="Close"
          >
            <X color="#fff" size={20} />
          </button>
        </div>
      </div>

      {isFloating && (
        <>
          <div onMouseDown={(e) => startFloatResize(e, "tl")} style={{ position: "absolute", top: 0, left: 0, width: "14px", height: "14px", cursor: "nwse-resize", zIndex: 10 }} />
          <div onMouseDown={(e) => startFloatResize(e, "tr")} style={{ position: "absolute", top: 0, right: 0, width: "14px", height: "14px", cursor: "nesw-resize", zIndex: 10 }} />
          <div onMouseDown={(e) => startFloatResize(e, "bl")} style={{ position: "absolute", bottom: 0, left: 0, width: "14px", height: "14px", cursor: "nesw-resize", zIndex: 10 }} />
          <div onMouseDown={(e) => startFloatResize(e, "br")} style={{ position: "absolute", bottom: 0, right: 0, width: "14px", height: "14px", cursor: "nwse-resize", zIndex: 10 }} />
        </>
      )}

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
            <div ref={chatScrollRef} style={{ flex: 1, overflowY: "auto", marginBottom: "12px" }}>
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
                           {row.title ? (
                            <>
                             <p style={{ margin: 0, color: "#fff", fontWeight: "600" }}>{row.title}</p>
                             <p style={{ margin: "2px 0 0 0", color: "#9CA3AF" }}>
                               {row.status && `Status: ${row.status}`}
                               {row.category && ` • Category: ${row.category}`}
                             </p>
                            </>
                           ) : (
                             Object.entries(row).map(([key, value]) => (
                              <p key={key} style={{ margin: "2px 0", color: "#E5E7EB" }}>
                               <span style={{ color: "#4FD1B5" }}>{key}:</span> {String(value)}
                              </p>
                             ))
                           )}
                         </div>
                      ))}
                    </div>
                  )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "14px",
                      backgroundColor: "#1E2229",
                      color: "#9CA3AF",
                      fontSize: "13px",
                      fontStyle: "italic",
                    }}
                  >
                    AI is thinking...
                  </div>
                </div>
              )}
            </div>

            {chatMessages.length === 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                {askSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setChatInput(suggestion)}
                    style={{
                      backgroundColor: "#1E2229",
                      color: "#4FD1B5",
                      border: "1px solid #2A2E38",
                      borderRadius: "12px",
                      padding: "8px 14px",
                      fontSize: "13px",
                      cursor: "pointer"
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}

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
                <Paperclip size={18} color="#9CA3AF" />
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
                <Mic size={18} />
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
                <Send size={16} color="#0F1115" />
              </button>
            </div>
          </div>
        )}

        {activeTab === "task" && (
          <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
            <div ref={taskScrollRef} style={{ flex: 1, overflowY: "auto", marginBottom: "12px" }}>
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
              {taskLoading && (
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "10px" }}>
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "14px",
                      backgroundColor: "#1E2229",
                      color: "#9CA3AF",
                      fontSize: "13px",
                      fontStyle: "italic",
                    }}
                  >
                    Processing command...
                  </div>
                </div>
              )}
            </div>

            {taskMessages.length === 0 && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                {taskSuggestions.map((suggestion, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTaskInput(suggestion)}
                    style={{
                      backgroundColor: "#1E2229",
                      color: "#4FD1B5",
                      border: "1px solid #2A2E38",
                      borderRadius: "12px",
                      padding: "8px 14px",
                      fontSize: "13px",
                      cursor: "pointer"
                    }}
                  >
                    {suggestion}
                  </button>
                ))}
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
                <Mic size={18} />
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
                <Send size={16} color="#0F1115" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}