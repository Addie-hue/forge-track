import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatStrip } from '../../components/ui/StatStrip';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { Calendar, Users, TrendingUp, Clock, ArrowRight } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function DashboardPage() {
  const { displayName } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeStudents: 0,
    totalSessions: 0,
    attendanceRate: 0,
    lastSessionDate: null
  });
  const [todaySession, setTodaySession] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [todayAttendanceRate, setTodayAttendanceRate] = useState(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        
        // 1. Fetch Students count
        const { count: studentsCount } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('is_active', true);

        // 2. Fetch Sessions count & Last Session
        const { count: sessionsCount } = await supabase
          .from('sessions')
          .select('*', { count: 'exact', head: true });
          
        const { data: lastSession } = await supabase
          .from('sessions')
          .select('date')
          .order('date', { ascending: false })
          .limit(1)
          .maybeSingle();

        // 3. Fetch Overall Attendance Rate
        const { count: presentCount } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true })
          .eq('present', true);
          
        const { count: totalAttendanceCount } = await supabase
          .from('attendance')
          .select('*', { count: 'exact', head: true });

        const overallRate = totalAttendanceCount > 0 
          ? Math.round((presentCount / totalAttendanceCount) * 100) 
          : 0;

        // 4. Fetch Today's Session
        const today = new Date().toISOString().split('T')[0];
        const { data: todaySess } = await supabase
          .from('sessions')
          .select('*')
          .eq('date', today)
          .maybeSingle();
          
        if (todaySess) {
          setTodaySession(todaySess);
          // Get today's attendance stats
          const { count: todayPresent } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', todaySess.id)
            .eq('present', true);
            
          const { count: todayTotal } = await supabase
            .from('attendance')
            .select('*', { count: 'exact', head: true })
            .eq('session_id', todaySess.id);
            
          if (todayTotal > 0) {
            setTodayAttendanceRate(Math.round((todayPresent / todayTotal) * 100));
          }
        }

        // 5. Fetch Recent Sessions (up to 5)
        const { data: recent } = await supabase
          .from('sessions')
          .select('*')
          .order('date', { ascending: false })
          .limit(5);

        if (recent && recent.length > 0) {
          // Fetch attendance for these sessions to calculate rate
          const sessionIds = recent.map(s => s.id);
          const { data: recentAttendance } = await supabase
            .from('attendance')
            .select('session_id, present')
            .in('session_id', sessionIds);
            
          const enrichedRecent = recent.map(session => {
            const sessionAttendance = recentAttendance.filter(a => a.session_id === session.id);
            const present = sessionAttendance.filter(a => a.present).length;
            const total = sessionAttendance.length;
            const rate = total > 0 ? Math.round((present / total) * 100) : null;
            return { ...session, attendanceRate: rate, totalAttendance: total };
          });
          setRecentSessions(enrichedRecent);
        }

        setStats({
          activeStudents: studentsCount || 0,
          totalSessions: sessionsCount || 0,
          attendanceRate: overallRate,
          lastSessionDate: lastSession ? lastSession.date : null
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  const statItems = [
    { label: 'Total Sessions', value: loading ? '--' : stats.totalSessions, icon: Calendar },
    { label: 'Overall Attendance', value: loading ? '--' : `${stats.attendanceRate}%`, icon: TrendingUp },
    { label: 'Active Students', value: loading ? '--' : stats.activeStudents, icon: Users },
    { 
      label: 'Last Session', 
      value: loading ? '--' : (stats.lastSessionDate ? format(parseISO(stats.lastSessionDate), 'MMM d, yyyy') : 'None'), 
      icon: Clock 
    },
  ];

  return (
    <div className="flex flex-col gap-12 pb-12 animate-fade-in stagger-children">
      {/* Hero Section */}
      <section className="flex flex-col gap-2">
        <h1 className="text-display-hero text-fg-primary tracking-tight">
          Welcome Back, {displayName ? displayName.split(' ')[0] : 'Mentor'}
        </h1>
        <p className="text-body-lg text-fg-secondary">
          Here is what's happening with your cohort today.
        </p>
      </section>

      {/* Stat Strip */}
      <section>
        <StatStrip items={statItems} />
      </section>

      {/* Grid Row 1 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Session */}
        <Card hero className="flex flex-col">
          <CardHeader label="Today's Session" />
          {loading ? (
            <div className="flex-1 flex flex-col gap-4">
              <Skeleton variant="text" className="w-48 h-8" />
              <Skeleton variant="text" className="w-full" />
            </div>
          ) : todaySession ? (
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h2 className="text-display-sm text-fg-primary mb-2 line-clamp-2">{todaySession.topic}</h2>
                <div className="flex items-center gap-3 mt-4">
                  <span className="px-2.5 py-1 rounded-md bg-surface-inset text-caption text-fg-secondary border border-border uppercase tracking-wider">
                    {todaySession.type}
                  </span>
                  {todaySession.material_url && (
                    <span className="px-2.5 py-1 rounded-md bg-surface-inset text-caption text-info border border-info-border uppercase tracking-wider">
                      Material Attached
                    </span>
                  )}
                </div>
              </div>
              <div className="mt-auto pt-4 flex gap-3">
                <Button onClick={() => navigate('/attendance')} className="w-full">
                  Update Attendance
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col gap-6">
              <div>
                <h2 className="text-display-sm text-fg-primary mb-1">No session scheduled</h2>
                <p className="text-body text-fg-secondary">There is no session recorded for today yet.</p>
              </div>
              <div className="mt-auto pt-4 flex gap-3">
                <Button onClick={() => navigate('/attendance')} className="w-full" size="lg">
                  Create Session
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Today's Attendance */}
        <Card hero className="flex flex-col">
          <CardHeader label="Today's Attendance" />
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            {loading ? (
              <Skeleton variant="circular" className="w-32 h-32" />
            ) : todayAttendanceRate !== null ? (
              <>
                <div className="relative w-40 h-40 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg-surface-inset)" strokeWidth="8" />
                    <circle 
                      cx="50" cy="50" r="45" fill="none" 
                      stroke={todayAttendanceRate >= 75 ? 'var(--success-fg)' : todayAttendanceRate >= 60 ? 'var(--warning-fg)' : 'var(--danger-fg)'} 
                      strokeWidth="8" 
                      strokeDasharray={`${todayAttendanceRate * 2.827} 282.7`} 
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-display-md font-tabular text-fg-primary">{todayAttendanceRate}%</span>
                  </div>
                </div>
                <p className="text-body font-medium text-fg-secondary mt-4">
                  {todayAttendanceRate >= 75 ? 'Excellent attendance today!' : todayAttendanceRate >= 60 ? 'Attendance is a bit low.' : 'Poor attendance today.'}
                </p>
              </>
            ) : (
              <>
                <h2 className="text-display-md text-fg-tertiary">-- / --</h2>
                <p className="text-body text-fg-tertiary mt-2">Mark attendance first</p>
              </>
            )}
          </div>
        </Card>
      </section>

      {/* Grid Row 2 */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="flex flex-col h-full">
          <CardHeader 
            label="Activity" 
            title="Recent Sessions" 
            action={
              <Button variant="ghost" size="sm" onClick={() => navigate('/history')}>
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            }
          />
          <div className="flex-1 overflow-y-auto pr-2 -mr-2">
            {loading ? (
              <div className="space-y-4">
                {[1,2,3,4].map(i => <Skeleton key={i} variant="text" className="h-12 w-full" />)}
              </div>
            ) : recentSessions.length > 0 ? (
              <div className="space-y-3">
                {recentSessions.map(session => (
                  <div key={session.id} className="p-4 rounded-lg bg-surface-inset border border-border flex items-center justify-between group hover:border-border-strong transition-colors cursor-pointer" onClick={() => navigate('/attendance')}>
                    <div className="flex flex-col gap-1 overflow-hidden pr-4">
                      <span className="text-body font-medium text-fg-primary truncate">{session.topic}</span>
                      <span className="text-caption text-fg-tertiary">{format(parseISO(session.date), 'MMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {session.attendanceRate !== null ? (
                        <div className={`px-2 py-1 rounded font-tabular text-caption font-semibold ${
                          session.attendanceRate >= 75 ? 'bg-success-bg text-success' : 
                          session.attendanceRate >= 60 ? 'bg-warning-bg text-warning' : 'bg-danger-bg text-danger'
                        }`}>
                          {session.attendanceRate}%
                        </div>
                      ) : (
                        <span className="text-caption text-fg-tertiary italic">No data</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex items-center justify-center text-fg-tertiary border border-dashed border-border-subtle rounded-lg">
                No sessions recorded yet.
              </div>
            )}
          </div>
        </Card>

        {/* Quick Actions / Getting Started */}
        <Card>
          <CardHeader label="Quick Actions" title="Manage Cohort" />
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => navigate('/attendance')}
              className="p-5 flex flex-col items-start gap-4 rounded-xl bg-surface-inset border border-border hover:border-accent-glow hover:bg-surface transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-accent-glow-soft text-accent-glow flex items-center justify-center group-hover:scale-110 transition-transform">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-body font-medium text-fg-primary">Mark Attendance</h3>
                <p className="text-caption text-fg-tertiary mt-1 line-clamp-2">Start a new session or update an existing one.</p>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/upload')}
              className="p-5 flex flex-col items-start gap-4 rounded-xl bg-surface-inset border border-border hover:border-success-border hover:bg-surface transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-success-bg text-success flex items-center justify-center group-hover:scale-110 transition-transform">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-body font-medium text-fg-primary">Import CSV</h3>
                <p className="text-caption text-fg-tertiary mt-1 line-clamp-2">Bulk upload attendance from G-Meets via AI.</p>
              </div>
            </button>
            
            <button 
              onClick={() => navigate('/materials')}
              className="p-5 flex flex-col items-start gap-4 rounded-xl bg-surface-inset border border-border hover:border-info-border hover:bg-surface transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-info-bg text-info flex items-center justify-center group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-body font-medium text-fg-primary">Class Materials</h3>
                <p className="text-caption text-fg-tertiary mt-1 line-clamp-2">Upload slides, code files, and recording links.</p>
              </div>
            </button>

            <button 
              onClick={() => navigate('/history')}
              className="p-5 flex flex-col items-start gap-4 rounded-xl bg-surface-inset border border-border hover:border-warning-border hover:bg-surface transition-all text-left group"
            >
              <div className="w-10 h-10 rounded-full bg-warning-bg text-warning flex items-center justify-center group-hover:scale-110 transition-transform">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-body font-medium text-fg-primary">Student History</h3>
                <p className="text-caption text-fg-tertiary mt-1 line-clamp-2">View detailed attendance heatmaps per student.</p>
              </div>
            </button>
          </div>
        </Card>
      </section>
    </div>
  );
}
