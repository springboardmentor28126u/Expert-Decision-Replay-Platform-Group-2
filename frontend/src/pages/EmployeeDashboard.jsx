import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { StatCard } from '../components/dashboard/StatCard';
import { StatusBadge } from '../components/dashboard/StatusBadge';
import { decisionService } from '../services/decisionService';
import {
  IconClipboard,
  IconClock,
  IconActivity,
  IconHome,
  IconFileText,
  IconMessageCircle,
  IconUser,
  IconPlus,
  IconChevronRight,
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
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/employee' },
  { label: 'My Decisions', icon: IconFileText, path: '/decisions' },
  { label: 'Groups', icon: IconUsers, path: '/dashboard/employee/groups' },
  { label: 'Discussions', icon: IconMessageCircle, path: '/dashboard/employee/discussions' },
  { label: 'Profile', icon: IconUser, path: '/profile' },
];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ total: 0, by_status: {} });
  const [recentDecisions, setRecentDecisions] = useState([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [statsError, setStatsError] = useState('');
  const [decisionsError, setDecisionsError] = useState('');

  useEffect(() => {
    decisionService.getStats()
      .then(setStats)
      .catch((err) => setStatsError(err.response?.data?.detail || 'Failed to load stats'))
      .finally(() => setLoadingStats(false));

    decisionService.list({ limit: 5, my_only: true })
      .then(data => setRecentDecisions(data.items))
      .catch((err) => setDecisionsError(err.response?.data?.detail || 'Failed to load decisions'));
  }, []);

  const pendingReviews = (stats.by_status?.under_review || 0);
  const recentActivity = (stats.by_status?.draft || 0) + pendingReviews;

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric',
    });

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <motion.div 
        className="space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Welcome header */}
        <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Welcome back, {user?.full_name?.split(' ')[0]} 👋
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Here's an overview of your decisions and activity.
            </p>
          </div>
          <button
            id="create-decision-btn"
            onClick={() => navigate('/decisions/new')}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 text-sm font-medium transition-colors shadow-sm shadow-indigo-600/20"
          >
            <IconPlus size={18} stroke={2} />
            <span>Create Decision</span>
          </button>
        </motion.div>

        {statsError && (
          <motion.div variants={itemVariants} className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">{statsError}</motion.div>
        )}

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="My Decisions"
            value={loadingStats ? '—' : stats.total}
            icon={IconClipboard}
            index={0}
            subtitle="Total decisions created"
          />
          <StatCard
            label="Pending Reviews"
            value={loadingStats ? '—' : pendingReviews}
            icon={IconClock}
            index={1}
            subtitle="Awaiting review"
          />
          <StatCard
            label="Recent Activity"
            value={loadingStats ? '—' : recentActivity}
            icon={IconActivity}
            index={2}
            subtitle="Drafts + under review"
          />
        </motion.div>

        {/* Recent decisions */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              My Decisions
            </h2>
            <button
              onClick={() => navigate('/decisions')}
              className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              View All
            </button>
          </div>

          {decisionsError && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400 mb-4">{decisionsError}</div>
        )}

        {recentDecisions.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                  <IconFileText size={24} stroke={1.5} className="text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    No decisions yet
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    Create your first decision to get started with the platform.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800/60">
              {recentDecisions.map((d) => (
                <button
                  key={d.id}
                  onClick={() => navigate(`/decisions/${d.id}`)}
                  className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors text-left group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {d.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {d.category?.name} · {formatDate(d.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <StatusBadge status={d.status} />
                    <IconChevronRight size={16} className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
