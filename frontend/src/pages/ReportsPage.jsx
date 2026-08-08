import { useState, useEffect, useCallback } from "react";
import apiClient, { authHeaders } from "../api/client";
import { useToast } from "../components/ui/ToastContext";
import Button from "../components/ui/Button";

const REPORT_TABS = [
  { key: "decision", label: "Decisions" },
  { key: "approval", label: "Approvals" },
  { key: "team", label: "Teams" },
  { key: "audit", label: "Audit" },
];

const STATUS_LABELS = {
  draft: "Draft",
  under_review: "Under Review",
  approved: "Approved",
  rejected: "Rejected",
  archived: "Archived",
  pending: "Pending",
  escalated: "Escalated",
};

function formatDate(isoString) {
  if (!isoString) return "-";
  return new Date(isoString).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

// Every report view (Decisions/Approvals/Teams/Audit) simply renders
// whatever the corresponding /api/v1/reports/* endpoint returns — no
// aggregation happens here, only formatting into the existing
// stat-card/dash-table patterns already used elsewhere in the Dashboard.
function ReportsPage({ token }) {
  const showToast = useToast();
  const [activeReport, setActiveReport] = useState("decision");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await apiClient.get(
        `/api/v1/reports/${activeReport}`,
        authHeaders(token)
      );
      setReportData(res.data);
    } catch (err) {
      console.error("Failed to load report", err);
      setError(err.response?.data?.detail || "Failed to load this report.");
      setReportData(null);
    } finally {
      setLoading(false);
    }
  }, [activeReport, token]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  const handleExport = async (format) => {
    setExporting(format);
    try {
      const res = await apiClient.get(
        `/api/v1/reports/${activeReport}/export/${format}`,
        {
          headers: authHeaders(token).headers,
          responseType: "blob",
        }
      );
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${activeReport}_report.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(`Failed to export ${activeReport} report as ${format}`, err);
      showToast("Failed to export report.", { tone: "error" });
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="panel">
      <div className="panel-toolbar">
        <p className="panel-title" style={{ margin: 0 }}>Reports</p>

        <div style={{ display: "flex", gap: "8px" }}>
          <Button
            variant="secondary"
            size="sm"
            disabled={!reportData || !!exporting}
            onClick={() => handleExport("pdf")}
          >
            {exporting === "pdf" ? "Exporting..." : "⬇ Export PDF"}
          </Button>
          <Button
            variant="primary"
            size="sm"
            disabled={!reportData || !!exporting}
            onClick={() => handleExport("excel")}
          >
            {exporting === "excel" ? "Exporting..." : "⬇ Export Excel"}
          </Button>
        </div>
      </div>

      <div className="tab-bar" role="tablist" aria-label="Report type">
        {REPORT_TABS.map((tab) => (
          <button
            key={tab.key}
            role="tab"
            aria-selected={activeReport === tab.key}
            className={`tab-btn ${activeReport === tab.key ? "active" : ""}`}
            onClick={() => {
              // Clear the previous tab's data in the same state update
              // that switches tabs — otherwise fetchReport() (which
              // replaces it) only runs in a useEffect that fires after
              // this render commits, leaving one render where
              // activeReport has already changed but reportData still
              // holds the *other* report's shape (e.g. Decision's
              // by_status instead of Approval's by_level), which crashes
              // whichever ReportView renders next.
              setActiveReport(tab.key);
              setReportData(null);
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="dash-card-note">Loading report...</p>
      ) : error ? (
        <p style={{ color: "var(--danger)", fontSize: "13px" }}>{error}</p>
      ) : !reportData ? null : (
        <>
          {activeReport === "decision" && <DecisionReportView data={reportData} />}
          {activeReport === "approval" && <ApprovalReportView data={reportData} />}
          {activeReport === "team" && <TeamReportView data={reportData} />}
          {activeReport === "audit" && <AuditReportView data={reportData} />}
        </>
      )}
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="stat-card">
      <p className="stat-card-label">{label}</p>
      <p className="stat-card-value">{value}</p>
    </div>
  );
}

function ReportSection({ title, children }) {
  return (
    <div className="report-section">
      <p className="report-section-title">{title}</p>
      <div className="report-section-scroll">{children}</div>
    </div>
  );
}

function EmptyRow({ colSpan, text = "No data yet." }) {
  return (
    <tr>
      <td colSpan={colSpan} className="report-empty-row">
        {text}
      </td>
    </tr>
  );
}

function DecisionReportView({ data }) {
  return (
    <>
      <div className="stat-grid">
        <StatCard label="Total Decisions" value={data.total_decisions} />
        {data.by_status.map((s) => (
          <StatCard key={s.status} label={STATUS_LABELS[s.status] || s.status} value={s.count} />
        ))}
      </div>

      <ReportSection title="By Category">
        <table className="dash-table">
          <thead>
            <tr><th>Category</th><th>Count</th></tr>
          </thead>
          <tbody>
            {data.by_category.length === 0 ? (
              <EmptyRow colSpan={2} />
            ) : (
              data.by_category.map((c) => (
                <tr key={c.category} className="dash-table-row">
                  <td>{c.category}</td>
                  <td>{c.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ReportSection>

      <ReportSection title="Created Over Time">
        <table className="dash-table">
          <thead>
            <tr><th>Date</th><th>Count</th></tr>
          </thead>
          <tbody>
            {data.created_over_time.length === 0 ? (
              <EmptyRow colSpan={2} />
            ) : (
              data.created_over_time.map((p) => (
                <tr key={p.period} className="dash-table-row">
                  <td>{p.period}</td>
                  <td>{p.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ReportSection>

      <ReportSection title="Recent Decisions">
        <table className="dash-table">
          <thead>
            <tr><th>Title</th><th>Status</th><th>Category</th><th>Created</th></tr>
          </thead>
          <tbody>
            {data.recent_decisions.length === 0 ? (
              <EmptyRow colSpan={4} />
            ) : (
              data.recent_decisions.map((d) => (
                <tr key={d.id} className="dash-table-row">
                  <td style={{ fontWeight: 600 }}>{d.title}</td>
                  <td>{STATUS_LABELS[d.status] || d.status}</td>
                  <td>{d.category || "-"}</td>
                  <td>{formatDate(d.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ReportSection>
    </>
  );
}

function ApprovalReportView({ data }) {
  return (
    <>
      <div className="stat-grid">
        <StatCard label="Total Approvals" value={data.total_approvals} />
        <StatCard label="Pending" value={data.pending} />
        <StatCard label="Approved" value={data.approved} />
        <StatCard label="Rejected" value={data.rejected} />
        <StatCard label="Escalated" value={data.escalated} />
        <StatCard
          label="Avg. Completion"
          value={data.average_completion_hours != null ? `${data.average_completion_hours.toFixed(1)}h` : "N/A"}
        />
      </div>

      <ReportSection title="Multi-Level Summary">
        <table className="dash-table">
          <thead>
            <tr><th>Level</th><th>Pending</th><th>Approved</th><th>Rejected</th><th>Escalated</th></tr>
          </thead>
          <tbody>
            {data.by_level.length === 0 ? (
              <EmptyRow colSpan={5} />
            ) : (
              data.by_level.map((lv) => (
                <tr key={lv.level} className="dash-table-row">
                  <td>Level {lv.level}</td>
                  <td>{lv.pending}</td>
                  <td>{lv.approved}</td>
                  <td>{lv.rejected}</td>
                  <td>{lv.escalated}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ReportSection>
    </>
  );
}

function TeamReportView({ data }) {
  return (
    <>
      <div className="stat-grid">
        <StatCard label="Total Teams" value={data.total_teams} />
      </div>

      <ReportSection title="Team Activity">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Team</th><th>Members</th><th>Decisions</th>
              <th>Pending</th><th>Approved</th><th>Rejected</th><th>Escalated</th>
            </tr>
          </thead>
          <tbody>
            {data.teams.length === 0 ? (
              <EmptyRow colSpan={7} />
            ) : (
              data.teams.map((t) => (
                <tr key={t.team_id} className="dash-table-row">
                  <td style={{ fontWeight: 600 }}>{t.team_name}</td>
                  <td>{t.member_count}</td>
                  <td>{t.decision_count}</td>
                  <td>{t.pending_approvals}</td>
                  <td>{t.approved_approvals}</td>
                  <td>{t.rejected_approvals}</td>
                  <td>{t.escalated_approvals}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ReportSection>
    </>
  );
}

function AuditReportView({ data }) {
  return (
    <>
      <div className="stat-grid">
        <StatCard label="Total Events" value={data.total_events} />
      </div>

      <ReportSection title="By Type">
        <table className="dash-table">
          <thead>
            <tr><th>Action</th><th>Count</th></tr>
          </thead>
          <tbody>
            {data.by_action.length === 0 ? (
              <EmptyRow colSpan={2} />
            ) : (
              data.by_action.map((a) => (
                <tr key={a.action} className="dash-table-row">
                  <td>{a.action}</td>
                  <td>{a.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ReportSection>

      <ReportSection title="User Activity">
        <table className="dash-table">
          <thead>
            <tr><th>User</th><th>Events</th></tr>
          </thead>
          <tbody>
            {data.by_actor.length === 0 ? (
              <EmptyRow colSpan={2} />
            ) : (
              data.by_actor.map((a) => (
                <tr key={a.actor_id} className="dash-table-row">
                  <td>{a.actor_name}</td>
                  <td>{a.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ReportSection>

      <ReportSection title="Timeline">
        <table className="dash-table">
          <thead>
            <tr><th>Date</th><th>Count</th></tr>
          </thead>
          <tbody>
            {data.timeline.length === 0 ? (
              <EmptyRow colSpan={2} />
            ) : (
              data.timeline.map((p) => (
                <tr key={p.period} className="dash-table-row">
                  <td>{p.period}</td>
                  <td>{p.count}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ReportSection>

      <ReportSection title="Security Events">
        <table className="dash-table">
          <thead>
            <tr><th>Action</th><th>Actor</th><th>When</th></tr>
          </thead>
          <tbody>
            {data.security_events.length === 0 ? (
              <EmptyRow colSpan={3} />
            ) : (
              data.security_events.map((e) => (
                <tr key={e.id} className="dash-table-row">
                  <td>{e.action}</td>
                  <td>{e.actor?.full_name || "Unknown"}</td>
                  <td>{formatDate(e.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ReportSection>

      <ReportSection title="Recent Events">
        <table className="dash-table">
          <thead>
            <tr><th>Action</th><th>Entity</th><th>Actor</th><th>When</th></tr>
          </thead>
          <tbody>
            {data.recent_events.length === 0 ? (
              <EmptyRow colSpan={4} />
            ) : (
              data.recent_events.map((e) => (
                <tr key={e.id} className="dash-table-row">
                  <td>{e.action}</td>
                  <td>{e.entity_type}</td>
                  <td>{e.actor?.full_name || "Unknown"}</td>
                  <td>{formatDate(e.created_at)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </ReportSection>
    </>
  );
}

export default ReportsPage;
