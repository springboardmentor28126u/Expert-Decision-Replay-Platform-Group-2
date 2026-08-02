import React from 'react';
import { AuditLog } from '../../types';
import Badge from '../common/Badge';

interface AuditTableProps {
  logs: AuditLog[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onPageSizeChange: (newPageSize: number) => void;
  onViewDetails: (log: AuditLog) => void;
}

const getActionVariant = (action: string): 'approved' | 'rejected' | 'under-review' | 'primary' | 'secondary' => {
  const act = action.toUpperCase();
  if (
    act.includes('CREATED') ||
    act.includes('APPROVED') ||
    act.includes('SUCCESS') ||
    act.includes('ADDED') ||
    act.includes('UPLOADED')
  ) {
    return 'approved'; // Green
  }
  if (act.includes('FAILED') || act.includes('DELETED') || act.includes('REJECTED')) {
    return 'rejected'; // Red
  }
  if (act.includes('SUBMITTED') || act.includes('STARTED') || act.includes('REPLAY')) {
    return 'under-review'; // Amber
  }
  if (act.includes('UPDATED') || act.includes('CHANGED') || act.includes('ROLE')) {
    return 'primary'; // Blue
  }
  return 'secondary';
};

const AuditTable: React.FC<AuditTableProps> = ({
  logs,
  total,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onViewDetails,
}) => {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startItem = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = Math.min(page * pageSize, total);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      {/* Table Container */}
      <div className="w-full min-w-0 overflow-x-auto rounded-lg border border-border bg-surface-elevated/40 shadow-sm">
        <table className="w-full min-w-[650px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-surface-elevated/80 text-text-secondary">
              <th className="px-6 py-4 font-semibold uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider">User</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider">Action</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider">Entity</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider">Description</th>
              <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-text-secondary">
                  No audit logs found matching your criteria.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-surface-hover/40 transition-all">
                  {/* Timestamp */}
                  <td className="px-6 py-4 text-xs font-mono text-text-secondary whitespace-nowrap">
                    {formatDate(log.created_at)}
                  </td>

                  {/* User */}
                  <td className="px-6 py-4">
                    {log.user ? (
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary-light uppercase border border-primary/20">
                          {log.user.username.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-text text-xs">{log.user.username}</p>
                          <p className="text-[11px] text-text-secondary">{log.user.email}</p>
                        </div>
                      </div>
                    ) : log.user_id ? (
                      <span className="text-xs text-text-secondary font-mono">User #{log.user_id}</span>
                    ) : (
                      <span className="text-xs italic text-text-muted">System / Anonymous</span>
                    )}
                  </td>

                  {/* Action */}
                  <td className="px-6 py-4">
                    <Badge variant={getActionVariant(log.action)}>
                      {log.action}
                    </Badge>
                  </td>

                  {/* Entity */}
                  <td className="px-6 py-4">
                    {log.entity_type ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-text bg-surface/60 border border-border px-2.5 py-0.5 rounded">
                        {log.entity_type} {log.entity_id ? `#${log.entity_id}` : ''}
                      </span>
                    ) : (
                      <span className="text-xs text-text-muted">-</span>
                    )}
                  </td>

                  {/* Description */}
                  <td className="px-6 py-4 max-w-xs truncate text-xs text-text-secondary" title={log.description || ''}>
                    {log.description || log.endpoint || '-'}
                  </td>

                  {/* Details Button */}
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    <button
                      onClick={() => onViewDetails(log)}
                      className="text-xs font-semibold text-primary-light hover:underline hover:text-primary transition-all"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-2 text-xs text-text-secondary">
        <div className="flex items-center gap-4">
          <span>
            Showing <strong className="text-text">{startItem}</strong> to{' '}
            <strong className="text-text">{endItem}</strong> of{' '}
            <strong className="text-text">{total}</strong> records
          </span>

          <div className="flex items-center gap-2">
            <span>Per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="bg-surface border border-border text-text rounded px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>

        {/* Pagination Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="btn btn-secondary btn-sm"
          >
            Previous
          </button>

          <span className="px-2 font-medium text-text">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="btn btn-secondary btn-sm"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuditTable;
