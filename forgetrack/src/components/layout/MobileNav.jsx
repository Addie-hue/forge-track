import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Upload,
  UserCheck,
  Calendar,
  MoreHorizontal
} from 'lucide-react';

export function MobileNav() {
  const { isMentor, isStudent } = useAuth();

  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) => `
        flex flex-col items-center justify-center gap-1 w-full h-full
        transition-colors
        ${isActive ? 'text-accent-glow' : 'text-fg-tertiary hover:text-fg-secondary'}
      `}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] font-medium">{label}</span>
    </NavLink>
  );

  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full h-16 bg-surface-raised border-t border-border-strong z-50 flex items-center justify-around px-2 pb-safe">
      {isMentor && (
        <>
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Home" />
          <NavItem to="/attendance" icon={CheckSquare} label="Mark" />
          <NavItem to="/upload" icon={Upload} label="Upload" />
          {/* A 'More' menu could open a drawer for History/Materials/Logout */}
          <div className="flex flex-col items-center justify-center gap-1 w-full h-full text-fg-tertiary cursor-pointer">
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </div>
        </>
      )}

      {isStudent && (
        <>
          <NavItem to="/me/attendance" icon={UserCheck} label="Attendance" />
          <NavItem to="/me/upcoming" icon={Calendar} label="Upcoming" />
          <div className="flex flex-col items-center justify-center gap-1 w-full h-full text-fg-tertiary cursor-pointer">
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </div>
        </>
      )}
    </nav>
  );
}
