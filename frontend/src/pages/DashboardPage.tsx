import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useDashboard';
import ErrorBoundary from '../components/common/ErrorBoundary';
import Button from '../components/common/Button';

// Modular Dashboard Components
import DashboardHeader from '../components/dashboard/DashboardHeader';
import DashboardCards from '../components/DashboardCards';
import MonthlyChart from '../components/dashboard/MonthlyChart';
import ApprovalChart from '../components/dashboard/ApprovalChart';
import ReplayChart from '../components/dashboard/ReplayChart';
import UserActivityChart from '../components/dashboard/UserActivityChart';
import ActivityTimeline from '../components/dashboard/ActivityTimeline';

// Skeleton UI Components
import {
  SkeletonHeader,
  SkeletonCards,
  SkeletonCharts,
  SkeletonActivity,
} from '../components/dashboard/SkeletonLoader';

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { data, isLoading, isFetching, isError, error, manualRefresh } = useDashboard(10);

  const roleLower = (user?.role || '').toLowerCase();
  const isAdminOrManager = ['administrator', 'admin', 'manager', 'reviewer'].includes(roleLower);

  if (isLoading) {
    return (
      <div className="section-spacing space-y-8 animate-fadeIn">
        <SkeletonHeader />
        <SkeletonCards count={isAdminOrManager ? 5 : 4} />
        <SkeletonCharts columns={isAdminOrManager ? 2 : 3} />
        <SkeletonActivity />
      </div>
    );
  }

  const cardsData = data?.cards || {
    total_decisions: 0,
    pending_approvals: 0,
    approved_decisions: 0,
    replays_count: 0,
    active_users: 0,
    total_decisions_change: 0,
    pending_approvals_change: 0,
    approved_decisions_change: 0,
    replays_count_change: 0,
    active_users_change: 0,
  };

  const chartsData = data?.charts || {
    monthly_decisions: [],
    approval_trends: [],
    replay_trends: [],
    user_activity: [],
  };

  const activityItems = data?.recent_activity || [];

  return (
    <div className="section-spacing space-y-8 animate-fadeIn">
      {/* Header Component */}
      <ErrorBoundary>
        <DashboardHeader
          onRefresh={manualRefresh}
          isRefreshing={isFetching}
          lastUpdated={new Date()}
        />
      </ErrorBoundary>

      {/* Error Alert State */}
      {isError && (
        <div className="rounded-xl bg-error-bg/25 border border-error/30 p-4 text-error flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-sm font-semibold">{error || 'Failed to sync with dashboard service.'}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={manualRefresh}>
            Retry Sync
          </Button>
        </div>
      )}

      {/* 1. KPI Cards Grid (Memoized) */}
      <ErrorBoundary>
        <DashboardCards data={cardsData} loading={false} />
      </ErrorBoundary>

      {/* 2. Charts Grid (Split into independent, memoized components) */}
      <ErrorBoundary>
        <div className={`grid grid-cols-1 ${isAdminOrManager ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
          <MonthlyChart data={chartsData.monthly_decisions} />
          <ApprovalChart data={chartsData.approval_trends} />
          <ReplayChart data={chartsData.replay_trends} />
          {isAdminOrManager && <UserActivityChart data={chartsData.user_activity} />}
        </div>
      </ErrorBoundary>

      {/* 3. Activity Feed Timeline (Independent pagination state) */}
      <ErrorBoundary>
        <ActivityTimeline
          initialItems={activityItems}
          onRefresh={manualRefresh}
        />
      </ErrorBoundary>
    </div>
  );
};

export default DashboardPage;
