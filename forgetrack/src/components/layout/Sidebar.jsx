import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  History,
  BookOpen,
  Upload,
  UserCheck,
  Calendar,
  Settings,
  LogOut,
  Hexagon
} from 'lucide-react';

export function Sidebar() {
  const { isMentor, isStudent, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const NavItem = ({ to, icon: Icon, label, badge }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex items-center justify-between h-11 px-4 rounded-lg transition-colors
        ${isActive 
          ? 'bg-surface-raised text-fg-primary border-l-2 border-accent-glow pl-[14px]' 
          : 'text-fg-secondary hover:bg-surface hover:text-fg-primary'
        }
      `}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 flex-shrink-0" strokeWidth={1.75} />
        <span className="text-body font-medium">{label}</span>
      </div>
      {badge && (
        <span className="text-micro bg-surface-raised text-fg-secondary px-1.5 py-0.5 rounded-full">
          {badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <aside className="hidden md:flex flex-col w-[260px] h-screen bg-canvas border-r border-border-subtle flex-shrink-0 relative z-20">
      {/* Logo Area */}
      <div className="h-20 px-6 flex items-center gap-3 border-b border-border-subtle">
        <div className="w-8 h-8 bg-surface-raised border border-border rounded-lg flex items-center justify-center">
          <Hexagon className="w-5 h-5 text-accent-glow" />
        </div>
        <span className="text-h3 font-display text-fg-primary tracking-tight">ForgeTrack</span>
      </div>

      {/* Scrollable Nav Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 flex flex-col gap-8 hide-scrollbar">
        
        {/* Mentor Navigation */}
        {isMentor && (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-label uppercase text-fg-tertiary px-4 mb-1">Overview</span>
              <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-label uppercase text-fg-tertiary px-4 mb-1">Activity</span>
              <NavItem to="/attendance" icon={CheckSquare} label="Mark Attendance" />
              <NavItem to="/history" icon={History} label="Student History" />
              <NavItem to="/materials" icon={BookOpen} label="Materials" />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-label uppercase text-fg-tertiary px-4 mb-1">Data</span>
              <NavItem to="/upload" icon={Upload} label="Upload CSV" />
            </div>
          </>
        )}

        {/* Student Navigation */}
        {isStudent && (
          <>
            <div className="flex flex-col gap-2">
              <span className="text-label uppercase text-fg-tertiary px-4 mb-1">Overview</span>
              <NavItem to="/me/attendance" icon={UserCheck} label="My Attendance" />
              <NavItem to="/me/upcoming" icon={Calendar} label="Upcoming" />
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="text-label uppercase text-fg-tertiary px-4 mb-1">Resources</span>
              <NavItem to="/me/materials" icon={BookOpen} label="Materials" />
            </div>
          </>
        )}
      </div>

      {/* Footer Nav Area */}
      <div className="p-4 border-t border-border-subtle flex flex-col gap-1">
        <div 
          onClick={handleLogout}
          className="flex items-center gap-3 h-11 px-4 rounded-lg text-fg-secondary hover:bg-surface hover:text-fg-primary transition-colors cursor-pointer"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" strokeWidth={1.75} />
          <span className="text-body font-medium">Logout</span>
        </div>
      </div>
    </aside>
  );
}
