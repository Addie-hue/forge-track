import { ArrowUpDown } from 'lucide-react';

export function Table({ children, className = '' }) {
  return (
    <div className={`w-full overflow-x-auto ${className}`}>
      <table className="w-full border-collapse border-spacing-0">
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children }) {
  return <thead className="border-b border-border-subtle">{children}</thead>;
}

export function TableBody({ children }) {
  return <tbody className="divide-y divide-border-subtle">{children}</tbody>;
}

export function TableRow({ children, className = '', hover = true }) {
  return (
    <tr className={`transition-colors ${hover ? 'hover:bg-surface-raised' : ''} ${className}`}>
      {children}
    </tr>
  );
}

export function TableHead({ children, sortable = false, onClick, className = '' }) {
  return (
    <th
      className={`
        text-left py-4 px-5 font-body text-[12px] font-medium
        text-fg-tertiary uppercase tracking-[0.02em]
        ${sortable ? 'cursor-pointer select-none hover:text-fg-secondary' : ''}
        ${className}
      `}
      onClick={sortable ? onClick : undefined}
    >
      <div className="flex items-center gap-1">
        {children}
        {sortable && <ArrowUpDown className="w-3 h-3 text-fg-tertiary" />}
      </div>
    </th>
  );
}

export function TableCell({ children, className = '' }) {
  return (
    <td className={`py-[18px] px-5 font-body text-sm text-fg-primary ${className}`}>
      {children}
    </td>
  );
}
