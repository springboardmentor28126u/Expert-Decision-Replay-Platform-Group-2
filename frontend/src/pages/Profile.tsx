import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { DashboardLayout } from '../components/dashboard/DashboardLayout';
import { userService } from '../services/userService';
import { authService } from '../services/authService';
import { decisionService } from '../services/decisionService';
import {
  IconUser,
  IconMail,
  IconPhone,
  IconBuilding,
  IconBriefcase,
  IconCalendar,
  IconHome,
  IconFileText,
  IconMessageCircle,
  IconUserCog,
  IconBuildingCommunity,
  IconFileSpreadsheet,
  IconChartBar,
  IconUsers,
  IconChecklist,
} from '@tabler/icons-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

const getSidebarItems = (roleName: string = '') => {
  if (roleName === 'admin' || roleName === 'Administrator') {
    return [
      { label: 'Dashboard', icon: IconHome, path: '/dashboard/admin' },
      { label: 'Users', icon: IconUserCog, path: '/dashboard/admin/users' },
      { label: 'Teams', icon: IconBuildingCommunity, path: '/dashboard/admin/teams' },
    ];
  }
  if (roleName === 'manager' || roleName === 'Manager') {
    return [
      { label: 'Dashboard', icon: IconHome, path: '/dashboard/manager' },
      { label: 'Team Decisions', icon: IconUsers, path: '/decisions' },
      { label: 'Pending Approvals', icon: IconChecklist, path: '/dashboard/manager/approvals' },
    ];
  }
  // Default for Employee / Reviewer
  return [
    { label: 'Dashboard', icon: IconHome, path: '/dashboard/employee' },
    { label: 'My Decisions', icon: IconFileText, path: '/decisions' },
    { label: 'Discussions', icon: IconMessageCircle, path: '/dashboard/employee/discussions' },
    { label: 'Profile', icon: IconUser, path: '/profile' },
  ];
};

