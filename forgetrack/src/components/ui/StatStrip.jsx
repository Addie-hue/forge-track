export function StatStrip({ items = [], className = '' }) {
  if (!items.length) return null;

  return (
    <div className={`flex items-center overflow-x-auto pb-4 md:pb-0 hide-scrollbar ${className}`}>
      {items.map((item, index) => {
        const Icon = item.icon;
        const isLast = index === items.length - 1;
        
        return (
          <div key={index} className="flex items-center flex-shrink-0">
            <div className="flex flex-col gap-1 px-6 first:pl-0">
              <div className="flex items-center gap-2 text-fg-tertiary">
                {Icon && <Icon className="w-4 h-4" />}
                <span className="text-uppercase-label">{item.label}</span>
              </div>
              <div className="text-body-lg font-semibold text-fg-primary font-tabular">
                {item.value}
              </div>
            </div>
            {!isLast && (
              <div className="w-[1px] h-10 bg-border-subtle" />
            )}
          </div>
        );
      })}
    </div>
  );
}
