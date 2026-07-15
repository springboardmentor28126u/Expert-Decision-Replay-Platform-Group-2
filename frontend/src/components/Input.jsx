import React from 'react';

/**
 * Reusable input input field with custom label, error, and premium styles.
 */
export default function Input({
  id,
  label,
  type = 'text',
  error,
  placeholder,
  variant = 'light',
  className = '',
  ...props
}) {
  const labelColors = {
    light: 'text-surface-700',
    dark: 'text-surface-200',
  };

  const inputStyles = {
    light: `bg-white text-surface-900 placeholder-surface-400 ${
      error
        ? 'border-red-500 focus:ring-red-500'
        : 'border-surface-200 hover:border-surface-300 focus:ring-primary-500'
    }`,
    dark: `bg-white/10 text-white placeholder-surface-400 ${
      error
        ? 'border-red-400 focus:ring-red-400'
        : 'border-white/20 hover:border-white/35 focus:ring-primary-500'
    }`,
  };

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={id} className={`block text-sm font-medium mb-1.5 ${labelColors[variant]}`}>
          {label}
        </label>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        className={`
          w-full px-4 py-2.5 rounded-lg border transition-base focus-ring
          ${inputStyles[variant]}
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className={`mt-1.5 text-xs font-medium ${variant === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
          {error}
        </p>
      )}
    </div>
  );
}
