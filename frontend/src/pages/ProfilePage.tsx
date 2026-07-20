import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usersApi } from '../api/users';
import Card from '../components/common/Card';
import Input from '../components/common/Input';
import Button from '../components/common/Button';
import Badge from '../components/common/Badge';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  
  const [username, setUsername] = useState(user?.username || '');
  const [email, setEmail] = useState(user?.email || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; error: boolean } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passLoading, setPassLoading] = useState(false);
  const [passMsg, setPassMsg] = useState<{ text: string; error: boolean } | null>(null);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMsg(null);
    if (!username.trim() || !email.trim()) return;

    setProfileLoading(true);
    try {
      const updated = await usersApi.updateMe({
        username: username.trim(),
        email: email.trim(),
      });
      updateUser(updated);
      setProfileMsg({ text: 'Profile updated successfully!', error: false });
    } catch (err: any) {
      setProfileMsg({
        text: err.response?.data?.detail || 'Failed to update profile.',
        error: true,
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPassMsg(null);

    if (newPassword !== confirmPassword) {
      setPassMsg({ text: 'New passwords do not match.', error: true });
      return;
    }

    setPassLoading(true);
    try {
      await usersApi.updatePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setPassMsg({ text: 'Password changed successfully!', error: false });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPassMsg({
        text: err.response?.data?.detail || 'Failed to change password. Double check current password.',
        error: true,
      });
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="section-spacing max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-border pb-6">
        <h1 className="text-3xl font-bold tracking-tight text-text">Profile</h1>
        <p className="text-sm text-text-secondary mt-1">
          Manage your profile configurations or update security credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
        {/* Profile Settings Card */}
        <Card className="border border-border/80 bg-surface-elevated/20">
          <h3 className="text-base font-bold text-text mb-4 border-b border-border/40 pb-2">
            Profile Settings
          </h3>

          {profileMsg && (
            <div
              className={`mb-4 rounded px-3 py-2 text-center text-xs font-semibold ${
                profileMsg.error
                  ? 'bg-error-bg/25 text-error border border-error/15'
                  : 'bg-success-bg/25 text-success border border-success/15'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Input
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />

            <div className="w-full flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-text-secondary uppercase">
                Account Role
              </label>
              <div className="pt-0.5">
                <Badge variant="secondary">{user?.role || 'Employee'}</Badge>
              </div>
            </div>

            <Button type="submit" variant="primary" loading={profileLoading} className="w-full">
              Update Profile
            </Button>
          </form>
        </Card>

        {/* Change Password Card */}
        <Card className="border border-border/80 bg-surface-elevated/20">
          <h3 className="text-base font-bold text-text mb-4 border-b border-border/40 pb-2">
            Security
          </h3>

          {passMsg && (
            <div
              className={`mb-4 rounded px-3 py-2 text-center text-xs font-semibold ${
                passMsg.error
                  ? 'bg-error-bg/25 text-error border border-error/15'
                  : 'bg-success-bg/25 text-success border border-success/15'
              }`}
            >
              {passMsg.text}
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Button type="submit" variant="primary" loading={passLoading} className="w-full">
              Change Password
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ProfilePage;
