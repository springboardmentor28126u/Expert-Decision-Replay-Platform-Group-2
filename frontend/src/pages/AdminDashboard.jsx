import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { StatCard } from '../components/dashboard/StatCard';
import { userService } from '../services/userService';
import {
  IconUsers,
  IconClipboard,
  IconReport,
  IconHome,
  IconUserCog,
  IconBuildingCommunity,
  IconFileSpreadsheet,
  IconChartBar,
} from '@tabler/icons-react';

const sidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/admin' },
  { label: 'Users', icon: IconUserCog, path: '/dashboard/admin/users' },
  { label: 'Teams', icon: IconBuildingCommunity, path: '/dashboard/admin/teams' },
  { label: 'Audit Logs', icon: IconFileSpreadsheet, path: '/dashboard/admin/audit' },
  { label: 'Reports', icon: IconChartBar, path: '/dashboard/admin/reports' },
];

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalUsers: 0, activeDecisions: 0, orgReports: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const usersData = await userService.getUsers({ page: 1, limit: 1 });
        setStats({
          totalUsers: usersData.total,
          activeDecisions: 0,
          orgReports: 0,
        });
      } catch (err) {
        console.error('Failed to fetch admin stats:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            System Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Platform-wide statistics and recent activity.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
            subtitle="Decision module coming Week 3"
          />
          <StatCard
            label="Org Reports"
            value={stats.orgReports}
            icon={IconReport}
            loading={loading}
            index={2}
            subtitle="Reports module coming Week 6"
          />
        </div>

        {/* Recent activity placeholder */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Recent Activity
            </h2>
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-full px-2.5 py-1">
              Audit logs coming Week 5
            </span>
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
        </div>
      </div>
    </DashboardLayout>
  );
}
