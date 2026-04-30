import { forwardRef } from 'react';

export const Input = forwardRef(function Input(
  { label, error, helper, className = '', id, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-label uppercase text-fg-secondary"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        className={`
          h-11 px-4 rounded-md
          bg-surface-inset text-fg-primary text-body
          font-body placeholder:text-fg-tertiary
          border transition-all duration-200
          focus:outline-none focus:border-accent-glow focus:shadow-focus
          ${error
            ? 'border-danger-border'
            : 'border-border hover:border-border-strong'
          }
        `}
        {...props}
      />
      {error && (
        <p className="text-caption text-danger">{error}</p>
      )}
      {helper && !error && (
        <p className="text-caption text-fg-tertiary">{helper}</p>
      )}
    </div>
  );
});
