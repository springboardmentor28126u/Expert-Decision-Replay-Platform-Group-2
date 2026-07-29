import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { groupService, type AvailableGroup, type GroupJoinRequest } from '../services/groupService';
import {
  IconAlertCircle,
  IconCheck,
  IconFileText,
  IconHome,
  IconMessageCircle,
  IconPlus,
  IconUser,
  IconUsers,
  IconX,
} from '@tabler/icons-react';

const sidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/employee' },
  { label: 'My Decisions', icon: IconFileText, path: '/decisions' },
  { label: 'Groups', icon: IconUsers, path: '/dashboard/employee/groups' },
  { label: 'Discussions', icon: IconMessageCircle, path: '/dashboard/employee/discussions' },
  { label: 'Profile', icon: IconUser, path: '/profile' },
];

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  accepted: 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300',
  rejected: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
};

export default function EmployeeGroups() {
  const navigate = useNavigate();
  const { currentCompanyId, groups, refreshGroups } = useAuth();
  const [tab, setTab] = useState<'available' | 'requests' | 'mine'>('available');
  const [availableGroups, setAvailableGroups] = useState<AvailableGroup[]>([]);
  const [myRequests, setMyRequests] = useState<GroupJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<AvailableGroup | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pendingGroupIds = useMemo(
    () => new Set(myRequests.filter((request) => request.status === 'pending').map((request) => request.group_id)),
    [myRequests]
  );

  const loadData = async () => {
    if (!currentCompanyId) return;
    setLoading(true);
    setError('');
    try {
      const [available, requests] = await Promise.all([
        groupService.available(currentCompanyId),
        groupService.myRequests(),
      ]);
      setAvailableGroups(available);
      setMyRequests(requests);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentCompanyId]);

  const submitRequest = async () => {
    if (!selectedGroup) return;
    setSubmitting(true);
    setError('');
    try {
      const request = await groupService.requestToJoin(selectedGroup.id, message.trim() || undefined);
      setMyRequests((prev) => [request, ...prev]);
      setAvailableGroups((prev) =>
        prev.map((group) =>
          group.id === selectedGroup.id
            ? { ...group, pending_request_id: request.id, pending_request_status: 'pending' }
            : group
        )
      );
      setSelectedGroup(null);
      setMessage('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to send join request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Groups</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Browse groups, send join requests, and track approval status.
            </p>
          </div>
          <button
            onClick={() => navigate('/decisions/new')}
            disabled={groups.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 text-sm font-medium transition-colors shadow-sm shadow-indigo-600/20"
          >
            <IconPlus size={18} />
            Create Decision
          </button>
        </div>

        <div className="inline-flex rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-1">
          {[
            ['available', 'Available'],
            ['requests', 'My Requests'],
            ['mine', 'My Groups'],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value as typeof tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === value
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 text-sm text-red-700 dark:text-red-300">
            <IconAlertCircle size={18} />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
        ) : tab === 'available' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {availableGroups.length === 0 ? (
              <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 text-center text-sm text-gray-500">
                No available groups right now.
              </div>
            ) : (
              availableGroups.map((group) => {
                const isPending = pendingGroupIds.has(group.id) || group.pending_request_status === 'pending';
                return (
                  <div key={group.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h2 className="text-base font-semibold text-gray-900 dark:text-white">{group.name}</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {group.description || 'No description provided.'}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                        {group.member_count} member{group.member_count === 1 ? '' : 's'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className="h-9 w-9 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-sm font-bold">
                          {group.owner.avatar_initial}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{group.owner.full_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Group owner</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedGroup(group)}
                        disabled={isPending}
                        className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-200 disabled:text-gray-500 dark:disabled:bg-gray-800 dark:disabled:text-gray-500 text-white px-4 py-2 text-sm font-medium transition-colors"
                      >
                        {isPending ? <IconCheck size={16} /> : <IconPlus size={16} />}
                        {isPending ? 'Request Pending' : 'Request to Join'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : tab === 'requests' ? (
          <div className="space-y-3">
            {myRequests.length === 0 ? (
              <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 text-center text-sm text-gray-500">
                No requests yet.
              </div>
            ) : (
              myRequests.map((request) => (
                <div key={request.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{request.group_name}</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Owner: {request.owner_name}
                    </p>
                    {request.message && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">{request.message}</p>
                    )}
                  </div>
                  <span className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusStyles[request.status]}`}>
                    {request.status}
                  </span>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {groups.length === 0 ? (
              <div className="lg:col-span-2 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-10 text-center text-sm text-gray-500">
                You are not an active member of any group yet.
              </div>
            ) : (
              groups.map((group) => (
                <div key={group.id} className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                  <h2 className="text-base font-semibold text-gray-900 dark:text-white">{group.name}</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {group.description || 'Active group membership'}
                  </p>
                </div>
              ))
            )}
            <button
              onClick={refreshGroups}
              className="lg:col-span-2 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline justify-self-start"
            >
              Refresh my groups
            </button>
          </div>
        )}

        {selectedGroup && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 shadow-2xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Request to Join</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{selectedGroup.name}</p>
                </div>
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <IconX size={18} />
                </button>
              </div>
              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Optional message"
                className="mt-4 w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 px-4 py-3 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
              <div className="mt-5 flex justify-end gap-3">
                <button
                  onClick={() => setSelectedGroup(null)}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={submitRequest}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 text-sm font-medium"
                >
                  {submitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
