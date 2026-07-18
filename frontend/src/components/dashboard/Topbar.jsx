import { useState } from 'react';
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
} from '@tabler/icons-react';

const roleBadgeStyles = {
  Administrator: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  Manager: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  Reviewer: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400',
  Employee: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export function Topbar({ onToggleSidebar }) {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  const roleName = user?.role?.name || 'User';
  const badgeStyle = roleBadgeStyles[roleName] || roleBadgeStyles.Employee;

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
        <div className="hidden sm:flex items-center gap-2 rounded-xl bg-gray-100 dark:bg-gray-800/60 px-3 py-2 w-64 lg:w-80 transition-all focus-within:ring-2 focus-within:ring-indigo-500/30 focus-within:bg-white dark:focus-within:bg-gray-800">
          <IconSearch size={16} stroke={1.5} className="text-gray-400" />
          <input
            type="text"
            placeholder="Search decisions..."
            className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 w-full"
          />
        </div>
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
          {showThemeMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowThemeMenu(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-36 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                {[
                  { label: 'Light', value: 'light', icon: IconSun },
                  { label: 'Dark', value: 'dark', icon: IconMoon },
                  { label: 'System', value: 'system', icon: IconDeviceDesktop },
                ].map(({ label, value, icon: ThIcon }) => (
                  <button
                    key={value}
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
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <IconBell size={18} stroke={1.5} />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-gray-200 dark:bg-gray-700 mx-1" />

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowThemeMenu(false);
            }}
            className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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

          {showUserMenu && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowUserMenu(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl py-1 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
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
                </div>
                <div className="py-1">
                  <button className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <IconUserCircle size={16} stroke={1.5} />
                    View Profile
                  </button>
                  <button className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <IconSettings size={16} stroke={1.5} />
                    Settings
                  </button>
                </div>
                <div className="border-t border-gray-100 dark:border-gray-700 py-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
                  >
                    <IconLogout size={16} stroke={1.5} />
                    Log out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
