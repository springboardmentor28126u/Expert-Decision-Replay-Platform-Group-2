import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { decisionsApi } from '../api/decisions';
import { DecisionListResponse } from '../types';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusBadge from '../components/decisions/StatusBadge';
import { formatDate } from '../utils/helpers';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    review: 0,
    approved: 0,
  });
  const [recentDecisions, setRecentDecisions] = useState<DecisionListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const recent = await decisionsApi.list({ page: 1, page_size: 5 });
        setRecentDecisions(recent);

        const [drafts, reviews, approved] = await Promise.all([
          decisionsApi.list({ status: 'Draft', page_size: 1 }),
          decisionsApi.list({ status: 'Under Review', page_size: 1 }),
          decisionsApi.list({ status: 'Approved', page_size: 1 }),
        ]);

        setStats({
          total: recent.total,
          draft: drafts.total,
          review: reviews.total,
          approved: approved.total,
        });
      } catch (error) {
        console.error('Failed to load dashboard data', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const renderStatCard = (title: string, value: number, colorClass: string) => {
    return (
      <Card className="flex flex-col justify-center border border-border bg-surface-elevated/40">
        <span className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {title}
        </span>
        <span className={`text-3xl font-bold tracking-tight mt-2 ${colorClass}`}>{value}</span>
      </Card>
    );
  };

  return (
    <div className="section-spacing">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight text-text">Dashboard</h1>
          <p className="text-sm text-text-secondary">
            Overview of logged organizational decisions and metrics.
          </p>
        </div>
        <Button variant="primary" onClick={() => navigate('/dashboard/decisions?create=true')}>
          Record Decision
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {renderStatCard('Total Decisions', stats.total, 'text-primary-light')}
        {renderStatCard('Drafts', stats.draft, 'text-text-secondary')}
        {renderStatCard('Under Review', stats.review, 'text-warning')}
        {renderStatCard('Approved', stats.approved, 'text-success')}
      </div>

      {/* Recent Activity Table */}
      <Card className="border border-border/80 p-0 overflow-hidden bg-surface-elevated/20">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/60">
          <h3 className="text-base font-bold text-text">Recent Decisions</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/decisions')}>
            View Library
          </Button>
        </div>

        {recentDecisions?.items && recentDecisions.items.length > 0 ? (
          <div className="overflow-x-auto w-full">
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-elevated/40 text-text-secondary">
                  <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs">Title</th>
                  <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs">Category</th>
                  <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs">Status</th>
                  <th className="px-6 py-3.5 font-semibold uppercase tracking-wider text-xs text-right">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {recentDecisions.items.map((d) => (
                  <tr
                    key={d.id}
                    className="hover:bg-surface-hover/30 cursor-pointer transition-all"
                    onClick={() => navigate(`/dashboard/decisions/${d.id}`)}
                  >
                    <td className="px-6 py-4 font-semibold text-text pr-3 truncate max-w-xs">
                      {d.title}
                    </td>
                    <td className="px-6 py-4 text-text-secondary">
                      {d.category || '—'}
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={d.status} />
                    </td>
                    <td className="px-6 py-4 text-right text-text-muted text-xs">
                      {d.created_at ? formatDate(d.created_at) : ''}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center text-text-secondary py-12 text-sm border-t border-border/40">
            No decisions recorded yet. Click 'Record Decision' to log the first one.
          </div>
        )}
      </Card>
    </div>
  );
};

export default DashboardPage;
