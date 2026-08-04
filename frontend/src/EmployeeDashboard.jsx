import { getEmployeeDashboard } from "./api/dashboardService";
import StatCard from "./StatCard";
import RecentDecisionTable from "./RecentDecisionTable";
import useDashboardData from "./useDashboardData";
import { DashboardSpinner, DashboardError } from "./DashboardStates";

/**
 * EmployeeDashboard - Employee role dashboard page content.
 *
 * Props:
 *   token            (string, required)  JWT for authenticated API calls.
 *   onSelectDecision (func, optional)    Passed through to RecentDecisionTable; makes
 *                                       titles clickable (e.g. "Open details" handler).
 *
 * Fetches GET /dashboard/employee via the Dashboard API service and renders:
 *   - Loading spinner while the initial request is in flight
 *   - Error panel with retry if the API call fails
 *   - 6 responsive StatCards (My Decisions / Draft / Under Review / Approved / Rejected / Archived)
 *   - RecentDecisionTable with the recent decisions list
 */
export default function EmployeeDashboard({ token, onSelectDecision = null }) {
  const { data, loading, error, fetchDashboard } = useDashboardData(
    getEmployeeDashboard,
    token,
    "employee"
  );

  // Safe defaults so cards never render undefined values
  const stats = data || {};
  const recentDecisions = data?.recent_decisions || [];

  const statCards = [
    { title: "My Decisions", value: stats.my_decisions ?? 0, icon: "📊", color: "#4FD1B5" },
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
          {/* Top section: 6 responsive StatCards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: "16px",
              marginBottom: "40px",
            }}
          >
            {statCards.map((card) => (
              <StatCard key={card.title} {...card} loading={loading} />
            ))}
          </div>

          {/* Bottom section: Recent decisions */}
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
