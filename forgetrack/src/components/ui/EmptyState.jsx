export function EmptyState({ icon: Icon, title, description, action, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 px-6 text-center ${className}`}>
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-surface-raised flex items-center justify-center mb-6 border border-border">
          <Icon className="w-8 h-8 text-fg-tertiary" />
        </div>
      )}
      <h3 className="text-h2 font-display text-fg-primary mb-2">{title}</h3>
      {description && (
        <p className="text-body-lg text-fg-secondary max-w-md mb-8">
          {description}
        </p>
      )}
      {action && <div>{action}</div>}
    </div>
  );
}
