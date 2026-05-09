import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Bell, LogOut, Key } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

export function TopBar() {
  const { displayName, role, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    navigate('/login');
  };

  const handleSearchClick = () => {
    if (role === 'mentor') {
      navigate('/history');
    }
  };

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
        {/* Search button - Mentors only */}
        {role === 'mentor' && (
          <button 
            onClick={handleSearchClick}
            className="hidden md:flex items-center gap-2 px-4 h-10 rounded-full bg-surface-inset border border-border text-fg-tertiary hover:text-fg-secondary hover:border-border-strong transition-colors w-64 text-left"
          >
            <Search className="w-4 h-4" />
            <span className="text-body-sm">Search students...</span>
          </button>
        )}

        <div className="flex items-center gap-4">
          <button className="text-fg-secondary hover:text-fg-primary transition-colors">
            <Bell className="w-5 h-5" />
          </button>
          
          <div className="relative" ref={dropdownRef}>
            <div 
              className="flex items-center gap-3 pl-4 border-l border-border-subtle cursor-pointer group"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="flex flex-col items-end hidden sm:flex">
                <span className="text-body-sm font-medium text-fg-primary group-hover:text-accent-glow transition-colors">{displayName}</span>
                <span className="text-caption text-fg-tertiary uppercase tracking-wider">{role}</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-accent-glow flex items-center justify-center text-void font-bold text-body hover:scale-105 transition-transform">
                {initial}
              </div>
            </div>

            {/* User Dropdown */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-48 bg-surface-raised border border-border-strong rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                <div className="p-2 flex flex-col gap-1">
                  {role === 'student' && (
                    <button 
                      onClick={() => { setIsDropdownOpen(false); navigate('/change-password'); }}
                      className="flex items-center gap-3 px-3 py-2 text-body-sm text-fg-secondary hover:text-fg-primary hover:bg-surface-inset rounded-lg transition-colors text-left"
                    >
                      <Key className="w-4 h-4" /> Change Password
                    </button>
                  )}
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2 text-body-sm text-danger hover:bg-danger/10 rounded-lg transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" /> Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
