import { Link, useLocation } from 'react-router-dom';

const navLinks = [
  { label: 'Dashboard', path: '/dashboard' },
];

/**
 * Navbar — Top navigation bar for the application.
 * Highlights the active route and provides user-facing navigation.
 */
function Navbar() {
  const { pathname } = useLocation();

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-surface-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <span className="text-white font-bold text-sm">ED</span>
            </div>
            <span className="text-lg font-semibold text-surface-900 hidden sm:inline">
              Decision Replay
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive = pathname === link.path;
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-base
                    ${isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-surface-500 hover:text-surface-900 hover:bg-surface-100'
                    }
                  `}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* User area placeholder */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-surface-200 flex items-center justify-center">
              <span className="text-xs font-medium text-surface-500">U</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
