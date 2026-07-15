import React, { useState } from 'react';
import { Link, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function DashboardLayout({ roleName, links = [] }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="h-16 bg-white border-b border-surface-200 sticky top-0 z-40 flex items-center justify-between px-4 sm:px-6 shadow-sm">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-surface-500 hover:text-surface-900 rounded-lg md:hidden hover:bg-surface-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              ED
            </div>
            <span className="text-base sm:text-lg font-semibold text-surface-900">
              Decision Replay
            </span>
          </Link>

          <span className="hidden sm:inline-block px-2.5 py-0.5 text-xs font-semibold rounded-full bg-primary-50 text-primary-700 border border-primary-100 uppercase tracking-wide">
            {roleName} Panel
          </span>
        </div>

        {/* User profile dropdown & logout */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-surface-900">{user?.email || 'User'}</p>
            <p className="text-xs text-surface-400 capitalize">{user?.role || 'Guest'}</p>
          </div>
          <div className="w-9 h-9 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm border border-primary-200">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-surface-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-base"
            title="Sign out"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <aside
          className={`
            fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-surface-200 pt-16 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:pt-0
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="h-full flex flex-col justify-between py-6 px-4">
            <nav className="space-y-1">
              {links.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-surface-600 hover:text-surface-900 hover:bg-surface-50 transition-base"
                >
                  <span className="text-surface-400 group-hover:text-surface-600">{link.icon}</span>
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="pt-6 border-t border-surface-100">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-base"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile sidebar backdrop overlay */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-surface-900/30 z-20 md:hidden"
          ></div>
        )}

        {/* Workspace content window */}
        <main className="flex-1 overflow-y-auto p-6 sm:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
