import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AppShell } from './components/layout/AppShell';

// Pages
import { LoginPage } from './pages/LoginPage';
import { ForbiddenPage } from './pages/ForbiddenPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';

// Mentor Pages
import { DashboardPage } from './pages/mentor/DashboardPage';
import { MarkAttendancePage } from './pages/mentor/MarkAttendancePage';
import { StudentHistoryPage } from './pages/mentor/StudentHistoryPage';
import { MaterialsPage } from './pages/mentor/MaterialsPage';
import { CsvUploadPage } from './pages/mentor/CsvUploadPage';

// Student Pages
import { MyAttendancePage } from './pages/student/MyAttendancePage';
import { UpcomingPage } from './pages/student/UpcomingPage';
import { MyMaterialsPage } from './pages/student/MyMaterialsPage';

// Loader
import { Hexagon } from 'lucide-react';

function FullScreenLoader() {
  return (
    <div className="min-h-screen bg-void flex items-center justify-center">
      <Hexagon className="w-12 h-12 text-accent-glow animate-pulse" />
    </div>
  );
}

// Route Guards
function ProtectedRoute({ children, allowedRoles }) {
  const { isAuthenticated, role, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullScreenLoader />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />;
  }

  return children;
}

// Intelligent root redirect based on role
function RootRedirect() {
  const { role, loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  if (role === 'mentor') return <Navigate to="/dashboard" replace />;
  if (role === 'student') return <Navigate to="/me/attendance" replace />;
  
  return <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      {/* Must be authenticated to change password */}
      <Route 
        path="/change-password" 
        element={
          <ProtectedRoute>
            <ChangePasswordPage />
          </ProtectedRoute>
        } 
      />

      {/* Root redirect */}
      <Route path="/" element={<RootRedirect />} />

      {/* App Shell Routes (Protected) */}
      <Route element={<AppShell />}>
        
        {/* Mentor Only Routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute allowedRoles={['mentor']}>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/attendance" 
          element={
            <ProtectedRoute allowedRoles={['mentor']}>
              <MarkAttendancePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/history" 
          element={
            <ProtectedRoute allowedRoles={['mentor']}>
              <StudentHistoryPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/materials" 
          element={
            <ProtectedRoute allowedRoles={['mentor']}>
              <MaterialsPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/upload" 
          element={
            <ProtectedRoute allowedRoles={['mentor']}>
              <CsvUploadPage />
            </ProtectedRoute>
          } 
        />

        {/* Student Only Routes */}
        <Route 
          path="/me/attendance" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <MyAttendancePage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/me/upcoming" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <UpcomingPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/me/materials" 
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <MyMaterialsPage />
            </ProtectedRoute>
          } 
        />

      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
