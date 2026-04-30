import { Check } from 'lucide-react';

export function Checkbox({ checked, onChange, label, description, id, className = '', disabled = false }) {
  const checkboxId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="relative flex items-center justify-center mt-0.5">
        <input
          type="checkbox"
          id={checkboxId}
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="peer appearance-none w-5 h-5 border-2 border-border-strong rounded bg-surface-inset checked:bg-success checked:border-success transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-glow focus-visible:ring-offset-2 focus-visible:ring-offset-void"
        />
        <Check className="w-3.5 h-3.5 text-void absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity" strokeWidth={3} />
      </div>
      {(label || description) && (
        <div className="flex flex-col">
          {label && (
            <label htmlFor={checkboxId} className={`text-body font-medium ${disabled ? 'text-fg-tertiary cursor-not-allowed' : 'text-fg-primary cursor-pointer'}`}>
              {label}
            </label>
          )}
          {description && (
            <p className="text-body-sm text-fg-secondary mt-0.5">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
