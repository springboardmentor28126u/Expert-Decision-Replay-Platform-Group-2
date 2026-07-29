import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { StatCard } from '../components/dashboard/StatCard';
import { decisionService } from '../services/decisionService';
import { approvalService } from '../services/approvalService';
import {
  IconClipboard,
  IconClock,
  IconCalendar,
  IconHome,
  IconFileText,
  IconChecklist,
  IconUsers,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const sidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/manager' },
  { label: 'Team Decisions', icon: IconFileText, path: '/decisions' },
  { label: 'Approvals', icon: IconChecklist, path: '/dashboard/manager/approvals' },
  { label: 'Requests', icon: IconUsers, path: '/dashboard/manager/requests' },
];

export default function ManagerDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ teamDecisions: 0, pendingApprovals: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setError('');
      try {
        const [decData, pendCount] = await Promise.all([
          decisionService.list({ limit: 1 }).catch(() => null),
          approvalService.getPendingCount().catch(() => null),
        ]);
        setStats({
          teamDecisions: decData?.total || 0,
          pendingApprovals: pendCount?.total || 0,
        });
      } catch (err) {
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants}>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Team Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {stats.pendingApprovals > 0
              ? `${stats.pendingApprovals} pending approval${stats.pendingApprovals > 1 ? 's' : ''} need your review`
              : 'No pending approvals at this time.'}
          </p>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">{error}</motion.div>
        )}

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Team Decisions"
            value={stats.teamDecisions}
            icon={IconClipboard}
            loading={loading}
            index={0}
            subtitle="Across your team"
          />
          <StatCard
            label="Pending Approvals"
            value={stats.pendingApprovals}
            icon={IconClock}
            loading={loading}
            index={1}
            subtitle="Need your review"
            onClick={() => navigate('/dashboard/manager/approvals')}
          />
          <StatCard
            label="Avg Turnaround"
            value="—"
            icon={IconCalendar}
            index={2}
            subtitle="Approval cycle time"
          />
        </motion.div>

        {/* Approvals section */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Pending Approvals
            </h2>
            <button
              onClick={() => navigate('/dashboard/manager/approvals')}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View all
            </button>
          </div>
          <div className="px-5 py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <IconChecklist size={24} stroke={1.5} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {stats.pendingApprovals > 0 ? `${stats.pendingApprovals} approval${stats.pendingApprovals > 1 ? 's' : ''} pending` : 'No pending approvals'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {stats.pendingApprovals > 0
                    ? 'View and act on pending approvals from the Approvals page.'
                    : 'Approval requests will appear here when decisions are submitted for review.'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
