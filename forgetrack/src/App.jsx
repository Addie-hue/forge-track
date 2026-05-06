import { useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { AppShell } from './components/layout/AppShell';

// Pages - Lazy Loaded
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));
const ForbiddenPage = lazy(() => import('./pages/ForbiddenPage').then(m => ({ default: m.ForbiddenPage })));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage').then(m => ({ default: m.ChangePasswordPage })));

// Mentor Pages - Lazy Loaded
const DashboardPage = lazy(() => import('./pages/mentor/DashboardPage').then(m => ({ default: m.DashboardPage })));
const MarkAttendancePage = lazy(() => import('./pages/mentor/MarkAttendancePage').then(m => ({ default: m.MarkAttendancePage })));
const StudentHistoryPage = lazy(() => import('./pages/mentor/StudentHistoryPage').then(m => ({ default: m.StudentHistoryPage })));
const MaterialsPage = lazy(() => import('./pages/mentor/MaterialsPage').then(m => ({ default: m.MaterialsPage })));
const CsvUploadPage = lazy(() => import('./pages/mentor/CsvUploadPage').then(m => ({ default: m.CsvUploadPage })));

// Student Pages - Lazy Loaded
const MyAttendancePage = lazy(() => import('./pages/student/MyAttendancePage').then(m => ({ default: m.MyAttendancePage })));
const UpcomingPage = lazy(() => import('./pages/student/UpcomingPage').then(m => ({ default: m.UpcomingPage })));
const MyMaterialsPage = lazy(() => import('./pages/student/MyMaterialsPage').then(m => ({ default: m.MyMaterialsPage })));

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
    <Suspense fallback={<FullScreenLoader />}>
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
    </Suspense>
  );
}
