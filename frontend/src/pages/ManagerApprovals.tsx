import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { StatusBadge } from '../components/dashboard/StatusBadge';
import { decisionService } from '../services/decisionService';
import type { DecisionListItem } from '../types/decision';
import {
  IconHome,
  IconUsers,
  IconChecklist,
  IconChevronRight,
} from '@tabler/icons-react';

const sidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/manager' },
  { label: 'Team Decisions', icon: IconUsers, path: '/decisions' },
  { label: 'Pending Approvals', icon: IconChecklist, path: '/dashboard/manager/approvals' },
  { label: 'Requests', icon: IconUsers, path: '/dashboard/manager/requests' },
];

export default function ManagerApprovals() {
  const navigate = useNavigate();
  const [decisions, setDecisions] = useState<DecisionListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPending = async () => {
      setLoading(true);
      try {
        const data = await decisionService.list({ status: 'under_review', limit: 50 });
        setDecisions(data.items);
      } catch (err: any) {
        setError(err.response?.data?.detail || 'Failed to load pending approvals');
      }
      setLoading(false);
    };
    fetchPending();
  }, []);

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Approvals</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">Decisions waiting for your review</p>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">{error}</div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>
        ) : decisions.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-8 text-center">
            <IconChecklist size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
            <p className="text-sm font-medium text-gray-900 dark:text-white">No pending approvals</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">All caught up!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {decisions.map((d) => (
              <button
                key={d.id}
                onClick={() => navigate(`/decisions/${d.id}`)}
                className="w-full text-left rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-5 hover:border-indigo-200 dark:hover:border-indigo-800/40 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">{d.title}</h3>
                      <StatusBadge status={d.status} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      by {d.creator?.full_name || 'Unknown'} · {d.alternative_count} alternatives
                    </p>
                  </div>
                  <IconChevronRight size={18} className="text-gray-400 shrink-0 ml-2" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
