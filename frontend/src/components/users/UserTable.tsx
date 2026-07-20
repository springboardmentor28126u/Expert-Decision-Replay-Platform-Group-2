import React from 'react';
import { User, UserRole } from '../../types';
import Badge from '../common/Badge';

interface UserTableProps {
  users: User[];
  currentUserId?: number;
  onEdit: (user: User) => void;
  onRoleChange: (userId: number, role: UserRole) => void;
  onDelete: (userId: number) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  currentUserId,
  onEdit,
  onRoleChange,
  onDelete,
}) => {
  const roles: UserRole[] = ['Employee', 'Reviewer', 'Manager', 'Administrator'];

  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border bg-surface-elevated/40">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-surface-elevated/80 text-text-secondary">
            <th className="px-6 py-4 font-semibold uppercase tracking-wider">User</th>
            <th className="px-6 py-4 font-semibold uppercase tracking-wider">Email</th>
            <th className="px-6 py-4 font-semibold uppercase tracking-wider">Role</th>
            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {users.map((u) => {
            const isSelf = u.id === currentUserId;

            return (
              <tr key={u.id} className="hover:bg-surface-hover/30 transition-all">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary-light uppercase border border-primary/20">
                      {u.username.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-text">
                        {u.username} {isSelf && <span className="text-xs text-primary-light">(You)</span>}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-text-secondary">{u.email}</td>
                <td className="px-6 py-4">
                  {isSelf ? (
                    <Badge variant="primary">{u.role || 'Employee'}</Badge>
                  ) : (
                    <select
                      value={u.role || 'Employee'}
                      onChange={(e) => onRoleChange(u.id, e.target.value as UserRole)}
                      className="bg-surface border border-border text-text text-xs rounded px-2.5 py-1.5 focus:border-primary focus:outline-none"
                    >
                      {roles.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => onEdit(u)}
                      className="text-xs font-semibold text-primary-light hover:underline"
                    >
                      Edit
                    </button>
                    {!isSelf && (
                      <button
                        onClick={() => onDelete(u.id)}
                        className="text-xs font-semibold text-error hover:underline"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default UserTable;
