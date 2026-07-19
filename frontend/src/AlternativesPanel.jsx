import { useEffect, useMemo, useState } from "react";
import axios from "axios";

function AlternativesPanel({ token, decisionId, onUpdated }) {
  const [alternatives, setAlternatives] = useState([]);
  const [loading, setLoading] = useState(false);
  const [panelError, setPanelError] = useState("");

  // Manage view (create/edit alternative)
  const [mode, setMode] = useState("create"); // create | edit
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const [form, setForm] = useState({
    title: "",
    description: "",
    pros: "",
    cons: "",
    cost: "",
    risk_level: "Low",
    feasibility: "Low",
  });

  // Compare view
  const [isComparing, setIsComparing] = useState(false);
  const [comparison, setComparison] = useState(null);
  const [compareLoading, setCompareLoading] = useState(false);

  const riskLevels = useMemo(() => ["Low", "Medium", "High"], []);
  const feasibilityLevels = useMemo(() => ["Low", "Medium", "High"], []);

  const fetchAlternatives = async () => {
    if (!decisionId) return;

    setPanelError("");
    setLoading(true);
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/decisions/${decisionId}/alternatives`,
        { headers: { Authorization: `Bearer ${token}` } }
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
    setComparison(null);
    setCompareLoading(false);

    setMode("create");
    setEditingId(null);
    setShowForm(false);
    setForm({
      title: "",
      description: "",
      pros: "",
      cons: "",
      cost: "",
      risk_level: "Low",
      feasibility: "Low",
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
      cost: "",
      risk_level: "Low",
      feasibility: "Low",
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
      cost: alt.cost ?? "",
      risk_level: alt.risk_level || "Low",
      feasibility: alt.feasibility || "Low",
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
      cost: form.cost === "" ? null : Number(form.cost),
      risk_level: form.risk_level,
      feasibility: form.feasibility,
      decision_id: decisionId,
    };

    try {
      if (mode === "create") {
        await axios.post(
          "http://127.0.0.1:8000/alternatives",
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
      } else {
        await axios.put(
          `http://127.0.0.1:8000/alternatives/${editingId}`,
          {
            title: payload.title,
            description: payload.description,
            pros: payload.pros,
            cons: payload.cons,
            cost: payload.cost,
            risk_level: payload.risk_level,
            feasibility: payload.feasibility,
          },
          { headers: { Authorization: `Bearer ${token}` } }
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
    const ok = window.confirm("Delete this alternative?");
    if (!ok) return;

    // If the user deletes while comparing, go back to manage view to prevent stale UI.
    setIsComparing(false);
    setComparison(null);
    setCompareLoading(false);

    setPanelError("");
    try {
      await axios.delete(
        `http://127.0.0.1:8000/alternatives/${alternativeId}`,
        { headers: { Authorization: `Bearer ${token}` } }
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

  const fetchComparison = async () => {
    if (!decisionId || !token) return;

    setPanelError("");
    setCompareLoading(true);
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/decisions/${decisionId}/compare`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setComparison(res.data);
    } catch (err) {
      setPanelError(
        err?.response?.data?.detail || "Failed to load comparison."
      );
    } finally {
      setCompareLoading(false);
    }
  };

  const onClickCompare = () => {
    setIsComparing(true);
    setComparison(null);
    fetchComparison();
  };

  const goBackToAlternatives = () => {
    setIsComparing(false);
    setComparison(null);
    setCompareLoading(false);
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
          style={{ color: "#FF6B6B", marginBottom: 12 }}
        >
          {panelError}
        </div>
      )}

      {/* COMPARISON MODE (only after clicking Compare) */}
      {isComparing && (
        <div style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button
              type="button"
              className="auth-button"
              style={{ marginTop: 12, flex: 1 }}
              onClick={goBackToAlternatives}
              disabled={compareLoading}
            >
              {compareLoading ? "Loading..." : "Go Back"}
            </button>
          </div>

          {comparison ? (
            <>
              <div
                className="dash-card-note"
                style={{ marginBottom: 6, marginTop: 12 }}
              >
                Decision: <b>{comparison.decision_title}</b>
              </div>

              <div className="dash-card-note">
                {comparison.alternatives.length} alternative(s) available
                for comparison.
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
                    </tr>
                  </thead>
                  <tbody>
                    {comparison.alternatives.map((alt) => (
                      <tr key={alt.id ?? alt.title}>
                        <td>{alt.title}</td>
                        <td>{alt.risk_level ?? "—"}</td>
                        <td>{alt.feasibility ?? "—"}</td>
                        <td>{alt.cost ?? "—"}</td>
                        <td>{alt.description ?? "—"}</td>
                        <td>{alt.pros ?? "—"}</td>
                        <td>{alt.cons ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <p className="dash-card-note" style={{ marginTop: 12 }}>
              {compareLoading ? "Comparing..." : "Click Compare to load details."}
            </p>
          )}
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
              <div style={{ marginBottom: 12 }}>
                <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                  <button
                    type="button"
                    className="auth-button"
                    style={{ marginTop: 12, flex: 1 }}
                    onClick={onClickCompare}
                    disabled={compareLoading || !decisionId}
                  >
                    {compareLoading ? "Comparing..." : "Compare"}
                  </button>

                  <button
                    type="button"
                    className="auth-button"
                    style={{ marginTop: 12, flex: 1 }}
                    onClick={() => {
                      setMode("create");
                      setEditingId(null);
                      setShowForm(true);
                      setForm({
                        title: "",
                        description: "",
                        pros: "",
                        cons: "",
                        cost: "",
                        risk_level: "Low",
                        feasibility: "Low",
                      });
                    }}
                  >
                    Create Alternative
                  </button>
                </div>
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
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alternatives.map((alt) => (
                      <tr key={alt.id}>
                        <td>{alt.title}</td>
                        <td>{alt.risk_level}</td>
                        <td>{alt.feasibility}</td>
                        <td>{alt.cost ?? "—"}</td>
                        <td>
                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              flexWrap: "wrap",
                            }}
                          >
                            <button
                              className="dash-logout"
                              onClick={() => startEdit(alt)}
                              style={{ padding: "6px 10px" }}
                              type="button"
                            >
                              Edit
                            </button>
                            <button
                              className="dash-logout"
                              onClick={() => handleDelete(alt.id)}
                              style={{
                                padding: "6px 10px",
                                borderColor: "#FF6B6B",
                                color: "#FF6B6B",
                              }}
                              type="button"
                            >
                              Delete
                            </button>
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
                      value={form.description}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, description: e.target.value }))
                      }
                      rows={2}
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
                        marginTop: 10,
                      }}
                    />
                  </div>

                  <div className="auth-field">
                    <input
                      type="text"
                      placeholder="Pros"
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
                      value={form.cost}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, cost: e.target.value }))
                      }
                    />
                  </div>

                  <div className="auth-field">
                    <select
                      className="dash-select"
                      value={form.risk_level}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, risk_level: e.target.value }))
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
                      value={form.feasibility}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          feasibility: e.target.value,
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

                  <button
                    type="submit"
                    className="auth-button"
                    style={{ marginTop: 12 }}
                  >
                    {mode === "create" ? "Create Alternative" : "Update Alternative"}
                  </button>

                  <button
                    type="button"
                    className="dash-logout"
                    style={{ marginTop: 10, width: "100%" }}
                    onClick={resetForm}
                  >
                    Cancel
                  </button>
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
