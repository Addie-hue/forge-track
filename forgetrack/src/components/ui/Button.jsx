import { Loader2 } from 'lucide-react';

const variants = {
  primary: 'bg-fg-primary text-void hover:bg-[#E5E5E7] active:bg-[#D4D4D6]',
  secondary: 'bg-surface-raised text-fg-primary border border-border hover:bg-surface hover:border-border-strong',
  destructive: 'bg-surface-raised text-danger border border-danger-border hover:bg-danger-bg',
  ghost: 'text-fg-secondary hover:text-fg-primary hover:bg-surface-raised',
  icon: 'bg-surface-raised text-fg-secondary hover:text-fg-primary border border-border',
};

const sizes = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-5 text-body gap-2',
  lg: 'h-12 px-6 text-body-lg gap-2.5',
  icon: 'h-10 w-10 p-0 justify-center',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  className = '',
  ...props
}) {
  const isIconOnly = size === 'icon';

  return (
    <button
      className={`
        inline-flex items-center justify-center font-medium
        rounded-md transition-all duration-200
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-glow focus-visible:ring-offset-2 focus-visible:ring-offset-void
        disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none
        ${variants[variant]}
        ${isIconOnly ? sizes.icon : sizes[size]}
        ${className}
      `}
      disabled={disabled || loading}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {!loading && children}
    </button>
  );
}
