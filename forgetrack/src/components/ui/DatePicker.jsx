import { forwardRef } from 'react';
import { Calendar } from 'lucide-react';
import { PROGRAM_START_DATE } from '../../lib/constants';

export const DatePicker = forwardRef(function DatePicker(
  { label, error, className = '', id, maxDate, minDate = PROGRAM_START_DATE, ...props },
  ref
) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
  
  // Default max date to today if not specified
  const max = maxDate || new Date().toISOString().split('T')[0];

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="text-label uppercase text-fg-secondary">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          type="date"
          ref={ref}
          id={inputId}
          max={max}
          min={minDate}
          className={`
            w-full h-11 px-4 pl-10 rounded-md
            bg-surface-inset text-fg-primary text-body font-mono
            border transition-all duration-200 cursor-pointer
            focus:outline-none focus:border-accent-glow focus:shadow-focus
            ${error ? 'border-danger-border' : 'border-border hover:border-border-strong'}
            [color-scheme:dark]
          `}
          {...props}
        />
        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary pointer-events-none" />
      </div>
      {error && <p className="text-caption text-danger">{error}</p>}
    </div>
  );
});
