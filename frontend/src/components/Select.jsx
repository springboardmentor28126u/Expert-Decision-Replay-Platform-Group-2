import React from 'react';

/**
 * Reusable Select dropdown component styled for the Decision Replay Platform.
 * Supports options array, labels, error states, and custom placeholders.
 */
export default function Select({
  id,
  label,
  options = [],
  placeholder = 'Select an option',
  variant = 'light',
  error,
  className = '',
  ...props
}) {
  const labelColors = {
    light: 'text-surface-700',
    dark: 'text-surface-200',
  };

  const selectStyles = {
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
      <div className="relative">
        <select
          id={id}
          className={`
            w-full px-4 py-2.5 rounded-lg border appearance-none transition-base focus-ring cursor-pointer
            ${selectStyles[variant]}
            ${className}
          `}
          defaultValue=""
          {...props}
        >
          <option value="" disabled className={variant === 'dark' ? 'bg-surface-900 text-surface-400' : 'bg-white text-surface-400'}>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option
              key={typeof opt === 'object' ? opt.value : opt}
              value={typeof opt === 'object' ? opt.value : opt}
              className={variant === 'dark' ? 'bg-surface-900 text-white' : 'bg-white text-surface-900'}
            >
              {typeof opt === 'object' ? opt.label : opt}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-surface-300">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && (
        <p className={`mt-1.5 text-xs font-medium ${variant === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
          {error}
        </p>
      )}
    </div>
  );
}
