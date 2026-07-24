import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import {
  IconHome,
  IconFileText,
  IconMessageCircle,
  IconUser,
  IconMessage,
} from '@tabler/icons-react';

const sidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/employee' },
  { label: 'My Decisions', icon: IconFileText, path: '/decisions' },
  { label: 'Discussions', icon: IconMessageCircle, path: '/dashboard/employee/discussions' },
  { label: 'Profile', icon: IconUser, path: '/profile' },
];

export default function EmployeeDiscussions() {
  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <IconMessage size={48} className="text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Discussions</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md">
          The discussions module is coming soon. You will be able to collaborate with your team and discuss decision alternatives here.
        </p>
      </div>
    </DashboardLayout>
  );
}