export function Skeleton({ className = '', variant = 'rectangular' }) {
  const baseClasses = 'bg-surface-raised animate-pulse rounded-md';
  
  if (variant === 'circular') {
    return <div className={`rounded-full ${baseClasses} ${className}`} />;
  }
  
  if (variant === 'text') {
    return <div className={`h-4 ${baseClasses} ${className}`} />;
  }
  
  return <div className={`${baseClasses} ${className}`} />;
}

export function CardSkeleton() {
  return (
    <div className="bg-surface bg-card-gradient rounded-xl p-8 border border-border">
      <Skeleton variant="text" className="w-24 mb-6" />
      <Skeleton variant="text" className="w-48 h-8 mb-4" />
      <Skeleton variant="text" className="w-full mb-2" />
      <Skeleton variant="text" className="w-3/4" />
    </div>
  );
}

export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center pb-4 mb-4 border-b border-border-subtle">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={`header-${i}`} className="flex-1 px-5">
            <Skeleton variant="text" className="w-20" />
          </div>
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex items-center py-4 border-b border-border-subtle">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div key={`col-${rowIndex}-${colIndex}`} className="flex-1 px-5">
              <Skeleton variant="text" className={colIndex === 0 ? "w-32" : "w-24"} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
