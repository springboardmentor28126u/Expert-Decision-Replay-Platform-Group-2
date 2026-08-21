import { useEffect, useMemo, useState } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { groupService, type GroupJoinRequest } from '../services/groupService';
import { useSearchParams } from 'react-router-dom';
import {
  IconAlertCircle,
  IconCheck,
  IconChecklist,
  IconFileText,
  IconHome,
  IconUserCog,
  IconUsers,
  IconUsersGroup,
  IconX,
} from '@tabler/icons-react';

const adminSidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/admin' },
  { label: 'Users', icon: IconUserCog, path: '/dashboard/admin/users' },
  { label: 'Groups', icon: IconUsersGroup, path: '/dashboard/admin/groups' },
  { label: 'Requests', icon: IconUsers, path: '/dashboard/admin/requests' },
];

const managerSidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/manager' },
  { label: 'Team Decisions', icon: IconFileText, path: '/decisions' },
  { label: 'Approvals', icon: IconChecklist, path: '/dashboard/manager/approvals' },
  { label: 'Requests', icon: IconUsers, path: '/dashboard/manager/requests' },
];

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  accepted: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
};

export default function AdminRequests() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const urlStatus = (searchParams.get('status') || 'pending') as 'pending' | 'accepted' | 'rejected';
  const urlGroupId = searchParams.get('group_id') || undefined;

  const [status, setStatus] = useState<'pending' | 'accepted' | 'rejected'>(urlStatus);
  const [requests, setRequests] = useState<GroupJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const sidebarItems = user?.role === 'admin' ? adminSidebarItems : managerSidebarItems;

  const groupId = useMemo(() => urlGroupId, [urlGroupId]);

  const loadRequests = async () => {
    setLoading(true);
    setError('');
    try {
      setRequests(await groupService.adminRequests(status, groupId));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, groupId]);

  useEffect(() => {
    if (urlStatus !== status) {
      setStatus(urlStatus);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlStatus]);

  const decide = async (request: GroupJoinRequest, decision: 'accept' | 'reject') => {
    if (decision === 'reject' && !window.confirm(`Reject ${request.requester_name}'s request to join ${request.group_name}?`)) {
      return;
    }
    setActingId(request.id);
    setError('');
    try {
      await groupService.decideRequest(request.id, decision);
      setRequests((prev) => prev.filter((item) => item.id !== request.id));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update request');
    } finally {
      setActingId(null);
    }
  };

  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Requests</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Review group join requests for groups you own. Company admins can review all company groups.
          </p>
          {groupId ? (
            <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 px-3 py-2 text-xs text-indigo-700 dark:text-indigo-200">
              Filtered to selected group
              <button
                onClick={() => setSearchParams({ status })}
                className="text-indigo-700 dark:text-indigo-200 underline underline-offset-2"
              >
                Clear
              </button>
            </div>
          ) : null}
        </div>

        <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1">
          {(['pending', 'accepted', 'rejected'] as const).map((value) => (
            <button
              key={value}
              onClick={() => {
                setStatus(value);
                const next: Record<string, string> = { status: value };
                if (groupId) next.group_id = groupId;
                setSearchParams(next);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${
                status === value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {value}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
            <IconAlertCircle size={18} />
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="grid grid-cols-12 gap-3 border-b border-gray-100 dark:border-gray-800 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
            <div className="col-span-4">Employee</div>
            <div className="col-span-3">Group</div>
            <div className="col-span-3">Message</div>
            <div className="col-span-2 text-right">Action</div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="px-5 py-14 text-center text-sm text-gray-500">
              No {status} requests.
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {requests.map((request) => (
                <div key={request.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 px-5 py-4 items-center">
                  <div className="md:col-span-4 flex items-center gap-3">
                    <span className="h-10 w-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm font-bold">
                      {request.requester_initial}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{request.requester_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(request.created_at)}</p>
                    </div>
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{request.group_name}</p>
                    <span className={`mt-1 inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${statusStyles[request.status]}`}>
                      {request.status}
                    </span>
                  </div>
                  <div className="md:col-span-3 text-sm text-gray-600 dark:text-gray-300">
                    {request.message || 'No message'}
                  </div>
                  <div className="md:col-span-2 flex justify-start md:justify-end gap-2">
                    {request.status === 'pending' ? (
                      <>
                        <button
                          onClick={() => decide(request, 'accept')}
                          disabled={actingId === request.id}
                          className="inline-flex items-center gap-1 rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 px-3 py-2 text-xs font-semibold text-white"
                        >
                          <IconCheck size={14} />
                          Accept
                        </button>
                        <button
                          onClick={() => decide(request, 'reject')}
                          disabled={actingId === request.id}
                          className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-800 px-3 py-2 text-xs font-semibold text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <IconX size={14} />
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Decided {request.decided_at ? formatDate(request.decided_at) : ''}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
