import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { IconChevronLeft } from '@tabler/icons-react';

export function Sidebar({ items, collapsed = false, onToggle }) {
  const { user } = useAuth();

  const initials = user?.full_name
    ? user.full_name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U';

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-gray-200 dark:border-gray-800/60 bg-white dark:bg-gray-900 h-full transition-all duration-300 ease-in-out',
        collapsed ? 'w-[68px]' : 'w-[220px]'
      )}
    >
      {/* Logo */}
      <div
        className={cn(
          'flex items-center h-16 border-b border-gray-200 dark:border-gray-800/60 px-4 gap-3 flex-shrink-0',
          collapsed && 'justify-center px-2'
        )}
      >
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm font-bold shadow-md shadow-indigo-500/20 flex-shrink-0">
          E
        </div>
        {!collapsed && (
          <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white truncate">
            EDRP
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2.5 space-y-0.5 overflow-y-auto">
        {items.map((item, idx) => (
          <NavLink
            key={`${item.label}-${idx}`}
            to={item.path}
            end={item.path === items[0]?.path}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200',
                collapsed && 'justify-center px-2'
              )
            }
          >
            <item.icon
              size={20}
              stroke={1.5}
              className="flex-shrink-0"
            />
            {!collapsed && (
              <span className="truncate">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle (desktop) */}
      {onToggle && (
        <div className="px-2.5 py-2 hidden md:block">
          <button
            onClick={onToggle}
            className={cn(
              'flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs font-medium text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-600 dark:hover:text-gray-400 transition-all',
              collapsed && 'justify-center px-2'
            )}
          >
            <IconChevronLeft
              size={16}
              stroke={1.5}
              className={cn(
                'transition-transform duration-300',
                collapsed && 'rotate-180'
              )}
            />
            {!collapsed && <span>Collapse</span>}
          </button>
        </div>
      )}

      {/* User card */}
      <div
        className={cn(
          'border-t border-gray-200 dark:border-gray-800/60 p-3',
          collapsed && 'px-2'
        )}
      >
        <div
          className={cn(
            'flex items-center rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors cursor-default',
            collapsed ? 'justify-center' : 'gap-2.5'
          )}
        >
          <div className="h-8 w-8 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.full_name}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-500 truncate">
                {user?.role?.name}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
