import React, { useState, useEffect, useCallback } from 'react';
import { auditApi } from '../api/audit';
import { usersApi } from '../api/users';
import { AuditLog, User, AuditLogFilterParams } from '../types';
import AuditFilters from '../components/audit/AuditFilters';
import AuditTable from '../components/audit/AuditTable';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  
  const [users, setUsers] = useState<User[]>([]);


  const [search, setSearch] = useState('');
  const [action, setAction] = useState('');
  const [userId, setUserId] = useState('');
  const [entityType, setEntityType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');

  
  const [appliedFilters, setAppliedFilters] = useState<{
    search: string;
    action: string;
    userId: string;
    entityType: string;
    startDate: string;
    endDate: string;
    sortOrder: 'desc' | 'asc';
  }>({
    search: '',
    action: '',
    userId: '',
    entityType: '',
    startDate: '',
    endDate: '',
    sortOrder: 'desc',
  });

  // Modal detail view state
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch users for filter
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const uList = await usersApi.listUsers();
        setUsers(uList);
      } catch (err) {
        console.error('Failed to fetch user list for audit filters', err);
      }
    };
    fetchUsers();
  }, []);

  // Fetch audit logs
  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: AuditLogFilterParams = {
        page,
        page_size: pageSize,
        sort_order: appliedFilters.sortOrder,
      };

      if (appliedFilters.search.trim()) params.search = appliedFilters.search.trim();
      if (appliedFilters.action) params.action = appliedFilters.action;
      if (appliedFilters.userId) params.user_id = Number(appliedFilters.userId);
      if (appliedFilters.entityType) params.entity_type = appliedFilters.entityType;
      if (appliedFilters.startDate) {
        params.start_date = new Date(`${appliedFilters.startDate}T00:00:00`).toISOString();
      }
      if (appliedFilters.endDate) {
        params.end_date = new Date(`${appliedFilters.endDate}T23:59:59`).toISOString();
      }

      const response = await auditApi.listLogs(params);
      setLogs(response.items || []);
      setTotal(response.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, appliedFilters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  
  const handleFilterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1); 
    setAppliedFilters({
      search,
      action,
      userId,
      entityType,
      startDate,
      endDate,
      sortOrder,
    });
  };

  const handleResetFilters = () => {
    setSearch('');
    setAction('');
    setUserId('');
    setEntityType('');
    setStartDate('');
    setEndDate('');
    setSortOrder('desc');
    setPage(1);
    setAppliedFilters({
      search: '',
      action: '',
      userId: '',
      entityType: '',
      startDate: '',
      endDate: '',
      sortOrder: 'desc',
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  };

  const handleViewDetails = (log: AuditLog) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  
  const handleExportCSV = async () => {
    try {
      const params: AuditLogFilterParams = {
        page: 1,
        page_size: 1000,
        sort_order: appliedFilters.sortOrder,
      };

      if (appliedFilters.search.trim()) params.search = appliedFilters.search.trim();
      if (appliedFilters.action) params.action = appliedFilters.action;
      if (appliedFilters.userId) params.user_id = Number(appliedFilters.userId);
      if (appliedFilters.entityType) params.entity_type = appliedFilters.entityType;
      if (appliedFilters.startDate) {
        params.start_date = new Date(`${appliedFilters.startDate}T00:00:00`).toISOString();
      }
      if (appliedFilters.endDate) {
        params.end_date = new Date(`${appliedFilters.endDate}T23:59:59`).toISOString();
      }

      const exportData = await auditApi.listLogs(params);
      const itemsToExport = exportData.items || logs;

      const headers = [
        'ID',
        'Timestamp',
        'User',
        'Role',
        'Action',
        'Entity Type',
        'Entity ID',
        'Description',
        'Endpoint',
        'HTTP Method',
        'Status Code',
        'IP Address',
      ];

      const escapeCSV = (val: any) => {
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      };

      const rows = itemsToExport.map((log) => [
        log.id,
        log.created_at ? new Date(log.created_at).toLocaleString() : '',
        escapeCSV(log.user ? log.user.username : log.user_id ? `User #${log.user_id}` : 'System'),
        escapeCSV(log.user?.role || 'N/A'),
        escapeCSV(log.action),
        escapeCSV(log.entity_type || ''),
        log.entity_id || '',
        escapeCSV(log.description || ''),
        escapeCSV(log.endpoint || ''),
        log.http_method || '',
        log.response_status || '',
        log.ip_address || '',
      ]);

      const csvString = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_export_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Failed to export audit logs:', err);
      const msg = err.response?.data?.detail || err.message || 'Unknown error';
      alert(`Failed to export audit logs to CSV: ${typeof msg === 'string' ? msg : JSON.stringify(msg)}`);
    }
  };

  return (
    <div className="section-spacing w-full min-w-0">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6 w-full min-w-0">
        <div className="space-y-1 min-w-0">
          <h1 className="text-3xl font-bold tracking-tight text-text">Audit Logs</h1>
          <p className="text-sm text-text-secondary">
            Monitor authentication, decision workflows, collaboration, and administrative actions across the platform.
          </p>
        </div>
        <Button variant="secondary" onClick={handleExportCSV} className="h-10 shrink-0 gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
            />
          </svg>
          Export CSV
        </Button>
      </div>

      {/* Filter Section */}
      <AuditFilters
        users={users}
        search={search}
        action={action}
        userId={userId}
        entityType={entityType}
        startDate={startDate}
        endDate={endDate}
        sortOrder={sortOrder}
        onSearchChange={setSearch}
        onActionChange={setAction}
        onUserChange={setUserId}
        onEntityTypeChange={setEntityType}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onSortOrderChange={setSortOrder}
        onReset={handleResetFilters}
        onSubmit={handleFilterSubmit}
      />

      {/* Error display */}
      {error && (
        <div className="rounded-lg bg-error-bg/20 border border-error/25 p-3.5 text-center text-sm text-error font-medium">
          {error}
        </div>
      )}

      {/* Audit Log Table Component */}
      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <Card className="border border-border/85 p-0 overflow-hidden bg-surface-elevated/20">
          <AuditTable
            logs={logs}
            total={total}
            page={page}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            onViewDetails={handleViewDetails}
          />
        </Card>
      )}

      {/* Modal for Log Details */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedLog(null);
        }}
        title="Audit Record Details"
      >
        {selectedLog && (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-4 border-b border-border/60 pb-3">
              <div>
                <span className="text-xs text-text-muted uppercase font-semibold block">User</span>
                <p className="font-semibold text-text mt-0.5">
                  {selectedLog.user ? selectedLog.user.username : selectedLog.user_id ? `User #${selectedLog.user_id}` : 'System / Anonymous'}
                </p>
                {selectedLog.user?.email && (
                  <p className="text-xs text-text-secondary">{selectedLog.user.email}</p>
                )}
              </div>
              <div>
                <span className="text-xs text-text-muted uppercase font-semibold block">Role</span>
                <p className="font-semibold text-primary-light uppercase text-xs mt-0.5">
                  {selectedLog.user?.role || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-border/60 pb-3">
              <div>
                <span className="text-xs text-text-muted uppercase font-semibold block">Action</span>
                <div className="mt-1">
                  <Badge variant="primary">{selectedLog.action}</Badge>
                </div>
              </div>
              <div>
                <span className="text-xs text-text-muted uppercase font-semibold block">Entity</span>
                <p className="text-text font-medium mt-0.5">
                  {selectedLog.entity_type
                    ? `${selectedLog.entity_type} ${selectedLog.entity_id ? `(#${selectedLog.entity_id})` : ''}`
                    : 'N/A'}
                </p>
              </div>
            </div>

            <div className="border-b border-border/60 pb-3">
              <span className="text-xs text-text-muted uppercase font-semibold block">Description</span>
              <p className="text-text-secondary bg-surface p-3 rounded border border-border mt-1 whitespace-pre-wrap">
                {selectedLog.description || 'No description recorded.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 border-b border-border/60 pb-3">
              <div>
                <span className="text-xs text-text-muted uppercase font-semibold block">Endpoint</span>
                <p className="font-mono text-xs text-text-secondary break-all bg-surface p-2 rounded border border-border mt-1">
                  {selectedLog.endpoint || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-xs text-text-muted uppercase font-semibold block">HTTP Method</span>
                <p className="font-mono text-primary-light font-bold mt-1">
                  {selectedLog.http_method || 'N/A'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <span className="text-xs text-text-muted uppercase font-semibold block">Status Code</span>
                <p className="font-mono text-text font-bold mt-0.5">
                  {selectedLog.response_status || 'N/A'}
                </p>
              </div>
              <div>
                <span className="text-xs text-text-muted uppercase font-semibold block">IP Address</span>
                <p className="font-mono text-text text-xs mt-0.5">{selectedLog.ip_address || 'N/A'}</p>
              </div>
              <div>
                <span className="text-xs text-text-muted uppercase font-semibold block">Timestamp</span>
                <p className="font-mono text-xs text-text mt-0.5">
                  {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AuditLogsPage;
