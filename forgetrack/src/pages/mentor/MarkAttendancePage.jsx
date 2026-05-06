import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DatePicker } from '../../components/ui/DatePicker';
import { useToast } from '../../components/ui/ToastProvider';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Checkbox } from '../../components/ui/Checkbox';
import { Save, Plus, Search, CheckSquare, Edit2, X, Check } from 'lucide-react';
import { PROGRAM_START_DATE, SESSION_TYPES } from '../../lib/constants';

export function MarkAttendancePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialDate = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(initialDate);
  const [session, setSession] = useState(null); // The actual session object for the date
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({}); // { studentId: boolean }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  // For creating a new session
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newType, setNewType] = useState('offline');

  // For editing existing session
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editTopicValue, setEditTopicValue] = useState('');

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Update URL when date changes
  useEffect(() => {
    if (date !== format(new Date(), 'yyyy-MM-dd')) {
      setSearchParams({ date });
    } else {
      setSearchParams({});
    }
  }, [date, setSearchParams]);

  // 1. Fetch all active students once
  useEffect(() => {
    async function fetchStudents() {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('is_active', true)
        .order('usn');
      if (error) {
        toast.error('Failed to load students');
      } else {
        setStudents(data || []);
      }
    }
    fetchStudents();
  }, [toast]);

  // 2. Fetch session and attendance when date changes
  useEffect(() => {
    async function fetchSessionData() {
      setLoading(true);
      setShowNewSessionForm(false);
      setNewTopic('');
      setAttendance({});
      
      try {
        // 1. Find session for this date
        const { data: sessionData, error: sessionError } = await supabase
          .from('sessions')
          .select('*')
          .eq('date', date)
          .maybeSingle();

        if (sessionError) throw sessionError;

        setSession(sessionData);

        if (sessionData) {
          // 2. Fetch attendance records for this session
          const { data: attData, error: attError } = await supabase
            .from('attendance')
            .select('student_id, present')
            .eq('session_id', sessionData.id);
            
          if (attError) throw attError;

          // Convert array to map: { student_id: present }
          const attMap = {};
          if (attData) {
            attData.forEach(record => {
              attMap[record.student_id] = record.present;
            });
          }
          setAttendance(attMap);
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load session data');
      } finally {
        setLoading(false);
      }
    }

    if (date) {
      fetchSessionData();
    }
  }, [date, toast]);

  // 3. Create a new session
  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          date,
          topic: newTopic,
          month_number: 1,
          session_type: newType
        })
        .select()
        .single();

      if (error) {
        if (error.code === '23505') {
          toast.error('A session already exists for this date.');
        } else {
          throw error;
        }
      } else {
        setSession(data);
        setShowNewSessionForm(false);
        setAttendance({});
        toast.success('Session created successfully');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to create session');
    } finally {
      setSaving(false);
    }
  };

  // 4. Save attendance
  const handleSaveAttendance = async () => {
    if (!session) return;
    setSaving(true);

    try {
      // We need to upsert records. 
      // Prepare array of objects: { session_id, student_id, present, updated_by }
      const recordsToUpsert = students.map(student => {
        // Default to false if not explicitly set
        const isPresent = attendance[student.id] === true;
        return {
          session_id: session.id,
          student_id: student.id,
          present: isPresent,
          marked_by: user.id,
        };
      });

      const { error } = await supabase
        .from('attendance')
        .upsert(recordsToUpsert, { onConflict: 'session_id, student_id' });

      if (error) throw error;
      toast.success('Attendance saved successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save attendance');
    } finally {
      setSaving(false);
    }
  };

  // 5. Update session topic
  const handleUpdateTopic = async () => {
    if (!editTopicValue.trim() || !session) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from('sessions')
        .update({ topic: editTopicValue })
        .eq('id', session.id)
        .select()
        .single();
        
      if (error) throw error;
      
      setSession(data);
      setIsEditingTopic(false);
      toast.success('Session name updated');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update session name');
    } finally {
      setSaving(false);
    }
  };

  // Toggle individual student
  const toggleStudent = (studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  // Bulk actions
  const markAll = (present) => {
    const newAtt = {};
    filteredStudents.forEach(s => {
      newAtt[s.id] = present;
    });
    // Merge with existing for non-filtered
    setAttendance(prev => ({ ...prev, ...newAtt }));
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.usn.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = students.filter(s => attendance[s.id] === true).length;

  return (
    <div className="flex flex-col gap-8 pb-24 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-h1 font-display text-fg-primary tracking-tight">Mark Attendance</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Sidebar: Session Controls */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <Card className="flex flex-col gap-5">
            <div>
              <h3 className="text-h3 font-display text-fg-primary mb-1">Session Date</h3>
              <p className="text-body-sm text-fg-tertiary mb-4">Select a date to view or create a session.</p>
              <DatePicker
                value={date}
                onChange={(e) => setDate(e.target.value)}
                minDate={PROGRAM_START_DATE}
              />
            </div>

            <div className="h-[1px] bg-border-subtle" />

            {loading ? (
              <div className="text-body text-fg-tertiary">Loading session...</div>
            ) : session ? (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-label uppercase text-fg-secondary">Current Session</span>
                  
                  {isEditingTopic ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input 
                        value={editTopicValue}
                        onChange={(e) => setEditTopicValue(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => e.key === 'Enter' && handleUpdateTopic()}
                        className="flex-1"
                      />
                      <button onClick={handleUpdateTopic} disabled={saving} className="p-1.5 bg-success-bg text-success rounded hover:bg-success/20">
                        <Check className="w-4 h-4" />
                      </button>
                      <button onClick={() => setIsEditingTopic(false)} className="p-1.5 bg-surface-inset text-fg-secondary rounded hover:text-fg-primary">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group">
                      <span className="text-body font-medium text-fg-primary break-words pr-2">{session.topic}</span>
                      <button 
                        onClick={() => { setEditTopicValue(session.topic); setIsEditingTopic(true); }}
                        className="p-1 text-fg-tertiary opacity-0 group-hover:opacity-100 transition-opacity hover:text-fg-primary"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded bg-surface-inset border border-border text-micro uppercase tracking-wider text-fg-secondary">
                    {session.session_type}
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <div className="p-3 rounded-md bg-warning-bg border border-warning-border text-body-sm text-warning">
                  No session recorded for this date.
                </div>
                {!showNewSessionForm ? (
                  <Button variant="secondary" onClick={() => setShowNewSessionForm(true)} className="w-full">
                    <Plus className="w-4 h-4" /> Create Session
                  </Button>
                ) : (
                  <form onSubmit={handleCreateSession} className="flex flex-col gap-4 animate-scale-in">
                    <Input
                      label="Session Topic"
                      placeholder="e.g. Intro to Neural Networks"
                      value={newTopic}
                      onChange={(e) => setNewTopic(e.target.value)}
                      required
                      autoFocus
                    />
                    <Select
                      label="Type"
                      value={newType}
                      onChange={(e) => setNewType(e.target.value)}
                      options={SESSION_TYPES.map(t => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t }))}
                    />
                    <div className="flex gap-2">
                      <Button type="button" variant="ghost" className="flex-1" onClick={() => setShowNewSessionForm(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" className="flex-1" loading={saving}>
                        Create
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </Card>

          {/* Stats Summary Card */}
          {session && (
            <Card className="flex flex-col gap-3">
              <h3 className="text-label uppercase text-fg-secondary">Attendance Summary</h3>
              <div className="flex items-center justify-between">
                <span className="text-body text-fg-tertiary">Present</span>
                <span className="text-h3 font-tabular text-success">{presentCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body text-fg-tertiary">Absent</span>
                <span className="text-h3 font-tabular text-danger">{students.length - presentCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-body text-fg-tertiary">Total Class</span>
                <span className="text-h3 font-tabular text-fg-primary">{students.length}</span>
              </div>
            </Card>
          )}
        </div>

        {/* Right Area: Student Roster */}
        <div className="lg:col-span-3">
          <Card className="min-h-[500px] flex flex-col p-0 overflow-hidden relative">
            {!session ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-[image:var(--dot-grid)]">
                <div className="w-16 h-16 bg-surface-inset border border-border rounded-full flex items-center justify-center mb-4">
                  <CheckSquare className="w-8 h-8 text-fg-tertiary" />
                </div>
                <h3 className="text-h3 font-display text-fg-primary mb-2">Ready to mark attendance?</h3>
                <p className="text-body text-fg-secondary max-w-sm">
                  Select an existing session from the left or create a new one for the chosen date to unlock the roster.
                </p>
              </div>
            ) : (
              <>
                {/* Roster Toolbar */}
                <div className="p-4 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface/50 backdrop-blur-md sticky top-0 z-10">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary" />
                    <input
                      type="text"
                      placeholder="Search student or USN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full h-9 pl-9 pr-4 rounded-md bg-surface-inset border border-border text-body focus:outline-none focus:border-accent-glow"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => markAll(true)}>
                      Mark All Present
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => markAll(false)}>
                      Mark All Absent
                    </Button>
                    <Button onClick={handleSaveAttendance} loading={saving} size="sm">
                      <Save className="w-4 h-4" /> Save Changes
                    </Button>
                  </div>
                </div>

                {/* Roster Table */}
                <div className="flex-1 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow hover={false}>
                        <TableHead className="w-12 text-center">#</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>USN</TableHead>
                        <TableHead className="w-32 text-center">Present?</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredStudents.length === 0 ? (
                        <TableRow hover={false}>
                          <TableCell colSpan={4} className="h-32 text-center text-fg-tertiary">
                            No students match your search.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredStudents.map((student, index) => {
                          const isPresent = attendance[student.id] === true;
                          return (
                            <TableRow 
                              key={student.id} 
                              className="cursor-pointer"
                              onClick={() => toggleStudent(student.id)}
                            >
                              <TableCell className="text-center text-fg-tertiary font-tabular text-caption">
                                {index + 1}
                              </TableCell>
                              <TableCell className="font-medium">
                                {student.name}
                              </TableCell>
                              <TableCell className="text-fg-secondary font-mono text-body-sm">
                                {student.usn}
                              </TableCell>
                              <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-center">
                                  <Checkbox 
                                    checked={isPresent} 
                                    onChange={() => toggleStudent(student.id)}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}
          </Card>
        </div>

      </div>
    </div>
  );
}
