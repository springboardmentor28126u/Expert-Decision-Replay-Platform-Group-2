import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { ConfirmModal } from '../components/dashboard/ConfirmModal';
import { useToast } from '../hooks/use-toast';
import { groupService, type AdminGroupDetailResponse, type AdminGroupListItem } from '../services/groupService';
import {
  IconHome,
  IconPlus,
  IconUserCog,
  IconUsers,
  IconUsersGroup,
} from '@tabler/icons-react';

const sidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/admin' },
  { label: 'Users', icon: IconUserCog, path: '/dashboard/admin/users' },
  { label: 'Groups', icon: IconUsersGroup, path: '/dashboard/admin/groups' },
  { label: 'Requests', icon: IconUsers, path: '/dashboard/admin/requests' },
];

const byName = (a: AdminGroupListItem, b: AdminGroupListItem) => a.name.localeCompare(b.name);

export default function AdminGroups() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [groups, setGroups] = useState<AdminGroupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createDepartment, setCreateDepartment] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminGroupDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState('');

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editDepartment, setEditDepartment] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const [confirmDeactivateOpen, setConfirmDeactivateOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const activeGroup = useMemo(() => groups.find((g) => g.id === activeGroupId) || null, [groups, activeGroupId]);

  const loadGroups = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await groupService.adminGroups();
      setGroups(data.sort(byName));
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const openDetail = async (groupId: string) => {
    setActiveGroupId(groupId);
    setDetail(null);
    setDetailError('');
    setEditing(false);
    setSaveError('');
    setDetailLoading(true);
    try {
      const d = await groupService.getAdminGroup(groupId);
      setDetail(d);
      setEditName(d.name);
      setEditDescription(d.description || '');
      setEditDepartment(d.department || '');
    } catch (err: any) {
      setDetailError(err.response?.data?.detail || 'Failed to load group');
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setActiveGroupId(null);
    setDetail(null);
    setDetailError('');
    setEditing(false);
    setSaveError('');
  };

  const handleCreate = async () => {
    if (!createName.trim()) {
      setCreateError('Name is required');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      const created = await groupService.createAdminGroup({
        name: createName,
        description: createDescription.trim() ? createDescription : null,
        department: createDepartment.trim() ? createDepartment : null,
      });
      setGroups((prev) => [...prev, created].sort(byName));
      setShowCreate(false);
      setCreateName('');
      setCreateDescription('');
      setCreateDepartment('');
      toast({ title: 'Group created', description: created.name });
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const handleSave = async () => {
    if (!activeGroupId || !detail) return;
    if (!editName.trim()) {
      setSaveError('Name is required');
      return;
    }
    setSaving(true);
    setSaveError('');
    try {
      const updated = await groupService.updateAdminGroup(activeGroupId, {
        name: editName,
        description: editDescription.trim() ? editDescription : null,
        department: editDepartment.trim() ? editDepartment : null,
      });
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? { ...g, ...updated } : g)).sort(byName));
      setDetail((prev) => (prev ? { ...prev, ...updated } : prev));
      setEditing(false);
      toast({ title: 'Group updated', description: updated.name });
    } catch (err: any) {
      setSaveError(err.response?.data?.detail || 'Failed to update group');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!activeGroupId) return;
    setDeactivating(true);
    setDetailError('');
    try {
      const updated = await groupService.deactivateAdminGroup(activeGroupId);
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? { ...g, ...updated } : g)).sort(byName));
      setDetail((prev) => (prev ? { ...prev, ...updated } : prev));
      toast({ title: 'Group deactivated', description: updated.name });
    } catch (err: any) {
      setDetailError(err.response?.data?.detail || 'Failed to deactivate group');
    } finally {
      setDeactivating(false);
      setConfirmDeactivateOpen(false);
    }
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Groups</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{groups.length} total</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <IconPlus size={16} /> Create Group
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
            {error}
          </div>
        )}

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="text-left px-5 py-3 font-medium">Name</th>
                  <th className="text-left px-5 py-3 font-medium">Department</th>
                  <th className="text-left px-5 py-3 font-medium">Members</th>
                  <th className="text-left px-5 py-3 font-medium">Requests</th>
                  <th className="text-left px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : groups.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-gray-500 dark:text-gray-400">
                      No groups yet
                    </td>
                  </tr>
                ) : (
                  groups.map((group) => (
                    <tr
                      key={group.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/30 cursor-pointer"
                      onClick={() => openDetail(group.id)}
                    >
                      <td className="px-5 py-4">
                        <div className="font-medium text-gray-900 dark:text-white">{group.name}</div>
                        {group.description ? (
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{group.description}</div>
                        ) : null}
                      </td>
                      <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{group.department || '—'}</td>
                      <td className="px-5 py-4 text-gray-700 dark:text-gray-300">{group.member_count}</td>
                      <td className="px-5 py-4">
                        {group.pending_request_count > 0 ? (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/dashboard/admin/requests?status=pending&group_id=${group.id}`);
                            }}
                            className="inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 px-2.5 py-1 text-xs font-medium"
                          >
                            {group.pending_request_count} pending
                          </button>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400">0</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {group.is_active ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 px-2.5 py-1 text-xs font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200 px-2.5 py-1 text-xs font-medium">
                            Inactive
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showCreate && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full pointer-events-auto space-y-4"
                onClick={(e) => e.stopPropagation()}
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create Group</h2>
                {createError && <p className="text-sm text-red-600">{createError}</p>}
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Name"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <input
                  type="text"
                  value={createDepartment}
                  onChange={(e) => setCreateDepartment(e.target.value)}
                  placeholder="Department (optional)"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="Description (optional)"
                  rows={4}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowCreate(false)}
                    className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                  >
                    {creating ? 'Creating...' : 'Create'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {activeGroupId && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={closeDetail} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-3xl w-full pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                      {detail?.name || activeGroup?.name || 'Group'}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Members: {detail?.member_count ?? activeGroup?.member_count ?? 0} · Pending requests:{' '}
                      {detail?.pending_request_count ?? activeGroup?.pending_request_count ?? 0}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {detail?.pending_request_count ? (
                      <button
                        onClick={() => navigate(`/dashboard/admin/requests?status=pending&group_id=${activeGroupId}`)}
                        className="px-3 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium transition-colors"
                      >
                        View Requests
                      </button>
                    ) : null}
                    <button
                      onClick={closeDetail}
                      className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      Close
                    </button>
                  </div>
                </div>

                {(detailError || saveError) && (
                  <div className="mt-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">
                    {detailError || saveError}
                  </div>
                )}

                <div className="mt-6 space-y-6">
                  {detailLoading ? (
                    <div className="text-sm text-gray-500 dark:text-gray-400">Loading group details...</div>
                  ) : detail ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Name</div>
                          {editing ? (
                            <input
                              type="text"
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                          ) : (
                            <div className="text-sm text-gray-900 dark:text-white">{detail.name}</div>
                          )}
                        </div>
                        <div className="md:col-span-1">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Department</div>
                          {editing ? (
                            <input
                              type="text"
                              value={editDepartment}
                              onChange={(e) => setEditDepartment(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                          ) : (
                            <div className="text-sm text-gray-900 dark:text-white">{detail.department || '—'}</div>
                          )}
                        </div>
                        <div className="md:col-span-1">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Status</div>
                          <div className="text-sm text-gray-900 dark:text-white">{detail.is_active ? 'Active' : 'Inactive'}</div>
                        </div>
                        <div className="md:col-span-3">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Description</div>
                          {editing ? (
                            <textarea
                              rows={3}
                              value={editDescription}
                              onChange={(e) => setEditDescription(e.target.value)}
                              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                          ) : (
                            <div className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">{detail.description || '—'}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Members</div>
                        <div className="flex items-center gap-2">
                          {editing ? (
                            <>
                              <button
                                onClick={() => {
                                  setEditing(false);
                                  setSaveError('');
                                  setEditName(detail.name);
                                  setEditDescription(detail.description || '');
                                  setEditDepartment(detail.department || '');
                                }}
                                disabled={saving}
                                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                              >
                                {saving ? 'Saving...' : 'Save'}
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => setEditing(true)}
                                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                              >
                                Edit
                              </button>
                              {detail.is_active ? (
                                <button
                                  onClick={() => setConfirmDeactivateOpen(true)}
                                  disabled={deactivating}
                                  className="px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-medium transition-colors disabled:opacity-50"
                                >
                                  {deactivating ? 'Deactivating...' : 'Deactivate'}
                                </button>
                              ) : null}
                            </>
                          )}
                        </div>
                      </div>

                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-300">
                            <tr>
                              <th className="text-left px-4 py-2 font-medium">Name</th>
                              <th className="text-left px-4 py-2 font-medium">Email</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {detail.members.length === 0 ? (
                              <tr>
                                <td colSpan={2} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                  No members
                                </td>
                              </tr>
                            ) : (
                              detail.members.map((m) => (
                                <tr key={m.id}>
                                  <td className="px-4 py-3 text-gray-900 dark:text-white">{m.full_name || '—'}</td>
                                  <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{m.email || '—'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">Pending Requests</div>
                        <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                          <table className="min-w-full text-sm">
                            <thead className="bg-gray-50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-300">
                              <tr>
                                <th className="text-left px-4 py-2 font-medium">Requester</th>
                                <th className="text-left px-4 py-2 font-medium">Message</th>
                                <th className="text-left px-4 py-2 font-medium">Created</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                              {detail.pending_requests.length === 0 ? (
                                <tr>
                                  <td colSpan={3} className="px-4 py-6 text-center text-gray-500 dark:text-gray-400">
                                    No pending requests
                                  </td>
                                </tr>
                              ) : (
                                detail.pending_requests.map((r) => (
                                  <tr key={r.id}>
                                    <td className="px-4 py-3 text-gray-900 dark:text-white">{r.requester_name}</td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">{r.message || '—'}</td>
                                    <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                      {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
          </>
        )}

        <ConfirmModal
          open={confirmDeactivateOpen}
          title="Deactivate group?"
          message="This will prevent new join requests and hide the group from the employee browse list. Existing members and decision history are preserved."
          confirmLabel="Deactivate"
          variant="danger"
          onCancel={() => setConfirmDeactivateOpen(false)}
          onConfirm={handleDeactivate}
        />
      </div>
    </DashboardLayout>
  );
}

