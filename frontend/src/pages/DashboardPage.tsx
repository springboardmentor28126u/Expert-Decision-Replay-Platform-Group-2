import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorBoundary from '../components/common/ErrorBoundary';
import { decisionsApi } from '../api/decisions';
import { Decision } from '../types';
import StatusBadge from '../components/decisions/StatusBadge';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data, isLoading, isError, manualRefresh } = useDashboard();
  const [recentDecisions, setRecentDecisions] = useState<Decision[]>([]);
  const [decisionsLoading, setDecisionsLoading] = useState(true);

  useEffect(() => {
    const loadRecent = async () => {
      setDecisionsLoading(true);
      try {
        const res = await decisionsApi.list({ page_size: 5 });
        setRecentDecisions(res.items || []);
      } catch (err) {
        console.error('Failed to load recent decisions', err);
      } finally {
        setDecisionsLoading(false);
      }
    };
    loadRecent();
  }, []);

  const cards = data?.cards || {
    total_decisions: 0,
    pending_approvals: 0,
    approved_decisions: 0,
    replays_count: 0,
    active_users: 0,
  };

  const stats = (data as any)?.stats || {
    draft: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
  };

  return (
    <ErrorBoundary>
      <div className="section-spacing space-y-8 animate-fadeIn">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-border pb-6 gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-text">
              Welcome back, {user?.username || 'User'} 👋
            </h1>
            <p className="text-sm text-text-secondary mt-1">
              Expert Decision Replay Platform — Preserving organizational knowledge and decision history.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="secondary" size="sm" onClick={manualRefresh}>
              Refresh Stats
            </Button>
            <Button variant="primary" size="sm" onClick={() => navigate('/dashboard/decisions?create=true')}>
              + New Decision
            </Button>
          </div>
        </div>

        {/* KPI Cards Grid */}
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="p-6 border-l-4 border-l-primary">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Total Decisions
              </div>
              <div className="text-3xl font-extrabold text-text mt-2">
                {cards.total_decisions}
              </div>
              <span className="text-xs text-text-muted mt-1 block">Recorded platform decisions</span>
            </Card>

            <Card className="p-6 border-l-4 border-l-warning">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Pending Review
              </div>
              <div className="text-3xl font-extrabold text-warning mt-2">
                {cards.pending_approvals}
              </div>
              <span className="text-xs text-text-muted mt-1 block">Awaiting manager authorization</span>
            </Card>

            <Card className="p-6 border-l-4 border-l-success">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Approved Decisions
              </div>
              <div className="text-3xl font-extrabold text-success mt-2">
                {cards.approved_decisions}
              </div>
              <span className="text-xs text-text-muted mt-1 block">Verified institutional knowledge</span>
            </Card>

            <Card className="p-6 border-l-4 border-l-accent">
              <div className="text-xs font-semibold uppercase tracking-wider text-text-secondary">
                Active Users
              </div>
              <div className="text-3xl font-extrabold text-accent mt-2">
                {cards.active_users}
              </div>
              <span className="text-xs text-text-muted mt-1 block">Registered team members</span>
            </Card>
          </div>
        )}

        {/* Status Breakdown & Quick Access */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Breakdown Card */}
          <Card className="p-6 lg:col-span-1 space-y-4">
            <h3 className="text-lg font-bold text-text">Decision Pipeline</h3>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-xs font-medium text-text-secondary mb-1">
                  <span>Drafts</span>
                  <span>{stats.draft}</span>
                </div>
                <div className="w-full bg-surface-hover h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-text-secondary h-full rounded-full transition-all"
                    style={{
                      width: `${cards.total_decisions ? (stats.draft / cards.total_decisions) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-text-secondary mb-1">
                  <span>Under Review</span>
                  <span>{stats.under_review}</span>
                </div>
                <div className="w-full bg-surface-hover h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-warning h-full rounded-full transition-all"
                    style={{
                      width: `${cards.total_decisions ? (stats.under_review / cards.total_decisions) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-text-secondary mb-1">
                  <span>Approved</span>
                  <span>{stats.approved}</span>
                </div>
                <div className="w-full bg-surface-hover h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-success h-full rounded-full transition-all"
                    style={{
                      width: `${cards.total_decisions ? (stats.approved / cards.total_decisions) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* Recent Decisions Feed */}
          <Card className="p-6 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-text">Recent Decisions</h3>
              <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/decisions')}>
                View All →
              </Button>
            </div>

            {decisionsLoading ? (
              <div className="flex h-32 items-center justify-center">
                <LoadingSpinner size="md" />
              </div>
            ) : recentDecisions.length > 0 ? (
              <div className="divide-y divide-border">
                {recentDecisions.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => navigate(`/dashboard/decisions/${d.id}`)}
                    className="py-3 flex items-center justify-between cursor-pointer hover:bg-surface-hover/50 px-2 rounded-md transition-all"
                  >
                    <div>
                      <div className="text-sm font-semibold text-text">{d.title}</div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {d.category || 'General'} • By {d.creator?.username || 'System'}
                      </div>
                    </div>
                    <StatusBadge status={d.status || 'Draft'} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-sm text-text-secondary py-8">
                No decisions created yet. Click "+ New Decision" to record your first decision!
              </div>
            )}
          </Card>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardPage;
