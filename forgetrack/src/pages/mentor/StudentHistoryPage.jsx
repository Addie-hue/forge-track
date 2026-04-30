import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader } from '../../components/ui/Card';
import { SearchCombobox } from '../../components/ui/SearchCombobox';
import { StatusPill } from '../../components/ui/StatusPill';
import { EmptyState } from '../../components/ui/EmptyState';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { History, TrendingUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function StudentHistoryPage() {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]); // Array of { session, present }
  const [stats, setStats] = useState({ present: 0, total: 0, rate: 0 });

  // 1. Fetch students for dropdown
  useEffect(() => {
    async function fetchStudents() {
      const { data, error } = await supabase
        .from('students')
        .select('id, name, usn')
        .eq('is_active', true)
        .order('name');
        
      if (!error && data) {
        setStudents(data);
      }
    }
    fetchStudents();
  }, []);

  // 2. Fetch history when student selected
  useEffect(() => {
    async function fetchHistory() {
      if (!selectedStudent) return;
      setLoading(true);
      try {
        // Fetch all sessions
        const { data: allSessions, error: sessError } = await supabase
          .from('sessions')
          .select('id, date, topic, type')
          .order('date', { ascending: false });
          
        if (sessError) throw sessError;

        // Fetch attendance for this student
        const { data: attendance, error: attError } = await supabase
          .from('attendance')
          .select('session_id, present')
          .eq('student_id', selectedStudent.id);
          
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
        console.error(error);
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, [selectedStudent]);

  return (
    <div className="flex flex-col gap-8 pb-24 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-h1 font-display text-fg-primary tracking-tight">Student History</h1>
          <p className="text-body text-fg-secondary mt-1">View detailed attendance records for any student.</p>
        </div>
        
        <div className="w-full md:w-80">
          <SearchCombobox
            items={students}
            value={selectedStudent}
            onChange={setSelectedStudent}
            placeholder="Search by name or USN..."
            renderItem={(item) => `${item.name} (${item.usn})`}
          />
        </div>
      </div>

      {!selectedStudent ? (
        <Card>
          <EmptyState
            icon={History}
            title="Select a student"
            description="Use the search box above to find a student and view their complete attendance history."
          />
        </Card>
      ) : loading ? (
        <Card>
          <div className="h-64 flex items-center justify-center text-fg-tertiary">Loading history...</div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 animate-scale-in">
          
          {/* Stats Sidebar */}
          <div className="lg:col-span-1 flex flex-col gap-6">
            <Card className="flex flex-col gap-4">
              <div className="flex flex-col items-center text-center pb-4 border-b border-border">
                <div className="w-16 h-16 rounded-full bg-surface-inset border border-border flex items-center justify-center text-h2 text-fg-primary mb-3">
                  {selectedStudent.name.charAt(0)}
                </div>
                <h3 className="text-h3 font-medium text-fg-primary">{selectedStudent.name}</h3>
                <span className="text-caption text-fg-secondary font-mono mt-1">{selectedStudent.usn}</span>
              </div>
              
              <div className="flex flex-col gap-4 pt-2">
                <div>
                  <span className="text-label uppercase text-fg-tertiary">Attendance Rate</span>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-display-sm font-tabular text-fg-primary">{stats.rate}%</span>
                    <TrendingUp className={`w-5 h-5 ${stats.rate >= 75 ? 'text-success' : stats.rate >= 60 ? 'text-warning' : 'text-danger'}`} />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-label uppercase text-fg-tertiary">Classes Attended</span>
                    <div className="text-h2 font-tabular text-success mt-1">{stats.present}</div>
                  </div>
                  <div>
                    <span className="text-label uppercase text-fg-tertiary">Total Recorded</span>
                    <div className="text-h2 font-tabular text-fg-primary mt-1">{stats.total}</div>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* History List */}
          <div className="lg:col-span-3">
            <Card className="p-0 overflow-hidden">
              <div className="p-6 border-b border-border bg-surface-inset/50">
                <h3 className="text-h3 font-medium text-fg-primary">Session Log</h3>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow hover={false}>
                      <TableHead>Date</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow hover={false}>
                        <TableCell colSpan={4} className="h-32 text-center text-fg-tertiary">
                          No sessions found.
                        </TableCell>
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
                              <span className="text-caption text-fg-tertiary italic">Not marked</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </Card>
          </div>

        </div>
      )}
    </div>
  );
}
