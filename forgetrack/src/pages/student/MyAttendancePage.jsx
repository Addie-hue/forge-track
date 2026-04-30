import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader } from '../../components/ui/Card';
import { StatusPill } from '../../components/ui/StatusPill';
import { Skeleton } from '../../components/ui/Skeleton';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { TrendingUp, UserCheck, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function MyAttendancePage() {
  const { displayName, studentId } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [studentInfo, setStudentInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ present: 0, total: 0, rate: 0 });

  useEffect(() => {
    async function fetchAttendance() {
      if (!studentId) return;
      setLoading(true);
      try {
        // 1. Fetch student info
        const { data: studentData, error: stuError } = await supabase
          .from('students')
          .select('*')
          .eq('id', studentId)
          .single();
          
        if (!stuError && studentData) {
          setStudentInfo(studentData);
        }

        // 2. Fetch all sessions (so we know total classes held)
        // Note: Students can read all sessions via RLS
        const { data: allSessions, error: sessError } = await supabase
          .from('sessions')
          .select('id, date, topic, type')
          .order('date', { ascending: false });
          
        if (sessError) throw sessError;

        // 3. Fetch this student's attendance records
        const { data: attendance, error: attError } = await supabase
          .from('attendance')
          .select('session_id, present')
          .eq('student_id', studentId);
          
        if (attError) throw attError;

        // Map attendance to sessions
        const attMap = {};
        attendance.forEach(a => {
          attMap[a.session_id] = a.present;
        });

        let presentCount = 0;
        let totalCount = 0;

        const mergedHistory = allSessions.map(sess => {
          const present = attMap[sess.id];
          if (present !== undefined) {
            totalCount++;
            if (present) presentCount++;
          }
          return {
            ...sess,
            present: present // undefined means unmarked
          };
        });

        setHistory(mergedHistory);
        setStats({
          present: presentCount,
          total: totalCount,
          rate: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
        });

      } catch (error) {
        console.error('Error fetching attendance:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAttendance();
  }, [studentId]);

  return (
    <div className="flex flex-col gap-8 pb-24 animate-fade-in stagger-children">
      <section className="flex flex-col gap-2">
        <h1 className="text-display-lg text-fg-primary tracking-tight">
          {displayName}
        </h1>
        {loading ? (
          <Skeleton variant="text" className="w-64 h-6" />
        ) : (
          <p className="text-body-sm text-fg-tertiary font-mono">
            {studentInfo?.usn || 'Unknown USN'} • Active Student
          </p>
        )}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card hero className="lg:col-span-1 flex flex-col items-center justify-center text-center p-8">
          <h3 className="text-label uppercase text-fg-secondary mb-6">Your Attendance Rate</h3>
          {loading ? (
            <Skeleton variant="circular" className="w-32 h-32" />
          ) : (
            <>
              <div className="relative w-40 h-40 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="45" fill="none" stroke="var(--bg-surface-inset)" strokeWidth="8" />
                  <circle 
                    cx="50" cy="50" r="45" fill="none" 
                    stroke={stats.rate >= 75 ? 'var(--success-fg)' : stats.rate >= 60 ? 'var(--warning-fg)' : 'var(--danger-fg)'} 
                    strokeWidth="8" 
                    strokeDasharray={`${stats.rate * 2.827} 282.7`} 
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-display-md font-tabular text-fg-primary">{stats.rate}%</span>
                </div>
              </div>
              <p className="text-body font-medium text-fg-secondary mt-6">
                {stats.rate >= 75 ? 'Great job! Keep it up.' : stats.rate >= 60 ? 'You are falling behind.' : 'Critical attendance warning!'}
              </p>
            </>
          )}
        </Card>

        <Card className="lg:col-span-2 flex flex-col justify-center">
          <div className="grid grid-cols-2 gap-8 p-4">
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 rounded-full bg-success-bg text-success flex items-center justify-center mb-2">
                <UserCheck className="w-6 h-6" />
              </div>
              <span className="text-label uppercase text-fg-tertiary">Classes Attended</span>
              <span className="text-display-lg text-fg-primary font-tabular">
                {loading ? '--' : stats.present}
              </span>
            </div>
            
            <div className="flex flex-col gap-2">
              <div className="w-12 h-12 rounded-full bg-surface-inset border border-border text-fg-secondary flex items-center justify-center mb-2">
                <Calendar className="w-6 h-6" />
              </div>
              <span className="text-label uppercase text-fg-tertiary">Total Sessions</span>
              <span className="text-display-lg text-fg-primary font-tabular">
                {loading ? '--' : stats.total}
              </span>
            </div>
          </div>
        </Card>
      </section>

      <section>
        <Card className="p-0 overflow-hidden">
          <CardHeader label="Log" title="Detailed History" className="p-6 border-b border-border bg-surface-inset/30" />
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow hover={false}>
                  <TableHead>Date</TableHead>
                  <TableHead>Session Topic</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow hover={false}>
                    <TableCell colSpan={4} className="h-32 text-center text-fg-tertiary">Loading history...</TableCell>
                  </TableRow>
                ) : history.length === 0 ? (
                  <TableRow hover={false}>
                    <TableCell colSpan={4} className="h-32 text-center text-fg-tertiary">No sessions recorded yet.</TableCell>
                  </TableRow>
                ) : (
                  history.map((sess) => (
                    <TableRow key={sess.id}>
                      <TableCell className="font-mono text-body-sm text-fg-secondary">
                        {format(parseISO(sess.date), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell className="font-medium">
                        {sess.topic}
                      </TableCell>
                      <TableCell>
                        <span className="text-micro uppercase text-fg-tertiary tracking-wider bg-surface-inset px-2 py-1 rounded">
                          {sess.type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        {sess.present === true ? (
                          <StatusPill variant="success">Present</StatusPill>
                        ) : sess.present === false ? (
                          <StatusPill variant="danger">Absent</StatusPill>
                        ) : (
                          <span className="text-caption text-fg-tertiary italic">Pending</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      </section>
    </div>
  );
}
