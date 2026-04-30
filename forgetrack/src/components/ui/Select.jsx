import { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = forwardRef(function Select(
  { label, error, options = [], placeholder = 'Select...', className = '', id, ...props },
  ref
) {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="text-label uppercase text-fg-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={`
            appearance-none w-full h-11 px-4 pr-10 rounded-md
            bg-surface-inset text-fg-primary text-body font-body
            border transition-all duration-200 cursor-pointer
            focus:outline-none focus:border-accent-glow focus:shadow-focus
            ${error ? 'border-danger-border' : 'border-border hover:border-border-strong'}
          `}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option
              key={typeof opt === 'object' ? opt.value : opt}
              value={typeof opt === 'object' ? opt.value : opt}
            >
              {typeof opt === 'object' ? opt.label : opt}
            </option>
          ))}
        </select>
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary pointer-events-none" />
      </div>
      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
});
