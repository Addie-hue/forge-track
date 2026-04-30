import { useAuth } from '../../contexts/AuthContext';
import { Search, Bell } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function TopBar() {
  const { displayName, role } = useAuth();
  const location = useLocation();

  // Simple breadcrumb generation based on path
  const path = location.pathname.split('/').filter(Boolean).pop() || 'Dashboard';
  const breadcrumb = path.charAt(0).toUpperCase() + path.slice(1).replace('-', ' ');

  const initial = displayName ? displayName.charAt(0).toUpperCase() : '?';

  return (
    <header className="h-20 px-6 md:px-12 flex items-center justify-between z-20 relative border-b border-border-subtle md:border-none">
      {/* Breadcrumb - hidden on mobile, shown on desktop */}
      <div className="hidden md:flex items-center gap-2 text-body font-medium">
        <span className="text-fg-tertiary">Overview</span>
        <span className="text-border-strong">/</span>
        <span className="text-fg-primary">{breadcrumb}</span>
      </div>

      {/* Mobile Title - shown on mobile, hidden on desktop */}
      <div className="md:hidden text-h3 font-display text-fg-primary">
        {breadcrumb}
      </div>

      <div className="flex items-center gap-6">
        {/* Search placeholder */}
        <div className="hidden md:flex items-center gap-2 px-4 h-10 rounded-full bg-surface-inset border border-border text-fg-tertiary w-64">
          <Search className="w-4 h-4" />
          <span className="text-body-sm">Search (Ctrl+K)</span>
        </div>

        <div className="flex items-center gap-4">
          <button className="text-fg-secondary hover:text-fg-primary transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 pl-4 border-l border-border-subtle">
            <div className="flex flex-col items-end hidden sm:flex">
              <span className="text-body-sm font-medium text-fg-primary">{displayName}</span>
              <span className="text-caption text-fg-tertiary uppercase tracking-wider">{role}</span>
            </div>
            <div className="w-9 h-9 rounded-full bg-accent-glow flex items-center justify-center text-void font-bold text-body">
              {initial}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
