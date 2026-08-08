import { FileText, Clock, CheckCircle2, XCircle, Users, MessageSquare } from "lucide-react";
import KpiCard from "./charts/KpiCard";
import DecisionStatusPie from "./charts/DecisionStatusPie";
import TrendLineChart from "./charts/TrendLineChart";
import BarChartCard from "./charts/BarChartCard";
import RecentActivityFeed from "./charts/RecentActivityFeed";
import NotificationsSummary from "./charts/NotificationsSummary";
import { APPROVAL_COLORS } from "./charts/chartTheme";

/**
 * Executive analytics view for the dashboard's landing tab. Everything here
 * comes from the single GET /dashboard/summary payload (`analytics`) plus
 * the `notifications` list the Dashboard page already polls for the bell
 * icon — no additional network requests are made by this component or
 * anything it renders.
 */
function AnalyticsDashboard({ analytics, statusCounts, loading, error, onStatClick, notifications, notificationsLoading }) {
  const categoryData = (analytics?.by_category ?? []).map((c) => ({ name: c.category, value: c.count }));
  const creatorData = (analytics?.top_creators ?? []).map((c) => ({ name: c.full_name, value: c.decision_count }));
  const approvalData = analytics
    ? [
        { name: "Pending", value: analytics.approval_performance.pending },
        { name: "Approved", value: analytics.approval_performance.approved },
        { name: "Rejected", value: analytics.approval_performance.rejected },
      ]
    : [];

  return (
    <div>
      {error && (
        <p style={{ color: "var(--danger)", fontSize: "13px", margin: "0 0 16px" }}>{error}</p>
      )}

      <section className="view-section">
        <div className="view-section-header">
          <h2 className="view-section-title">Overview</h2>
        </div>
        <div className="stat-grid">
          <KpiCard label="Total Decisions" value={analytics?.total_decisions} icon={FileText} loading={loading} onClick={() => onStatClick?.("all")} />
          <KpiCard label="Pending Reviews" value={analytics?.pending_reviews} icon={Clock} accent="var(--warning)" loading={loading} />
          <KpiCard label="Approved" value={analytics?.approved_decisions} icon={CheckCircle2} accent="var(--success)" loading={loading} onClick={() => onStatClick?.("approved")} />
          <KpiCard label="Rejected" value={analytics?.rejected_decisions} icon={XCircle} accent="var(--danger)" loading={loading} onClick={() => onStatClick?.("rejected")} />
          <KpiCard label="Active Users" value={analytics?.active_users} icon={Users} loading={loading} />
          <KpiCard label="Total Comments" value={analytics?.total_comments} icon={MessageSquare} loading={loading} />
        </div>
      </section>

      <section className="view-section">
        <div className="view-section-header">
          <h2 className="view-section-title">Analytics</h2>
          <p className="view-section-subtitle">Status mix, volume trend, and approval outcomes</p>
        </div>
        <div className="analytics-grid-2">
          <DecisionStatusPie statusCounts={statusCounts} loading={loading} onSliceClick={onStatClick} />
          <TrendLineChart periods={analytics?.created_over_time} loading={loading} />
        </div>

        <div className="analytics-grid-2">
          <BarChartCard
            title="Decisions by Category"
            subtitle="Volume of decisions per category"
            data={categoryData}
            loading={loading}
            emptyMessage="No categorized decisions yet."
          />
          <BarChartCard
            title="Approval Performance"
            subtitle="Approval outcomes across all decisions"
            data={approvalData}
            loading={loading}
            emptyMessage="No approvals have been recorded yet."
            colors={{ Pending: APPROVAL_COLORS.pending, Approved: APPROVAL_COLORS.approved, Rejected: APPROVAL_COLORS.rejected }}
          />
        </div>

        <div className="analytics-grid-2">
          <BarChartCard
            title="Top Decision Creators"
            subtitle="Most active decision authors"
            data={creatorData}
            loading={loading}
            emptyMessage="No decisions have been created yet."
            orientation="horizontal"
            height={Math.max(160, (creatorData.length || 3) * 38)}
          />
          <NotificationsSummary notifications={notifications} loading={notificationsLoading} />
        </div>
      </section>

      <section className="view-section">
        <div className="view-section-header">
          <h2 className="view-section-title">Recent Activity</h2>
          <p className="view-section-subtitle">Latest decisions, approvals, and discussion</p>
        </div>
        <RecentActivityFeed recentActivity={analytics?.recent_activity} loading={loading} />
      </section>
    </div>
  );
}

export default AnalyticsDashboard;
