import { cn } from '../../lib/utils';

const colorSchemes = {
  indigo: {
    icon: 'text-indigo-600 dark:text-indigo-400',
    bg: 'bg-indigo-50 dark:bg-indigo-950/50',
    border: 'border-indigo-100 dark:border-indigo-900/30',
    glow: 'group-hover:shadow-indigo-100 dark:group-hover:shadow-indigo-950/50',
  },
  emerald: {
    icon: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-950/50',
    border: 'border-emerald-100 dark:border-emerald-900/30',
    glow: 'group-hover:shadow-emerald-100 dark:group-hover:shadow-emerald-950/50',
  },
  amber: {
    icon: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/50',
    border: 'border-amber-100 dark:border-amber-900/30',
    glow: 'group-hover:shadow-amber-100 dark:group-hover:shadow-amber-950/50',
  },
  rose: {
    icon: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-950/50',
    border: 'border-rose-100 dark:border-rose-900/30',
    glow: 'group-hover:shadow-rose-100 dark:group-hover:shadow-rose-950/50',
  },
};

const colorKeys = Object.keys(colorSchemes);

export function StatCard({ label, value, icon: Icon, loading = false, index = 0, subtitle }) {
  const scheme = colorSchemes[colorKeys[index % colorKeys.length]];

  return (
    <div
      className={cn(
        'group relative rounded-2xl border bg-white dark:bg-gray-900/80 p-5 transition-all duration-300',
        'hover:-translate-y-0.5 hover:shadow-lg cursor-default',
        scheme.border,
        scheme.glow
      )}
    >
      {/* Subtle gradient accent on top */}
      <div className="absolute inset-x-0 top-0 h-[2px] rounded-t-2xl bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {label}
          </span>
          {loading ? (
            <div className="h-9 w-20 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
          ) : (
            <p className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {value}
            </p>
          )}
          {subtitle && (
            <p className="text-xs text-gray-400 dark:text-gray-500">{subtitle}</p>
          )}
        </div>

        {Icon && (
          <div
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110',
              scheme.bg
            )}
          >
            <Icon size={20} stroke={1.5} className={scheme.icon} />
          </div>
        )}
      </div>
    </div>
  );
}
