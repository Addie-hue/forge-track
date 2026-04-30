import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  CheckSquare,
  Upload,
  UserCheck,
  Calendar,
  MoreHorizontal,
  History,
  BookOpen,
  LogOut,
  X
} from 'lucide-react';

export function MobileNav() {
  const { isMentor, isStudent, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

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
          {/* A 'More' menu opens a drawer for History/Materials/Logout */}
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 w-full h-full text-fg-tertiary hover:text-fg-secondary"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </>
      )}

      {isStudent && (
        <>
          <NavItem to="/me/attendance" icon={UserCheck} label="Attendance" />
          <NavItem to="/me/upcoming" icon={Calendar} label="Upcoming" />
          <button 
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-1 w-full h-full text-fg-tertiary hover:text-fg-secondary"
          >
            <MoreHorizontal className="w-5 h-5" />
            <span className="text-[10px] font-medium">Menu</span>
          </button>
        </>
      )}

      {/* Slide-up Menu Drawer */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end bg-void/80 backdrop-blur-sm animate-fade-in" onClick={() => setIsMenuOpen(false)}>
          <div className="w-full bg-surface-raised border-t border-border-strong rounded-t-2xl p-6 pb-safe animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-h3 font-medium text-fg-primary">Menu</h3>
              <button onClick={() => setIsMenuOpen(false)} className="p-2 text-fg-tertiary hover:text-fg-primary bg-surface-inset rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex flex-col gap-2">
              {isMentor && (
                <>
                  <NavLink to="/history" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-4 rounded-xl hover:bg-surface-inset text-fg-secondary hover:text-fg-primary transition-colors">
                    <History className="w-5 h-5" />
                    <span className="font-medium">Student History</span>
                  </NavLink>
                  <NavLink to="/materials" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-4 rounded-xl hover:bg-surface-inset text-fg-secondary hover:text-fg-primary transition-colors">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">Materials</span>
                  </NavLink>
                </>
              )}
              {isStudent && (
                <>
                  <NavLink to="/me/materials" onClick={() => setIsMenuOpen(false)} className="flex items-center gap-3 p-4 rounded-xl hover:bg-surface-inset text-fg-secondary hover:text-fg-primary transition-colors">
                    <BookOpen className="w-5 h-5" />
                    <span className="font-medium">My Materials</span>
                  </NavLink>
                </>
              )}
              <button onClick={handleLogout} className="flex items-center gap-3 p-4 rounded-xl hover:bg-danger/10 text-danger transition-colors w-full text-left mt-2">
                <LogOut className="w-5 h-5" />
                <span className="font-medium">Log Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
