import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';
import {
  IconSearch,
  IconBell,
  IconMenu2,
  IconSun,
  IconMoon,
  IconDeviceDesktop,
  IconLogout,
  IconUserCircle,
  IconSettings,
  IconBuilding,
  IconUsers,
  IconChevronDown,
  IconCheck,
} from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getRoleLabel, normalizeRole } from '../../utils/roles';

const roleBadgeStyles = {
  admin: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  reviewer: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  employee: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

const dropdownVariants = {
  hidden: { opacity: 0, y: 10, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { type: 'spring', stiffness: 400, damping: 30, staggerChildren: 0.05 }
  },
  exit: { 
    opacity: 0, 
    y: 10, 
    scale: 0.95,
    transition: { duration: 0.2 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 }
};

export function Topbar({ onToggleSidebar }) {
  const { user, logout, companies, groups, currentCompanyId, currentGroupId, switchCompany, switchGroup } = useAuth();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifMenu, setShowNotifMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [notifRes, countRes] = await Promise.all([
          api.get('/notifications?limit=10'),
          api.get('/notifications/unread-count'),
        ]);
        setNotifications(notifRes.data);
        setUnreadCount(countRes.data.count);
      } catch (err) {
        // Silently fail - notifications are non-critical
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      navigate(`/decisions?search=${encodeURIComponent(searchQuery.trim())}`);
      setIsSearchFocused(false);
    }
  };

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const roleName = getRoleLabel(user?.role);
  const badgeStyle = roleBadgeStyles[normalizeRole(user?.role)] || roleBadgeStyles.employee;

  const currentCompany = companies.find(c => c.id === currentCompanyId);

  const themeIcon =
    theme === 'dark' ? (
      <IconMoon size={18} stroke={1.5} />
    ) : theme === 'light' ? (
      <IconSun size={18} stroke={1.5} />
    ) : (
      <IconDeviceDesktop size={18} stroke={1.5} />
    );

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-800/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md px-4 md:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Toggle sidebar"
        >
          <IconMenu2 size={20} stroke={1.5} />
        </button>

        {/* Search bar */}
        <motion.div 
          animate={{ width: isSearchFocused ? '320px' : '256px' }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          className="hidden sm:flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800/60 px-3 py-2 transition-all focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:bg-white dark:focus-within:bg-gray-800 shadow-sm"
        >
          <IconSearch size={16} stroke={1.5} className="text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search decisions..."
            onFocus={() => setIsSearchFocused(true)}
            onBlur={() => setIsSearchFocused(false)}
            className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 w-full"
          />
        </motion.div>
        </div>

      {/* Company/Group Switcher */}
      <div className="relative">
        <button
          onClick={() => {
            setShowCompanyMenu(!showCompanyMenu);
            setShowUserMenu(false);
            setShowThemeMenu(false);
          }}
          className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <IconBuilding size={16} stroke={1.5} />
          <span className="hidden md:block max-w-[120px] truncate">{currentCompany?.name || 'Company'}</span>
          <IconChevronDown size={14} stroke={1.5} />
        </button>
        <AnimatePresence>
          {showCompanyMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowCompanyMenu(false)}
              />
              <motion.div
                variants={dropdownVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="absolute left-0 top-full z-50 mt-2 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl py-1 overflow-hidden"
              >
                {/* Company Section */}
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Company</p>
                </div>
                {companies.length > 0 ? (
                  companies.map((company) => (
                    <motion.button
                      key={company.id}
                      variants={itemVariants}
                      onClick={() => {
                        switchCompany(company.id);
                        setShowCompanyMenu(false);
                      }}
                      className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${
                        currentCompanyId === company.id
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <IconBuilding size={14} stroke={1.5} />
                      <span className="truncate">{company.name}</span>
                      {currentCompanyId === company.id && (
                        <IconCheck size={14} stroke={2} className="ml-auto text-indigo-600 dark:text-indigo-400" />
                      )}
                    </motion.button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-gray-400 dark:text-gray-500">
                    No companies
                  </div>
                )}

                {/* Group Section */}
                {groups.length > 0 && (
                  <>
                    <div className="px-3 py-2 border-t border-gray-100 dark:border-gray-700">
                      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Group</p>
                    </div>
                    {groups.map((group) => (
                      <motion.button
                        key={group.id}
                        variants={itemVariants}
                        onClick={() => {
                          switchGroup(group.id);
                          setShowCompanyMenu(false);
                        }}
                        className={`flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors ${
                          currentGroupId === group.id
                            ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <IconUsers size={14} stroke={1.5} />
                        <span className="truncate">{group.name}</span>
                        {currentGroupId === group.id && (
                          <IconCheck size={14} stroke={2} className="ml-auto text-indigo-600 dark:text-indigo-400" />
                        )}
                      </motion.button>
                    ))}
                  </>
                )}
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-1.5">
        {/* Theme toggle */}
        <div className="relative">
          <button
            onClick={() => {
              setShowThemeMenu(!showThemeMenu);
              setShowUserMenu(false);
            }}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {themeIcon}
          </button>
          <AnimatePresence>
            {showThemeMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowThemeMenu(false)}
                />
                <motion.div 
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute right-0 top-full z-50 mt-2 w-36 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl py-1 overflow-hidden"
                >
                  {[
                    { label: 'Light', value: 'light', icon: IconSun },
                    { label: 'Dark', value: 'dark', icon: IconMoon },
                    { label: 'System', value: 'system', icon: IconDeviceDesktop },
                  ].map(({ label, value, icon: ThIcon }) => (
                    <motion.button
                      key={value}
                      variants={itemVariants}
                      onClick={() => {
                        setTheme(value);
                        setShowThemeMenu(false);
                      }}
                      className={`flex items-center gap-2 w-full px-3 py-2 text-sm transition-colors ${
                        theme === value
                          ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/20'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <ThIcon size={16} stroke={1.5} />
                      {label}
                    </motion.button>
                  ))}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifMenu(!showNotifMenu);
              setShowUserMenu(false);
              setShowThemeMenu(false);
            }}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <IconBell size={18} stroke={1.5} />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          <AnimatePresence>
            {showNotifMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowNotifMenu(false)} />
                <motion.div
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl py-1 overflow-hidden"
                >
                  {notifications.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No notifications yet
                    </div>
                  ) : (
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.map((notif) => (
                        <div
                          key={notif.id}
                          className={`px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-0 ${notif.read_at ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/10'}`}
                        >
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{notif.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowThemeMenu(false);
            }}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold shadow-sm">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
                {user?.full_name}
              </p>
              <span
                className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium ${badgeStyle}`}
              >
                {roleName}
              </span>
            </div>
          </button>

          <AnimatePresence>
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <motion.div 
                  variants={dropdownVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-2xl py-1 overflow-hidden"
                >
                  <motion.div variants={itemVariants} className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {user?.full_name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {user?.email}
                    </p>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium mt-1.5 ${badgeStyle}`}
                    >
                      {roleName}
                    </span>
                  </motion.div>
                  <div className="py-1">
                    <motion.button 
                      variants={itemVariants}
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/profile');
                      }}
                      className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <IconUserCircle size={16} stroke={1.5} />
                      View Profile
                    </motion.button>
                    <motion.button
                      variants={itemVariants}
                      onClick={() => {
                        setShowUserMenu(false);
                        navigate('/profile');
                      }}
                      className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <IconSettings size={16} stroke={1.5} />
                      Settings
                    </motion.button>
                  </div>
                  <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                    <motion.button
                      variants={itemVariants}
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors group"
                    >
                      <IconLogout size={16} stroke={1.5} className="group-hover:translate-x-1 transition-transform" />
                      Log out
                    </motion.button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
