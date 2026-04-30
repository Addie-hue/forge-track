import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/ToastProvider';
import { ShieldAlert } from 'lucide-react';

export function ChangePasswordPage() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { changePassword, role } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(newPassword);
      toast.success('Password updated successfully!');
      
      // Redirect based on role
      if (role === 'mentor') {
        navigate('/dashboard');
      } else {
        navigate('/me/attendance');
      }
    } catch (err) {
      setError(err.message || 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void bg-[image:var(--glow-cosmic)] bg-no-repeat bg-top flex flex-col items-center justify-center p-6">
      
      <div className="flex flex-col items-center gap-4 mb-8 text-center animate-fade-in-up">
        <div className="w-12 h-12 bg-warning-bg border border-warning-border rounded-xl flex items-center justify-center text-warning">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h1 className="text-h2 font-display text-fg-primary">Action Required</h1>
        <p className="text-body text-fg-secondary max-w-[360px]">
          Since this is your first time logging in, you must change your default password before continuing.
        </p>
      </div>

      <Card className="w-full max-w-[440px] animate-scale-in">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            autoComplete="new-password"
            error={error && !newPassword ? error : undefined}
          />
          
          <Input
            label="Confirm New Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            autoComplete="new-password"
            error={error && newPassword ? error : undefined}
          />

          <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
            Update Password & Continue
          </Button>
        </form>
      </Card>
      
    </div>
  );
}
