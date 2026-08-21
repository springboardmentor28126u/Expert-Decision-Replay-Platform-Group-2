import { useState } from "react";
import axios from "axios";
import { Paperclip, Trash2 } from "lucide-react";

function DecisionCard({
  decision,
  role,
  token,
  onSelectDecision,
  onStatusChanged,
  onDeleted,
}) {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState("");

  const canUpdateStatus = role === "manager" || role === "admin";
  const isAdmin = role === "admin";
  const allStatuses = ["draft", "under_review", "archived"];

  const statusStyle = (status) => {
    if (status === "approved") {
      return {
        bg: "var(--success-soft)",
        color: "var(--success)",
      };
    }

    if (status === "rejected") {
      return {
        bg: "var(--danger-soft)",
        color: "var(--danger)",
      };
    }

    if (status === "under_review") {
      return {
        bg: "var(--warning-soft)",
        color: "var(--warning)",
      };
    }

    return {
      bg: "var(--neutral-soft)",
      color: "var(--text-secondary)",
    };
  };

  const style = statusStyle(decision.status);

  const handleStatusChange = async (e) => {
    const nextStatus = e.target.value;

    setUpdating(true);
    setError("");

    try {
      await axios.put(
        `http://127.0.0.1:8000/decisions/${decision.id}/status`,
        { status: nextStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onStatusChanged(decision.id, nextStatus);
    } catch (err) {
      setError(
        err?.response?.data?.detail ||
          "Failed to update status."
      );
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this decision permanently?")) {
      return;
    }

    try {
      await axios.delete(
        `http://127.0.0.1:8000/decisions/${decision.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      onDeleted(decision.id);
    } catch (err) {
      alert(
        err?.response?.data?.detail ||
          "Failed to delete decision."
      );
    }
  };

  return (
    <div
      className="decision-card-item"
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "12px",
        padding: "18px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "205px",
        boxSizing: "border-box",
        transition:
          "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
      }}
    >
      {/* =====================================================
          CARD CONTENT
          ===================================================== */}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          flex: 1,
        }}
      >
        {/* Title + Status */}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "10px",
          }}
        >
          <button
            type="button"
            onClick={() => onSelectDecision(decision)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              margin: 0,
              color: "var(--accent)",
              fontWeight: 650,
              fontSize: "14px",
              cursor: "pointer",
              lineHeight: "1.35",
              textAlign: "left",
            }}
          >
            {decision.title}
          </button>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "7px",
              flexShrink: 0,
            }}
          >
            {/* Status */}

            <span
              style={{
                background: style.bg,
                color: style.color,
                padding: "4px 9px",
                borderRadius: "20px",
                fontSize: "10px",
                fontWeight: 700,
                textTransform: "capitalize",
                whiteSpace: "nowrap",
              }}
            >
              {decision.status.replace("_", " ")}
            </span>

            {/* Attachment icon */}

            {decision.attachment_url && (
              <span
                title="Has attachment"
                style={{
                  width: "25px",
                  height: "25px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  background: "var(--bg)",
                  border: "1px solid var(--border)",
                  borderRadius: "6px",
                }}
              >
                <Paperclip
                  size={13}
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
              </span>
            )}
          </div>
        </div>

        {/* Problem statement */}

        <p
          style={{
            color: "var(--text-secondary)",
            fontSize: "12px",
            margin: 0,
            lineHeight: "1.55",
          }}
        >
          {decision.problem_statement.length > 100
            ? decision.problem_statement.slice(0, 100) + "..."
            : decision.problem_statement}
        </p>
      </div>

      {/* =====================================================
          CARD FOOTER
          ===================================================== */}

      <div
        style={{
          marginTop: "16px",
          paddingTop: "13px",
          borderTop: "1px solid var(--border)",
        }}
      >
        {/* Metadata */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "5px",
            fontSize: "11px",
            color: "var(--text-muted)",
            marginBottom: "11px",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: "10px",
            }}
          >
            <span
              style={{
                fontWeight: 600,
                color: "var(--text-secondary)",
              }}
            >
              {decision.category || "Uncategorized"}
            </span>

            <span>
              By{" "}
              {decision.creator_name
                ? decision.creator_name.split(" ")[0]
                : "Unknown"}
            </span>
          </div>

          <span>
            {new Date(decision.created_at).toLocaleDateString(
              undefined,
              {
                dateStyle: "medium",
              }
            )}
          </span>
        </div>

        {/* Actions */}

        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "8px",
            alignItems: "center",
          }}
        >
          {canUpdateStatus && (
            <select
              value={decision.status}
              disabled={updating}
              onChange={handleStatusChange}
              style={{
                background: "var(--bg)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
                borderRadius: "7px",
                fontSize: "11px",
                padding: "6px 8px",
                cursor: "pointer",
                outline: "none",
              }}
            >
              {allStatuses.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          )}

          {isAdmin && (
            <button
              type="button"
              onClick={handleDelete}
              title="Delete decision"
              style={{
                width: "32px",
                height: "30px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "transparent",
                border: "1px solid var(--danger)",
                color: "var(--danger)",
                borderRadius: "7px",
                cursor: "pointer",
                transition:
                  "background 0.2s ease, color 0.2s ease",
              }}
            >
              <Trash2
                size={14}
                strokeWidth={1.8}
                aria-hidden="true"
              />
            </button>
          )}
        </div>
      </div>

      {/* Error */}

      {error && (
        <p
          style={{
            color: "var(--danger)",
            fontSize: "11px",
            margin: "7px 0 0",
          }}
        >
          {error}
        </p>
      )}
    </div>
  );
}

export default DecisionCard;