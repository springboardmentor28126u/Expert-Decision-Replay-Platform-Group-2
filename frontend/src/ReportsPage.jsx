import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  FileText,
  CheckCircle2,
  Users,
  ShieldCheck,
  FileDown,
  FileSpreadsheet,
} from "lucide-react";

const REPORT_TABS = [
  { key: "decision", label: "Decisions", icon: FileText },
  { key: "approvals", label: "Approvals", icon: CheckCircle2 },
  { key: "team", label: "Teams", icon: Users },
  { key: "audit", label: "Audit", icon: ShieldCheck },
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
// whatever the corresponding /api/v1/reports/* endpoint returns ΓÇö no
// aggregation happens here, only formatting into the existing
// stat-card/dash-table patterns already used elsewhere in the Dashboard.
function ReportsPage({ token }) {
  const [activeReport, setActiveReport] = useState("decision");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(null);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get(
        `http://127.0.0.1:8000/reports/${activeReport}`,
        { headers: { Authorization: `Bearer ${token}` } }
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
      const reportPath =
        activeReport === "approval"
          ? "approvals"
          : activeReport;

      const res = await axios.get(
        `http://127.0.0.1:8000/reports/${reportPath}/export/${format}`,
        {
          headers: { Authorization: `Bearer ${token}` },
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
      alert("Failed to export report.");
    } finally {
      setExporting(null);
    }
  };

  return (
  <div className="panel reports-page">

    {/* Reports Header */}
    <div className="reports-header">
      <div>
        <p className="panel-title reports-title">
          Reports
        </p>

        <p className="reports-subtitle">
          Decision analytics, approvals, team activity and audit information
        </p>
      </div>

      <div className="reports-export-actions">
        <button
          className="reports-export-btn"
          disabled={!reportData || !!exporting}
          onClick={() => handleExport("pdf")}
        >
          <FileDown size={15} />
          {exporting === "pdf" ? "Exporting..." : "Export PDF"}
        </button>

        <button
          className="reports-export-btn reports-export-primary"
          disabled={!reportData || !!exporting}
          onClick={() => handleExport("excel")}
        >
          <FileSpreadsheet size={15} />
          {exporting === "excel" ? "Exporting..." : "Export Excel"}
        </button>
      </div>
    </div>

    {/* Report Tabs */}
    <div className="reports-tabs">
      {REPORT_TABS.map((tab) => {
        const Icon = tab.icon;

        return (
          <button
            key={tab.key}
            className={`reports-tab ${
              activeReport === tab.key ? "active" : ""
            }`}
            onClick={() => {
              setActiveReport(tab.key);
              setReportData(null);
            }}
          >
            <Icon size={15} />
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>

    {loading ? (
      <p className="dash-card-note">Loading report...</p>
    ) : error ? (
      <p style={{ color: "var(--danger)", fontSize: "13px" }}>
        {error}
      </p>
    ) : !reportData ? null : (
      <>
        {activeReport === "decision" && (
          <DecisionReportView data={reportData} />
        )}

        {activeReport === "approvals" && (
          <ApprovalReportView data={reportData} />
        )}

        {activeReport === "team" && (
          <TeamReportView data={reportData} />
        )}

        {activeReport === "audit" && (
          <AuditReportView data={reportData} />
        )}
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
    <div style={{ marginTop: "24px" }}>
      <p style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)", marginBottom: "10px" }}>
        {title}
      </p>
      <div style={{ overflowX: "auto" }}>{children}</div>
    </div>
  );
}

function EmptyRow({ colSpan, text = "No data yet." }) {
  return (
    <tr>
      <td colSpan={colSpan} style={{ textAlign: "center", color: "var(--text-secondary)", padding: "16px" }}>
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




