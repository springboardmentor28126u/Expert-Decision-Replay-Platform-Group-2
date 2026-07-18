import { StatusBadge } from './StatusBadge';

export function ActivityRow({ title, submitter, team, timestamp, status }) {
  const formattedTime = new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
          {submitter}
          {team && <span className="mx-1">·</span>}
          {team && <span>{team}</span>}
          <span className="mx-1">·</span>
          <span>{formattedTime}</span>
        </p>
      </div>
      <div className="ml-4 flex-shrink-0">
        <StatusBadge status={status} />
      </div>
    </div>
  );
}
