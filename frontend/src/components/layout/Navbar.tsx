import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';

interface NavbarProps {
  onToggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();

  return (
    <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-border bg-surface/80 backdrop-blur-md px-6">
      <div className="flex items-center gap-4">
        {/* Toggle Sidebar on mobile viewports */}
        <button
          onClick={onToggleSidebar}
          className="rounded-md p-1.5 text-text-secondary hover:bg-surface-hover hover:text-text lg:hidden transition-all"
          aria-label="Toggle menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-6 w-6"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
          </svg>
        </button>

        <h2 className="text-lg font-bold tracking-tight text-text lg:hidden">
          Decision Vault
        </h2>
      </div>

      <div className="flex items-center gap-4 ml-auto">
        {user && (
          <div className="flex items-center gap-3">
            <div className="hidden text-right md:block">
              <p className="text-sm font-semibold text-text leading-tight">{user.username}</p>
              <p className="text-xs text-text-secondary leading-none capitalize mt-0.5">{user.role}</p>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary-light border border-primary/20 uppercase select-none">
              {user.username.charAt(0)}
            </div>
            <Button variant="ghost" size="sm" onClick={logout} className="ml-2">
              Logout
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;
