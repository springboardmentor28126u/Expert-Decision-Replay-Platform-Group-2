import { cn } from '../../lib/utils';

const statusConfig = {
  draft: {
    label: 'Draft',
    className: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
  under_review: {
    label: 'Under review',
    className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
  },
  approved: {
    label: 'Approved',
    className: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  },
  rejected: {
    label: 'Rejected',
    className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  },
  archived: {
    label: 'Archived',
    className: 'bg-slate-100 text-slate-600 dark:bg-slate-800/40 dark:text-slate-400',
  },
};

export function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.draft;

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
        config.className
      )}
    >
      {config.label}
    </span>
  );
}
