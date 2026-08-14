import { Sparkles } from "lucide-react";

export default function AIAssistantButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        width: "56px",
        height: "56px",
        borderRadius: "50%",
        backgroundColor: "#4FD1B5",
        border: "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        zIndex: 1000,
      }}
      aria-label="Open AI Assistant"
    >
      <Sparkles color="#0F1115" size={24} />
    </button>
  );
}