const roleBadgeStyles: Record<string, string> = {
  Administrator: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Reviewer: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  Employee: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export default function Profile() {
  const { user } = useAuth();
  const roleName = user?.role || 'User';
  const sidebarItems = getSidebarItems(roleName);
  
  const initials = user?.full_name
    ? user.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';
    
  const badgeStyle = roleBadgeStyles[roleName] || roleBadgeStyles.Employee;
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', year: 'numeric', day: 'numeric'
    });
  };

  const [editing, setEditing] = useState(false);
  const [editBio, setEditBio] = useState(user?.profile?.bio || '');
  const [editDesignation, setEditDesignation] = useState(user?.profile?.designation || '');
  const [editDepartment, setEditDepartment] = useState(user?.profile?.department || '');
  const [editPhone, setEditPhone] = useState(user?.profile?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState('');

  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState('');

  const [decisionCount, setDecisionCount] = useState<number | null>(null);
  const [pendingReviewCount, setPendingReviewCount] = useState<number | null>(null);

  useEffect(() => {
    if (roleName === 'Employee' || roleName === 'Reviewer') {
      decisionService.getStats().then((stats) => {
        setDecisionCount(stats.total || 0);
      }).catch(() => {});
      import('../services/approvalService').then(({ approvalService }) => {
        approvalService.getPendingCount().then((res) => {
          setPendingReviewCount(res.total || 0);
        }).catch(() => {});
      });
    }
  }, []);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSavingProfile(true);
    setProfileMsg('');
    try {
      await userService.updateProfile(user.id, {
        bio: editBio,
        designation: editDesignation,
        department: editDepartment,
        phone: editPhone,
      });
      setProfileMsg('Profile updated successfully');
      setEditing(false);
    } catch (err: any) {
      setProfileMsg(err.response?.data?.detail || 'Failed to update profile');
    }
    setSavingProfile(false);
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordMsg('Passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg('New password must be at least 8 characters');
      return;
    }
    setChangingPassword(true);
    setPasswordMsg('');
    try {
      await authService.changePassword(currentPassword, newPassword);
      setPasswordMsg('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordForm(false);
    } catch (err: any) {
      setPasswordMsg(err.response?.data?.detail || 'Failed to change password');
    }
    setChangingPassword(false);
  };

  return (
    <DashboardLayout sidebarItems={sidebarItems}>
      <motion.div 
        className="max-w-4xl mx-auto space-y-6"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Profile Header */}
        <motion.div variants={itemVariants} className="relative rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 overflow-hidden shadow-sm">
          <div className="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="px-6 sm:px-10 pb-8">
            <div className="relative flex justify-between items-end -mt-12 mb-4">
              <div className="h-24 w-24 rounded-full border-4 border-white dark:border-gray-900 bg-white dark:bg-gray-800 flex items-center justify-center overflow-hidden shadow-md">
                {user?.profile?.avatar_url ? (
                  <img src={user.profile.avatar_url} alt={user.full_name} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                    {initials}
                  </div>
                )}
              </div>
              <button
                onClick={() => setEditing(!editing)}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                {user?.full_name}
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${badgeStyle}`}>
                  {roleName}
                </span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2 text-sm">
                <IconMail size={16} />
                {user?.email}
              </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info Column */}
          <motion.div variants={itemVariants} className="md:col-span-2 space-y-6">
            
            {/* About / Bio */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">About</h2>
              {editing ? (
                <textarea
                  value={editBio}
                  onChange={(e) => setEditBio(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 resize-none"
                  placeholder="Tell us about yourself..."
                />
              ) : (
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                  {user?.profile?.bio || "No bio provided yet. Add a short bio to let your team know more about you."}
                </p>
              )}
            </div>

            {/* Role-Specific Content section */}
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {roleName === 'Administrator' && "Administrative Privileges"}
                {roleName === 'Manager' && "Team Overview"}
                {(roleName === 'Employee' || roleName === 'Reviewer') && "Your Activity Summary"}
              </h2>
              
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {roleName === 'Administrator' && (
                  <div className="space-y-4">
                    <p>As an Administrator, you have full control over the Expert Decision Replay Platform.</p>
                    <ul className="list-disc pl-5 space-y-2 text-gray-700 dark:text-gray-400">
                      <li>Manage all user accounts, roles, and permissions.</li>
                      <li>Configure and oversee organizational teams.</li>
                      <li>Review complete system audit logs and reporting analytics.</li>
                    </ul>
                  </div>
                )}
                
                {roleName === 'Manager' && (
                  <div className="space-y-4">
                    <p>As a Manager, you oversee the decision-making workflows for your designated team.</p>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                      <p className="font-medium text-gray-900 dark:text-white mb-1">Your Team: {user?.team?.name || "Not assigned"}</p>
                      <p className="text-xs text-gray-500">{user?.team?.description || "No team description available."}</p>
                    </div>
                  </div>
                )}
                
                {(roleName === 'Employee' || roleName === 'Reviewer') && (
                  <div className="space-y-4">
                    <p>You are an active contributor to the decision-making process.</p>
                    <div className="grid grid-cols-2 gap-4 mt-2">
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 mb-1">Decisions Created</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{decisionCount !== null ? decisionCount : '...'}</p>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-gray-100 dark:border-gray-800">
                        <p className="text-xs text-gray-500 mb-1">Pending Reviews</p>
                        <p className="text-2xl font-semibold text-gray-900 dark:text-white">{pendingReviewCount !== null ? pendingReviewCount : '...'}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Side Info Column */}
          <motion.div variants={itemVariants} className="space-y-6">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Details</h2>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-sm">
                  <IconBriefcase className="text-gray-400 shrink-0 mt-0.5" size={18} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">Designation</p>
                    {editing ? (
                      <input type="text" value={editDesignation} onChange={(e) => setEditDesignation(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">{user?.profile?.designation || 'Not specified'}</p>
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <IconBuilding className="text-gray-400 shrink-0 mt-0.5" size={18} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">Department</p>
                    {editing ? (
                      <input type="text" value={editDepartment} onChange={(e) => setEditDepartment(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">{user?.profile?.department || 'Not specified'}</p>
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <IconPhone className="text-gray-400 shrink-0 mt-0.5" size={18} />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">Phone</p>
                    {editing ? (
                      <input type="text" value={editPhone} onChange={(e) => setEditPhone(e.target.value)}
                        className="w-full px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                    ) : (
                      <p className="text-gray-500 dark:text-gray-400">{user?.profile?.phone || 'Not specified'}</p>
                    )}
                  </div>
                </li>
                <li className="flex items-start gap-3 text-sm">
                  <IconCalendar className="text-gray-400 shrink-0 mt-0.5" size={18} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Joined</p>
                    <p className="text-gray-500 dark:text-gray-400">{formatDate(user?.created_at)}</p>
                  </div>
                </li>
              </ul>
              {editing && (
                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium transition-colors"
                  >
                    {savingProfile ? 'Saving...' : 'Save Changes'}
                  </button>
                  {profileMsg && (
                    <span className={`text-sm ${profileMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                      {profileMsg}
                    </span>
                  )}
                </div>
              )}
            </div>
            
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Status</h2>
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${user?.status === 'active' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                  {user?.status || 'Active'}
                </span>
              </div>
            </div>
            
            <div className="rounded-2xl border border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900/80 p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Password</h2>
              {!showPasswordForm ? (
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Change Password
                </button>
              ) : (
                <div className="space-y-3">
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Current password"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="New password (min 8 chars)"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
                  <div className="flex items-center gap-2">
                    <button onClick={handleChangePassword} disabled={changingPassword}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium transition-colors">
                      {changingPassword ? 'Changing...' : 'Update'}
                    </button>
                    <button onClick={() => { setShowPasswordForm(false); setPasswordMsg(''); }}
                      className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Cancel
                    </button>
                  </div>
                  {passwordMsg && (
                    <p className={`text-xs ${passwordMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
                      {passwordMsg}
                    </p>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
