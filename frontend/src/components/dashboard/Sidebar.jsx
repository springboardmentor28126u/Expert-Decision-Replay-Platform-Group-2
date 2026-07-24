import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { IconChevronLeft } from '@tabler/icons-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';

// Tooltip component for collapsed state
const SidebarTooltip = ({ label, show }) => (
  <AnimatePresence>
    {show && (
      <motion.div
        initial={{ opacity: 0, x: -10, scale: 0.95 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -10, scale: 0.95 }}
        transition={{ duration: 0.15, ease: "easeOut" }}
        className="absolute left-full ml-4 top-1/2 -translate-y-1/2 z-50 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-xs font-medium whitespace-nowrap shadow-xl"
      >
        {label}
        {/* Tooltip arrow */}
        <div className="absolute top-1/2 -left-1 -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-900 dark:border-r-white"></div>
      </motion.div>
    )}
  </AnimatePresence>
);

const NavItem = ({ item, collapsed, isFirst }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative" 
      onMouseEnter={() => setIsHovered(true)} 
      onMouseLeave={() => setIsHovered(false)}
    >
      <NavLink
        to={item.path}
        end={isFirst}
        className={({ isActive }) =>
          cn(
            'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group overflow-hidden',
            isActive
              ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:text-gray-900 dark:hover:text-gray-200',
            collapsed && 'justify-center px-2'
          )
        }
      >
        {({ isActive }) => (
          <>
            {/* Active Pill Indicator */}
            {isActive && (
              <motion.div 
                layoutId="active-pill"
                className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-indigo-600 dark:bg-indigo-500 rounded-r-full"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            )}
            
            {/* Hover Background Layer (subtle) */}
            <div className="absolute inset-0 bg-gray-900/[0.02] dark:bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />

            <item.icon
              size={20}
              stroke={isActive ? 2 : 1.5}
              className={cn("flex-shrink-0 relative z-10 transition-transform duration-200", isActive ? "scale-110" : "group-hover:scale-110")}
            />
            
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span 
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="truncate relative z-10"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </>
        )}
      </NavLink>

      {/* Show tooltip only when collapsed and hovered */}
      <SidebarTooltip label={item.label} show={collapsed && isHovered} />
    </div>
  );
};

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
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="flex flex-col border-r border-gray-200 dark:border-gray-800/60 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl h-full shadow-[4px_0_24px_rgba(0,0,0,0.02)] dark:shadow-none z-10 relative"
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 border-b border-gray-200 dark:border-gray-800/60 px-4 gap-3 flex-shrink-0', collapsed && 'justify-center px-2')}>
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/30 flex-shrink-0 cursor-pointer"
        >
          E
        </motion.div>
        
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col justify-center min-w-0"
            >
              <span className="text-lg font-bold tracking-tight text-gray-900 dark:text-white truncate leading-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 to-purple-600">
                EDRP
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-gray-500 dark:text-gray-400">Platform</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2.5 space-y-1.5 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-800">
        {items.map((item, idx) => (
          <NavItem key={`${item.label}-${idx}`} item={item} collapsed={collapsed} isFirst={item.path === items[0]?.path} />
        ))}
      </nav>

      {/* Collapse toggle (desktop) */}
      {onToggle && (
        <div className="px-2.5 py-2 hidden md:block border-t border-gray-200 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-800/20">
          <button
            onClick={onToggle}
            className={cn(
              'flex items-center gap-2 w-full rounded-xl px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 transition-colors group',
              collapsed && 'justify-center px-2'
            )}
          >
            <motion.div
              animate={{ rotate: collapsed ? 180 : 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            >
              <IconChevronLeft size={16} stroke={2} className="group-hover:-translate-x-0.5 transition-transform" />
            </motion.div>
            <AnimatePresence mode="wait">
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="truncate"
                >
                  Collapse Sidebar
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      )}

      {/* User card */}
      <div className={cn('border-t border-gray-200 dark:border-gray-800/60 p-3 bg-white dark:bg-gray-900', collapsed && 'px-2')}>
        <div className={cn('flex items-center rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition-colors cursor-pointer group', collapsed ? 'justify-center' : 'gap-3')}>
          <div className="h-9 w-9 flex-shrink-0 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm ring-2 ring-transparent group-hover:ring-indigo-100 dark:group-hover:ring-indigo-900/50 transition-all">
            {initials}
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="min-w-0"
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.full_name}
                </p>
                <p className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 truncate">
                  {user?.role}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.aside>
  );
}
