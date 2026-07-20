import React, { useState, useEffect } from 'react';
import { usersApi } from '../api/users';
import { User, UserRole, UserAdminUpdate } from '../types';
import { useAuth } from '../contexts/AuthContext';
import UserTable from '../components/users/UserTable';
import UserForm from '../components/users/UserForm';
import Card from '../components/common/Card';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';

const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.listUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleEditClick = (user: User) => {
    setEditingUser(user);
    setIsModalOpen(true);
  };

  const handleEditSubmit = async (formData: UserAdminUpdate) => {
    if (!editingUser) return;
    setFormLoading(true);
    try {
      await usersApi.updateUser(editingUser.id, formData);
      setIsModalOpen(false);
      setEditingUser(null);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, role: UserRole) => {
    try {
      await usersApi.updateRole(userId, role);
      await fetchUsers();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update user role.');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (window.confirm('Are you sure you want to delete this user account?')) {
      try {
        await usersApi.deleteUser(userId);
        await fetchUsers();
      } catch (err: any) {
        alert(err.response?.data?.detail || 'Failed to delete user.');
      }
    }
  };

  return (
    <div className="section-spacing">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text">User Management</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage roles, update profiles, or delete user accounts (Admin only).
        </p>
      </div>

      {error && (
        <div className="rounded-lg bg-error-bg/20 border border-error/25 p-3.5 text-center text-sm text-error font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-[40vh] items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <Card className="border border-border/85 p-0 overflow-hidden bg-surface-elevated/20">
          <UserTable
            users={users}
            currentUserId={currentUser?.id}
            onEdit={handleEditClick}
            onRoleChange={handleRoleChange}
            onDelete={handleDeleteUser}
          />
        </Card>
      )}

      {/* Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingUser(null);
        }}
        title="Edit User Account"
      >
        <UserForm
          user={editingUser}
          onSubmit={handleEditSubmit}
          loading={formLoading}
          onCancel={() => {
            setIsModalOpen(false);
            setEditingUser(null);
          }}
        />
      </Modal>
    </div>
  );
};

export default UsersPage;
