import { useState, useEffect } from 'react';
import { client } from '../api/client';

export interface DashboardData {
  cards: {
    total_decisions: number;
    pending_approvals: number;
    approved_decisions: number;
    replays_count: number;
    active_users: number;
    total_decisions_change?: number;
    pending_approvals_change?: number;
    approved_decisions_change?: number;
    replays_count_change?: number;
    active_users_change?: number;
  };
  charts?: {
    monthly_decisions: any[];
    approval_trends: any[];
    replay_trends: any[];
    user_activity: any[];
  };
  recent_activity?: any[];
}

export const useDashboard = (limit = 10) => {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setIsFetching(true);
    try {
      const res = await client.get('/api/dashboard/stats');
      setData(res.data);
      setIsError(false);
      setError(null);
    } catch (err: any) {
      console.error('Failed to load dashboard data:', err);
      setIsError(true);
      setError(err.message || 'Failed to fetch dashboard data');
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    manualRefresh: fetchDashboardData,
  };
};
