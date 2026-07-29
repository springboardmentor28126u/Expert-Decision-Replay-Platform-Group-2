import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { StatCard } from '../components/dashboard/StatCard';
import { userService } from '../services/userService';
import { decisionService } from '../services/decisionService';
import {
  IconUsers,
  IconClipboard,
  IconReport,
  IconHome,
  IconUserCog,
  IconUsersGroup,
  IconFileSpreadsheet,
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
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/admin' },
  { label: 'Users', icon: IconUserCog, path: '/dashboard/admin/users' },
  { label: 'Groups', icon: IconUsersGroup, path: '/dashboard/admin/groups' },
  { label: 'Requests', icon: IconUsers, path: '/dashboard/admin/requests' },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, activeDecisions: 0, orgReports: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      setError('');
      try {
        const [usersData, decStats] = await Promise.all([
          userService.getUsers({ page: 1, limit: 1 }),
          decisionService.getStats().catch(() => null),
        ]);
        setStats({
          totalUsers: usersData.total,
          activeDecisions: decStats?.total || 0,
          orgReports: 0,
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
            System Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Platform-wide statistics and recent activity.
          </p>
        </motion.div>

        {error && (
          <motion.div variants={itemVariants} className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </motion.div>
        )}

        {/* Stats */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Total Users"
            value={stats.totalUsers}
            icon={IconUsers}
            loading={loading}
            index={0}
            subtitle="Registered accounts"
          />
          <StatCard
            label="Active Decisions"
            value={stats.activeDecisions}
            icon={IconClipboard}
            loading={loading}
            index={1}
            subtitle="Currently in workflow"
          />
          <StatCard
            label="Org Reports"
            value={stats.orgReports}
            icon={IconReport}
            loading={loading}
            index={2}
            subtitle="Coming soon"
          />
        </motion.div>

        {/* Recent activity placeholder */}
        <motion.div variants={itemVariants} className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 overflow-hidden shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
          </div>
          <div className="px-5 py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <IconFileSpreadsheet size={24} stroke={1.5} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  No activity yet
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  System activity and audit logs will appear here as users interact with the platform.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </DashboardLayout>
  );
}
