import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'draft' | 'under-review' | 'approved' | 'rejected' | 'archived' | 'primary' | 'secondary';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'primary', className = '' }) => {
  const variantClasses = {
    draft: 'status-draft',
    'under-review': 'status-under-review',
    approved: 'status-approved',
    rejected: 'status-rejected',
    archived: 'status-archived',
    primary: 'bg-primary/10 text-primary-light border border-primary/20',
    secondary: 'bg-surface-elevated text-text-secondary border border-border',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export default Badge;
