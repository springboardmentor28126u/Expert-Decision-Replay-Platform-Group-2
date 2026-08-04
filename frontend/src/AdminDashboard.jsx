import { getAdminDashboard } from "./api/dashboardService";
import StatCard from "./StatCard";
import RecentDecisionTable from "./RecentDecisionTable";
import useDashboardData from "./useDashboardData";
import { DashboardSpinner, DashboardError } from "./DashboardStates";

/**
 * AdminDashboard - Admin role dashboard page content.
 *
 * Props:
 *   token            (string, required)  JWT for authenticated API calls.
 *   onSelectDecision (func, optional)    Passed through to RecentDecisionTable; makes
 *                                       titles clickable (e.g. "Open details" handler).
 *
 * Fetches GET /dashboard/admin via the Dashboard API service and renders:
 *   - Loading spinner while the initial request is in flight
 *   - Error panel with retry if the API call fails
 *   - Section 1: 7 StatCards (Total Users / Active Users / Employees / Reviewers / Managers / Admins / Total Alternatives)
 *   - Section 2: 6 StatCards (Total Decisions / Draft / Under Review / Approved / Rejected / Archived)
 *   - Section 3: RecentDecisionTable with the recent decisions list
 */
export default function AdminDashboard({ token, onSelectDecision = null }) {
  const { data, loading, error, fetchDashboard } = useDashboardData(
    getAdminDashboard,
    token,
    "admin"
  );

  // Safe defaults so cards never render undefined values
  const stats = data || {};
  const recentDecisions = data?.recent_decisions || [];

  const userStatCards = [
    { title: "Total Users", value: stats.total_users ?? 0, icon: "👥", color: "#4FD1B5" },
    { title: "Active Users", value: stats.active_users ?? 0, icon: "🟢", color: "#34D399" },
    { title: "Employees", value: stats.employees ?? 0, icon: "💼", color: "#60A5FA" },
    { title: "Reviewers", value: stats.reviewers ?? 0, icon: "🔍", color: "#F2A623" },
    { title: "Managers", value: stats.managers ?? 0, icon: "📋", color: "#C084FC" },
    { title: "Admins", value: stats.admins ?? 0, icon: "🛡️", color: "#FF6B6B" },
    { title: "Total Alternatives", value: stats.total_alternatives ?? 0, icon: "🔄", color: "#9AA5B5" },
  ];

  const decisionStatCards = [
    { title: "Total Decisions", value: stats.total_decisions ?? 0, icon: "📊", color: "#4FD1B5" },
    { title: "Draft", value: stats.draft_decisions ?? 0, icon: "📝", color: "#60A5FA" },
    { title: "Under Review", value: stats.under_review_decisions ?? 0, icon: "🔍", color: "#F2A623" },
    { title: "Approved", value: stats.approved_decisions ?? 0, icon: "✅", color: "#34D399" },
    { title: "Rejected", value: stats.rejected_decisions ?? 0, icon: "❌", color: "#FF6B6B" },
    { title: "Archived", value: stats.archived_decisions ?? 0, icon: "📦", color: "#9AA5B5" },
  ];

  // Initial load: show spinner, not skeletons
  const showSpinner = loading && !data;
  const showError = !loading && error;

  return (
    <div
      style={{
        maxWidth: "1000px",
        margin: "0 auto",
        padding: "40px 32px",
        fontFamily: '"Segoe UI", -apple-system, sans-serif',
      }}
    >
      {/* Loading spinner / error state with retry */}
      {showSpinner && <DashboardSpinner />}
      {showError && <DashboardError message={error} onRetry={fetchDashboard} />}

      {/* Content (renders with skeletons when refreshing data) */}
      {!showError && (
        <>
          {/* Section 1: User statistics */}
          <div style={{ marginBottom: "40px" }}>
            <h2
              className="dash-section-title"
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#F1F3F6",
                margin: "0 0 16px",
              }}
            >
              User Statistics
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              {userStatCards.map((card) => (
                <StatCard key={card.title} {...card} loading={loading} />
              ))}
            </div>
          </div>

          {/* Section 2: Decision statistics */}
          <div style={{ marginBottom: "40px" }}>
            <h2
              className="dash-section-title"
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#F1F3F6",
                margin: "0 0 16px",
              }}
            >
              Decision Statistics
            </h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              {decisionStatCards.map((card) => (
                <StatCard key={card.title} {...card} loading={loading} />
              ))}
            </div>
          </div>

          {/* Section 3: Recent decisions */}
          <div style={{ marginTop: "20px" }}>
            <h2
              className="dash-section-title"
              style={{
                fontSize: "16px",
                fontWeight: 700,
                color: "#F1F3F6",
                margin: "0 0 16px",
              }}
            >
              Recent Decisions
            </h2>
            <RecentDecisionTable
              decisions={recentDecisions}
              loading={loading}
              onSelectDecision={onSelectDecision}
            />
          </div>
        </>
      )}
    </div>
  );
}
