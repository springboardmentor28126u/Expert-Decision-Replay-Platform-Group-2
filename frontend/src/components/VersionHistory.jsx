import { useState, useEffect, useCallback } from "react";
import apiClient, { authHeaders } from "../api/client";
import { useConfirm } from "./ui/ConfirmContext";
import { useToast } from "./ui/ToastContext";
import Badge from "./ui/Badge";
import Button from "./ui/Button";

function VersionHistory({ token, decisionId, onRestored }) {
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(true);
  const confirm = useConfirm();
  const showToast = useToast();

  const fetchVersions = useCallback(async () => {
    try {
      const res = await apiClient.get(
        `/api/v1/decisions/${decisionId}/versions`,
        authHeaders(token)
      );
      setVersions(res.data);
    } catch (err) {
      console.log("Failed to load version history", err);
    } finally {
      setLoading(false);
    }
  }, [token, decisionId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const handleRestore = async (v) => {
    const ok = await confirm(
      `Are you sure you want to restore the decision to Version ${v.version_number}?`,
      { title: "Restore version", confirmLabel: "Restore" }
    );
    if (!ok) return;
    try {
      const res = await apiClient.put(
        `/api/v1/decisions/${decisionId}`,
        {
          title: v.title,
          problem_statement: v.problem_statement,
          category: v.category,
        },
        authHeaders(token)
      );
      showToast(`Decision successfully restored to Version ${v.version_number}!`, { tone: "success" });
      // Reload versions history list locally
      fetchVersions();
      // Notify parent component to update its props/state
      if (onRestored) {
        onRestored(res.data);
      }
    } catch (err) {
      console.error("Failed to restore version", err);
      showToast(err?.response?.data?.detail || "Failed to restore version.", { tone: "error" });
    }
  };

  if (loading) return <p className="dash-card-note">Loading version history...</p>;

  if (versions.length === 0) {
    return <p className="dash-card-note">No previous versions — this decision hasn't been edited yet.</p>;
  }

  // Sort versions by version_number descending (newest versions first)
  const sortedVersions = [...versions].sort((a, b) => b.version_number - a.version_number);

  return (
    <div className="version-list">
      {sortedVersions.map((v) => (
        <div key={v.id} className="version-card">
          <div className="version-card-header">
            <span className="version-card-number">Version {v.version_number}</span>
            <span className="version-card-date">{new Date(v.created_at).toLocaleString()}</span>
          </div>
          <p className="version-card-title">{v.title}</p>
          <p className="version-card-summary">{v.problem_statement}</p>

          <div className="version-card-footer">
            <Badge tone="accent">{v.status.replace("_", " ")}</Badge>
            <Button variant="primary" size="sm" onClick={() => handleRestore(v)}>
              Restore to this version
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

export default VersionHistory;