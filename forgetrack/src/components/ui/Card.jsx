export function Card({ children, className = '', hero = false, onClick, ...props }) {
  const baseClasses = `
    bg-surface bg-card-gradient
    ${hero ? 'rounded-2xl p-10' : 'rounded-xl p-8'}
    transition-colors duration-200
  `;
  const shadowStyle = { boxShadow: 'var(--shadow-card)' };

  return (
    <div
      className={`${baseClasses} ${onClick ? 'cursor-pointer hover:bg-surface-raised' : ''} ${className}`}
      style={shadowStyle}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ label, title, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between mb-6 ${className}`}>
      <div>
        {label && (
          <p className="text-label uppercase text-fg-tertiary mb-2">{label}</p>
        )}
        {title && (
          <h3 className="text-h3 font-display text-fg-primary">{title}</h3>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
