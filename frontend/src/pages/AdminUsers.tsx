import { useState, useEffect } from 'react';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { userService } from '../services/userService';
import type { User } from '../types/user';
import {
  IconHome,
  IconUserCog,
  IconUsers,
  IconUsersGroup,
  IconSearch,
  IconPlus,
  IconTrash,
  IconEdit,
  IconChevronLeft,
  IconChevronRight,
} from '@tabler/icons-react';

const sidebarItems = [
  { label: 'Dashboard', icon: IconHome, path: '/dashboard/admin' },
  { label: 'Users', icon: IconUserCog, path: '/dashboard/admin/users' },
  { label: 'Groups', icon: IconUsersGroup, path: '/dashboard/admin/groups' },
  { label: 'Requests', icon: IconUsers, path: '/dashboard/admin/requests' },
];

const roleColors: Record<string, string> = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  reviewer: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  employee: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export default function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState('');
  const [createEmail, setCreateEmail] = useState('');
  const [createPassword, setCreatePassword] = useState('');
  const [createRole, setCreateRole] = useState('employee');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editRole, setEditRole] = useState('');
  const [savingRole, setSavingRole] = useState(false);
  const [editError, setEditError] = useState('');

  const limit = 10;

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await userService.getUsers({ page, limit, search: search || undefined });
      setUsers(data.items);
      setTotal(data.total);
      setPage(data.page);
      setPages(data.pages);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load users');
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const handleCreate = async () => {
    if (!createName || !createEmail || !createPassword) {
      setCreateError('All fields are required');
      return;
    }
    setCreating(true);
    setCreateError('');
    try {
      await userService.createUser({ full_name: createName, email: createEmail, password: createPassword, role: createRole });
      setShowCreate(false);
      setCreateName('');
      setCreateEmail('');
      setCreatePassword('');
      setCreateRole('employee');
      fetchUsers();
    } catch (err: any) {
      setCreateError(err.response?.data?.detail || 'Failed to create user');
    }
    setCreating(false);
  };

  const handleRoleChange = async () => {
    if (!editingUser || !editRole) return;
    setSavingRole(true);
    setEditError('');
    try {
      await userService.assignRole(editingUser.id, editRole);
      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      setEditError(err.response?.data?.detail || 'Failed to update role');
    }
    setSavingRole(false);
  };

  const handleDelete = async (userId: string) => {
    if (!window.confirm('Deactivate this user? They will no longer be able to log in.')) return;
    try {
      await userService.deleteUser(userId);
      fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to deactivate user');
    }
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Users</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">{total} total users</p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors"
          >
            <IconPlus size={16} /> Create User
          </button>
        </div>

        {error && (
          <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400">{error}</div>
        )}

        {/* Search */}
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <IconSearch size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <button type="submit" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition-colors">Search</button>
        </form>

        {/* Create User Modal */}
        {showCreate && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setShowCreate(false)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-md w-full pointer-events-auto space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Create User</h2>
                {createError && <p className="text-sm text-red-600">{createError}</p>}
                <input type="text" value={createName} onChange={(e) => setCreateName(e.target.value)} placeholder="Full name"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                <input type="email" value={createEmail} onChange={(e) => setCreateEmail(e.target.value)} placeholder="Email"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                <input type="password" value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} placeholder="Password"
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                <select value={createRole} onChange={(e) => setCreateRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="employee">Employee</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                  <button onClick={handleCreate} disabled={creating} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">{creating ? 'Creating...' : 'Create'}</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Edit Role Modal */}
        {editingUser && (
          <>
            <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" onClick={() => setEditingUser(null)} />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-6 max-w-sm w-full pointer-events-auto space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Change Role — {editingUser.full_name}</h2>
                {editError && <p className="text-sm text-red-600">{editError}</p>}
                <select value={editRole} onChange={(e) => setEditRole(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="reviewer">Reviewer</option>
                  <option value="employee">Employee</option>
                </select>
                <div className="flex items-center justify-end gap-3">
                  <button onClick={() => setEditingUser(null)} className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">Cancel</button>
                  <button onClick={handleRoleChange} disabled={savingRole} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors">{savingRole ? 'Saving...' : 'Save'}</button>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Users List */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" /></div>
        ) : users.length === 0 ? (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-8 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">No users found.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <th className="px-6 py-3 font-medium">Name</th>
                    <th className="px-6 py-3 font-medium">Email</th>
                    <th className="px-6 py-3 font-medium">Role</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{u.full_name}</td>
                      <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{u.email}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${roleColors[u.role || 'employee']}`}>
                          {u.role || 'employee'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${u.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-400'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${u.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {u.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditingUser(u); setEditRole(u.role || 'employee'); setEditError(''); }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                            title="Change role"
                          >
                            <IconEdit size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            title="Deactivate"
                          >
                            <IconTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {pages > 1 && (
              <div className="flex items-center justify-between px-6 py-3 border-t border-gray-100 dark:border-gray-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Page {page} of {pages}</p>
                <div className="flex items-center gap-2">
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"><IconChevronLeft size={16} /></button>
                  <button disabled={page >= pages} onClick={() => setPage(page + 1)} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 disabled:opacity-30 transition-colors"><IconChevronRight size={16} /></button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
