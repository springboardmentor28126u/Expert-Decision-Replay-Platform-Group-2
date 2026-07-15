import React from 'react';

/**
 * Reusable Button component styled for the Decision Replay Platform.
 * Supports primary, secondary, danger, and outline variants.
 */
export default function Button({
  children,
  type = 'button',
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  ...props
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-base focus-ring disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white shadow-sm',
    secondary: 'bg-surface-100 hover:bg-surface-200 text-surface-700',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm',
    outline: 'border border-surface-300 hover:bg-surface-50 text-surface-700',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };

  return (
    <button
      type={type}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
}
