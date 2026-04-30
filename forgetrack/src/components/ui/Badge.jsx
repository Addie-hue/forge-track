export function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-surface-raised text-fg-secondary border border-border',
    accent: 'bg-accent-glow text-fg-primary border-transparent',
    success: 'bg-success-bg text-success border-success-border',
  };

  return (
    <span
      className={`
        inline-flex items-center px-1.5 py-0.5
        rounded text-micro font-semibold uppercase tracking-[0.06em]
        ${variants[variant]}
        ${className}
      `}
    >
      {children}
    </span>
  );
}
