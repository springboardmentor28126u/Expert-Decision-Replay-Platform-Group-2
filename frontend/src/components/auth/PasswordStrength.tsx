import { cn } from '../../lib/utils';
import { IconCheck } from '@tabler/icons-react';

interface PasswordStrengthProps {
  password: string;
}

const rules = [
  { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  { label: 'Uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  { label: 'Lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
];

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const passed = rules.filter((r) => r.test(password)).length;
  const score = password.length === 0 ? 0 : Math.round((passed / rules.length) * 100);

  const barColor =
    score <= 25 ? 'bg-destructive' : score <= 50 ? 'bg-orange-500' : score <= 75 ? 'bg-yellow-500' : 'bg-green-500';

  return (
    <div className="space-y-2">
      <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-300', barColor)}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        {rules.map((rule) => (
          <div
            key={rule.label}
            className={cn(
              'flex items-center gap-1.5 text-[11px]',
              rule.test(password) ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground',
            )}
          >
            <IconCheck size={12} className={rule.test(password) ? 'opacity-100' : 'opacity-30'} />
            {rule.label}
          </div>
        ))}
      </div>
    </div>
  );
}
