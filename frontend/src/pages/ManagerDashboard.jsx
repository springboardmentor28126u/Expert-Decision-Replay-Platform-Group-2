import { useAuth } from '../hooks/useAuth';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { StatCard } from '../components/dashboard/StatCard';
import {
  IconClipboard,
  IconClock,
  IconCalendar,
  IconHome,
  IconFileText,
  IconChecklist,
  IconChartBar,
} from '@tabler/icons-react';

const sidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/manager' },
  { label: 'Team Decisions', icon: IconFileText, path: '/dashboard/manager/decisions' },
  { label: 'Approvals', icon: IconChecklist, path: '/dashboard/manager/approvals' },
  { label: 'Reports', icon: IconChartBar, path: '/dashboard/manager/reports' },
];

export default function ManagerDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Team Overview
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            No pending approvals at this time.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            label="Team Decisions"
            value={0}
            icon={IconClipboard}
            index={0}
            subtitle="Across your team"
          />
          <StatCard
            label="Pending Approvals"
            value={0}
            icon={IconClock}
            index={1}
            subtitle="Need your review"
          />
          <StatCard
            label="Avg Turnaround"
            value="—"
            icon={IconCalendar}
            index={2}
            subtitle="Approval cycle time"
          />
        </div>

        {/* Approvals placeholder */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800/60 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">
              Pending Approvals
            </h2>
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 rounded-full px-2.5 py-1">
              Coming in Week 5
            </span>
          </div>
          <div className="px-5 py-12 text-center">
            <div className="flex flex-col items-center gap-3">
              <div className="h-12 w-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <IconChecklist size={24} stroke={1.5} className="text-gray-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  No pending approvals
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Approval workflows will appear here once the decision module is active.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
