import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { EmptyState } from '../components/ui/EmptyState';
import { Button } from '../components/ui/Button';
import { ShieldAlert } from 'lucide-react';

export function ForbiddenPage() {
  const navigate = useNavigate();
  const { role } = useAuth();

  const handleGoBack = () => {
    if (role === 'mentor') {
      navigate('/dashboard');
    } else if (role === 'student') {
      navigate('/me/attendance');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-surface-raised border border-border rounded-2xl p-8" style={{ boxShadow: 'var(--shadow-raised)' }}>
        <EmptyState
          icon={ShieldAlert}
          title="Access Denied"
          description="You don't have permission to view this page. If you believe this is a mistake, contact your mentor."
          action={
            <Button onClick={handleGoBack} size="lg">
              Return to Safety
            </Button>
          }
        />
      </div>
    </div>
  );
}
