import { useEffect, useMemo, useState } from "react";
import apiClient, { authHeaders } from "../api/client";
import { useConfirm } from "./ui/ConfirmContext";
import Button from "./ui/Button";

const FEASIBILITY_SCORE_MAP = { Low: 3, Medium: 6, High: 9 };

const feasibilityScoreToLabel = (score) => {
  if (score === null || score === undefined) return "—";
  if (score <= 4) return "Low";
  if (score <= 7) return "Medium";
  return "High";
};

function AlternativesPanel({ token, decisionId, decisionTitle, onUpdated }) {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [panelError, setPanelError] = useState("");
  const confirm = useConfirm();

  // Manage view (create/edit alternative)
  const [mode, setMode] = useState("create"); // create | edit
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    pros: "",
    cons: "",
    cost_estimate: "",
    risk_assessment: "Low",
    feasibility_score: "Low",
  });

  // Compare view (client-side only — built from the alternatives already fetched)
  const [isComparing, setIsComparing] = useState(false);

  const riskLevels = useMemo(() => ["Low", "Medium", "High"], []);
  const feasibilityLevels = useMemo(() => ["Low", "Medium", "High"], []);

  const fetchAlternatives = async () => {
    if (!decisionId) return;

    setPanelError("");
    setLoading(true);
    try {
      const res = await apiClient.get(
        `/api/v1/alternatives/decision/${decisionId}`,
        authHeaders(token)
      );
      setAlternatives(res.data);
    } catch (err) {
      setPanelError(
        err?.response?.data?.detail || "Failed to load alternatives."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlternatives();
    setPanelError("");

    // Reset UI whenever decision/token changes
    setIsComparing(false);

    setMode("create");
    setEditingId(null);
    setShowForm(false);
    setForm({
      title: "",
      description: "",
      pros: "",
      cons: "",
      cost_estimate: "",
      risk_assessment: "Low",
      feasibility_score: "Low",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [decisionId, token]);

  const resetForm = () => {
    setMode("create");
    setEditingId(null);
    setShowForm(false);
    setForm({
      title: "",
      description: "",
      pros: "",
      cons: "",
      cost_estimate: "",
      risk_assessment: "Low",
      feasibility_score: "Low",
    });
  };

  const startEdit = (alt) => {
    setMode("edit");
    setEditingId(alt.id);
    setForm({
      title: alt.title || "",
      description: alt.description || "",
      pros: alt.pros || "",
      cons: alt.cons || "",
      cost_estimate: alt.cost_estimate ?? "",
      risk_assessment: alt.risk_assessment || "Low",
      feasibility_score: feasibilityScoreToLabel(alt.feasibility_score) === "—"
        ? "Low"
        : feasibilityScoreToLabel(alt.feasibility_score),
    });
    setPanelError("");
    setShowForm(true);
  };

  const submit = async (e) => {
    e.preventDefault();
    setPanelError("");

    const payload = {
      title: form.title,
      description: form.description || null,
      pros: form.pros || null,
      cons: form.cons || null,
      cost_estimate: form.cost_estimate === "" ? null : Number(form.cost_estimate),
      risk_assessment: form.risk_assessment,
      feasibility_score: FEASIBILITY_SCORE_MAP[form.feasibility_score],
    };

    try {
      if (mode === "create") {
        await apiClient.post(
          `/api/v1/alternatives/decision/${decisionId}`,
          payload,
          authHeaders(token)
        );
      } else {
        await apiClient.put(
          `/api/v1/alternatives/${editingId}`,
          payload,
          authHeaders(token)
        );
      }

      await fetchAlternatives();
      resetForm();
      if (onUpdated) onUpdated();
    } catch (err) {
      setPanelError(
        err?.response?.data?.detail ||
          "Failed to submit alternative. Check your inputs/permissions."
      );
    }
  };

  const handleDelete = async (alternativeId) => {
    const ok = await confirm("Delete this alternative?", {
      title: "Delete alternative",
      confirmLabel: "Delete",
      danger: true,
    });
    if (!ok) return;

    // If the user deletes while comparing, go back to manage view to prevent stale UI.
    setIsComparing(false);

    setPanelError("");
    try {
      await apiClient.delete(
        `/api/v1/alternatives/${alternativeId}`,
        authHeaders(token)
      );
      await fetchAlternatives();
      if (onUpdated) onUpdated();

      if (mode === "edit" && editingId === alternativeId) resetForm();
    } catch (err) {
      setPanelError(
        err?.response?.data?.detail || "Failed to delete alternative."
      );
    }
  };

  const handleSelect = async (alternativeId) => {
    setPanelError("");
    try {
      await apiClient.patch(
        `/api/v1/alternatives/${alternativeId}/select`,
        {},
        authHeaders(token)
      );
      await fetchAlternatives();
      if (onUpdated) onUpdated();
    } catch (err) {
      setPanelError(
        err?.response?.data?.detail || "Failed to select alternative."
      );
    }
  };

  const onClickCompare = () => {
    setIsComparing(true);
  };

  const goBackToAlternatives = () => {
    setIsComparing(false);
    resetForm();
  };

  return (
    <div className="dash-card dash-alternatives-panel">
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <p className="dash-card-label" style={{ marginBottom: 8 }}>
          Alternatives
        </p>
      </div>

      {panelError && (
        <div
          className="dash-card-note"
          style={{ color: "var(--danger)", marginBottom: 12 }}
        >
          {panelError}
        </div>
      )}

      {/* COMPARISON MODE (only after clicking Compare) — rendered client-side
          from the alternatives already fetched; there is no backend /compare
          endpoint. */}
      {isComparing && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <Button variant="primary" style={{ flex: 1 }} onClick={goBackToAlternatives}>
              Go Back
            </Button>
          </div>

          {decisionTitle && (
            <div
              className="dash-card-note"
              style={{ marginBottom: 6, marginTop: 12 }}
            >
              Decision: <b>{decisionTitle}</b>
            </div>
          )}

          <div className="dash-card-note">
            {alternatives.length} alternative(s) available for comparison.
          </div>

          <div style={{ marginTop: 12 }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Risk</th>
                  <th>Feasibility</th>
                  <th>Cost</th>
                  <th>Description</th>
                  <th>Pros</th>
                  <th>Cons</th>
                  <th>Winner</th>
                </tr>
              </thead>
              <tbody>
                {alternatives.map((alt) => (
                  <tr key={alt.id ?? alt.title}>
                    <td>{alt.title}</td>
                    <td>{alt.risk_assessment ?? "—"}</td>
                    <td>{feasibilityScoreToLabel(alt.feasibility_score)}</td>
                    <td>{alt.cost_estimate ?? "—"}</td>
                    <td>{alt.description ?? "—"}</td>
                    <td>{alt.pros ?? "—"}</td>
                    <td>{alt.cons ?? "—"}</td>
                    <td>{alt.is_selected ? "★ Winner" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MANAGE VIEW */}
      {!isComparing && (
        <>
          {loading ? (
            <p className="dash-card-note">Loading alternatives...</p>
          ) : (
            <>
              {/* Buttons row: Compare (left) + Create Alternative (right), same size */}
              <div style={{ marginBottom: 12, display: "flex", gap: 12, alignItems: "center" }}>
                <Button
                  variant="primary"
                  style={{ flex: 1 }}
                  onClick={onClickCompare}
                  disabled={!decisionId || alternatives.length === 0}
                >
                  Compare
                </Button>

                <Button
                  variant="primary"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setMode("create");
                    setEditingId(null);
                    setShowForm(true);
                    setForm({
                      title: "",
                      description: "",
                      pros: "",
                      cons: "",
                      cost_estimate: "",
                      risk_assessment: "Low",
                      feasibility_score: "Low",
                    });
                  }}
                >
                  Create Alternative
                </Button>
              </div>

              {alternatives.length === 0 ? (
                <p className="dash-card-note">No alternatives yet.</p>
              ) : !showForm ? (
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Risk</th>
                      <th>Feasibility</th>
                      <th>Cost</th>
                      <th>Winner</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alternatives.map((alt) => (
                      <tr key={alt.id}>
                        <td>{alt.title}</td>
                        <td>{alt.risk_assessment}</td>
                        <td>{feasibilityScoreToLabel(alt.feasibility_score)}</td>
                        <td>{alt.cost_estimate ?? "—"}</td>
                        <td>{alt.is_selected ? "★ Winner" : "—"}</td>
                        <td>
                          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                            {!alt.is_selected && (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleSelect(alt.id)}
                                style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
                              >
                                Select as Winner
                              </Button>
                            )}
                            <Button variant="secondary" size="sm" onClick={() => startEdit(alt)}>
                              Edit
                            </Button>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(alt.id)}>
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : null}

              {/* Create/Edit form */}
              {showForm && (
                <form onSubmit={submit}>
                  <div className="auth-field">
                    <input
                      type="text"
                      placeholder="Alternative title"
                      aria-label="Alternative title"
                      value={form.title}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, title: e.target.value }))
                      }
                      required
                    />
                  </div>

                  <div className="auth-field">
                    <textarea
                      placeholder="Description"
                      aria-label="Description"
                      value={form.description}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, description: e.target.value }))
                      }
                      rows={2}
                    />
                  </div>

                  <div className="auth-field">
                    <input
                      type="text"
                      placeholder="Pros"
                      aria-label="Pros"
                      value={form.pros}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, pros: e.target.value }))
                      }
                    />
                  </div>

                  <div className="auth-field">
                    <input
                      type="text"
                      placeholder="Cons"
                      aria-label="Cons"
                      value={form.cons}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, cons: e.target.value }))
                      }
                    />
                  </div>

                  <div className="auth-field">
                    <input
                      type="number"
                      step="0.01"
                      placeholder="Cost (optional)"
                      aria-label="Cost estimate (optional)"
                      value={form.cost_estimate}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, cost_estimate: e.target.value }))
                      }
                    />
                  </div>

                  <div className="auth-field">
                    <select
                      className="dash-select"
                      aria-label="Risk assessment"
                      value={form.risk_assessment}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, risk_assessment: e.target.value }))
                      }
                    >
                      {riskLevels.map((r) => (
                        <option key={r} value={r}>
                          Risk: {r}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="auth-field">
                    <select
                      className="dash-select"
                      aria-label="Feasibility score"
                      value={form.feasibility_score}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          feasibility_score: e.target.value,
                        }))
                      }
                    >
                      {feasibilityLevels.map((f) => (
                        <option key={f} value={f}>
                          Feasibility: {f}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button type="submit" variant="primary" style={{ marginTop: 12, width: "100%" }}>
                    {mode === "create" ? "Create Alternative" : "Update Alternative"}
                  </Button>

                  <Button
                    type="button"
                    variant="secondary"
                    style={{ marginTop: 10, width: "100%" }}
                    onClick={resetForm}
                  >
                    Cancel
                  </Button>
                </form>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

export default AlternativesPanel;
