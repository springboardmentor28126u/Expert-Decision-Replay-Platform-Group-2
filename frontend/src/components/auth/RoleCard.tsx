import { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import { IconCheck, IconLock } from '@tabler/icons-react';

interface RoleCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  selected?: boolean;
  disabled?: boolean;
  badge?: string;
  onClick?: () => void;
}

export function RoleCard({
  icon,
  title,
  description,
  selected = false,
  disabled = false,
  badge,
  onClick,
}: RoleCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'relative w-full text-left rounded-xl border-2 p-4 transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        disabled && 'opacity-60 cursor-not-allowed border-border bg-muted/30',
        !disabled && !selected && 'border-border hover:border-primary/50 hover:bg-accent/50 cursor-pointer',
        !disabled && selected && 'border-primary bg-primary/5 shadow-md',
      )}
      aria-pressed={selected}
      aria-disabled={disabled}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center',
            selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
          )}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">{title}</span>
            {selected && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                <IconCheck size={12} />
              </span>
            )}
            {disabled && !badge && (
              <IconLock size={14} className="text-muted-foreground" />
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
            {description}
          </p>
          {badge && (
            <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground">
              <IconLock size={10} />
              {badge}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}
