import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useToast } from '../components/ui/ToastProvider';
import { Hexagon } from 'lucide-react';

export function LoginPage() {
  const [activeTab, setActiveTab] = useState('mentor');
  const [identifier, setIdentifier] = useState(''); // email or usn
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!identifier || !password) return;

    setLoading(true);
    try {
      const emailToUse = activeTab === 'student' 
        ? `${identifier.toLowerCase()}@forge.local` 
        : identifier;

      await login(emailToUse, password);
      
      // The ProtectedRoute logic in App.jsx will handle redirecting 
      // based on role, but we can also manually navigate if needed.
      // Wait a tiny bit for the AuthContext to fetch the profile
      setTimeout(() => {
        if (activeTab === 'student' && password === identifier.toUpperCase()) {
          navigate('/change-password');
        } else {
          navigate('/'); // App.jsx will route to correct dashboard
        }
      }, 500);

    } catch (error) {
      toast.error('Invalid credentials. Please try again.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-void bg-[image:var(--glow-cosmic)] bg-no-repeat bg-top flex flex-col items-center justify-center p-6">
      
      <div className="flex flex-col items-center gap-4 mb-8 text-center animate-fade-in-up">
        <div className="w-12 h-12 bg-surface-raised border border-border rounded-xl flex items-center justify-center">
          <Hexagon className="w-8 h-8 text-accent-glow" />
        </div>
        <h1 className="text-display-sm text-fg-primary">ForgeTrack</h1>
        <p className="text-body text-fg-secondary">Attendance & Material Tracker</p>
      </div>

      <Card className="w-full max-w-[440px] animate-scale-in">
        {/* Tab Toggle */}
        <div className="flex p-1 bg-surface-inset border border-border rounded-lg mb-8">
          <button
            onClick={() => { setActiveTab('mentor'); setIdentifier(''); setPassword(''); }}
            className={`flex-1 py-2 rounded-md text-body font-medium transition-all duration-200 ${
              activeTab === 'mentor' 
                ? 'bg-surface-raised text-fg-primary shadow-card border border-border' 
                : 'text-fg-tertiary hover:text-fg-secondary'
            }`}
          >
            Mentor Login
          </button>
          <button
            onClick={() => { setActiveTab('student'); setIdentifier(''); setPassword(''); }}
            className={`flex-1 py-2 rounded-md text-body font-medium transition-all duration-200 ${
              activeTab === 'student' 
                ? 'bg-surface-raised text-fg-primary shadow-card border border-border' 
                : 'text-fg-tertiary hover:text-fg-secondary'
            }`}
          >
            Student Login
          </button>
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          <Input
            label={activeTab === 'mentor' ? 'Email Address' : 'University Seat Number (USN)'}
            placeholder={activeTab === 'mentor' ? 'name@theboringpeople.in' : '4SH24CS001'}
            type={activeTab === 'mentor' ? 'email' : 'text'}
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            required
            autoComplete={activeTab === 'mentor' ? 'email' : 'username'}
          />
          
          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            helper={activeTab === 'student' ? 'Default password is your USN (uppercase)' : null}
          />

          <Button type="submit" loading={loading} className="w-full mt-2" size="lg">
            Sign In
          </Button>
          
          {activeTab === 'mentor' && (
            <p className="text-center text-body-sm text-fg-tertiary mt-2">
              <a href="#" className="hover:text-fg-primary transition-colors">Forgot password?</a>
            </p>
          )}
        </form>
      </Card>
      
    </div>
  );
}
