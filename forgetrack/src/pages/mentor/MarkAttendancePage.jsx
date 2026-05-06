import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { DatePicker } from '../../components/ui/DatePicker';
import { useToast } from '../../components/ui/ToastProvider';
import { Badge } from '../../components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Checkbox } from '../../components/ui/Checkbox';
import { Save, Plus, Search, CheckSquare, Edit2, X, Check, Loader2, Calendar } from 'lucide-react';
import { PROGRAM_START_DATE, SESSION_TYPES } from '../../lib/constants';

export function MarkAttendancePage() {
  const { user } = useAuth();
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const initialDate = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');
  const [date, setDate] = useState(initialDate);
  const [session, setSession] = useState(null);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [showNewSessionForm, setShowNewSessionForm] = useState(false);
  const [newTopic, setNewTopic] = useState('');
  const [newType, setNewType] = useState('offline');

  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editTopicValue, setEditTopicValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const [monthlySessions, setMonthlySessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  useEffect(() => {
    if (date !== format(new Date(), 'yyyy-MM-dd')) {
      setSearchParams({ date });
    } else {
      setSearchParams({});
    }
  }, [date, setSearchParams]);

  // 1. Fetch all active students once
  const fetchStudents = useCallback(async () => {
    const { data, error } = await supabase
      .from('students')
      .select('id, name, usn, branch_code')
      .eq('is_active', true)
      .order('usn');
    if (!error) setStudents(data || []);
  }, []);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // 2. Fetch session and attendance when date changes
  const fetchSessionData = useCallback(async () => {
    if (!date) return;
    setLoading(true);
    setShowNewSessionForm(false);
    setNewTopic('');
    setAttendance({});
    
    try {
      // Parallel fetch for session and monthly sessions
      const [sessRes, attRes] = await Promise.all([
        supabase.from('sessions').select('id, topic, date, session_type').eq('date', date).maybeSingle(),
        (async () => {
           const d = parseISO(date);
           const monthStart = format(new Date(d.getFullYear(), d.getMonth(), 1), 'yyyy-MM-01');
           const monthEnd = format(new Date(d.getFullYear(), d.getMonth() + 1, 0), 'yyyy-MM-dd');
           return supabase.from('sessions').select('id, date, topic, session_type').gte('date', monthStart).lte('date', monthEnd).order('date', { ascending: false });
        })()
      ]);

      if (sessRes.error) throw sessRes.error;
      setSession(sessRes.data);
      setMonthlySessions(attRes.data || []);

      if (sessRes.data) {
        const { data: attData, error: attError } = await supabase
          .from('attendance')
          .select('student_id, present')
          .eq('session_id', sessRes.data.id);
          
        if (attError) throw attError;
        const attMap = {};
        (attData || []).forEach(r => attMap[r.student_id] = r.present);
        setAttendance(attMap);
      }
    } catch (error) {
      console.error('Session Load Error:', error);
      toast.error('Failed to sync session');
    } finally {
      setLoading(false);
    }
  }, [date, toast]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  const handleCreateSession = async (e) => {
    e.preventDefault();
    if (!newTopic.trim()) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from('sessions').insert({
        date, topic: newTopic, month_number: 1, session_type: newType
      }).select().single();
      if (error) throw error;
      setSession(data);
      setShowNewSessionForm(false);
      toast.success('Session created');
    } catch (e) {
      toast.error('Failed to create session');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAttendance = async () => {
    if (!session) return;
    setSaving(true);
    try {
      const records = students.map(s => ({
        session_id: session.id, student_id: s.id, present: attendance[s.id] === true, marked_by: user.id
      }));
      const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'session_id, student_id' });
      if (error) throw error;
      toast.success('Saved!');
    } catch (e) {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleStudent = (id) => setAttendance(p => ({ ...p, [id]: !p[id] }));
  const filteredStudents = useMemo(() => {
    return (students || []).filter(s => 
      (s.name?.toLowerCase() || '').includes(searchQuery.toLowerCase()) || 
      (s.usn?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );
  }, [students, searchQuery]);
  const presentCount = useMemo(() => {
    return (students || []).filter(s => attendance[s.id] === true).length;
  }, [students, attendance]);
  const getMonthName = () => { try { return format(parseISO(date), 'MMMM'); } catch { return ''; } };

  return (
    <div className="flex flex-col gap-10 pb-32 animate-fade-in max-w-7xl mx-auto w-full">
      <div className="flex flex-col gap-3">
        <h1 className="text-display-md font-display text-fg-primary tracking-tight leading-none">Attendance Log</h1>
        <p className="text-body-lg text-fg-secondary">Pick a session below to start marking participation.</p>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* Session Selector - Now on Top */}
        <Card className="p-0 overflow-hidden border-accent-glow/10 shadow-2xl bg-surface-raised">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-border">
            {/* Date Selection */}
            <div className="p-6 md:w-80 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-micro uppercase text-accent-glow font-bold tracking-widest">Step 1: Pick Date</span>
                <h3 className="text-h3 font-display text-fg-primary">Choose Date</h3>
              </div>
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-accent-glow/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                <DatePicker value={date} onChange={(e) => setDate(e.target.value)} minDate={PROGRAM_START_DATE} className="relative z-10 h-12" />
              </div>
            </div>

            {/* Monthly Sessions Horizontal List */}
            <div className="flex-1 p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-micro uppercase text-fg-tertiary font-bold tracking-widest">Step 2: Select Session</span>
                  <h3 className="text-h3 font-display text-fg-primary">{getMonthName()} History</h3>
                </div>
                <Badge variant="outline" className="bg-surface-inset">{monthlySessions.length} Total</Badge>
              </div>
              
              <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
                {sessionsLoading ? (
                  <div className="h-20 flex items-center justify-center w-full"><Loader2 className="w-6 h-6 animate-spin text-fg-tertiary" /></div>
                ) : monthlySessions.length > 0 ? (
                  monthlySessions.map(ms => (
                    <button
                      key={ms.id}
                      onClick={() => setDate(ms.date)}
                      className={`flex-shrink-0 text-left p-4 rounded-xl border transition-all flex flex-col gap-2 min-w-[180px] ${
                        ms.date === date 
                          ? 'bg-accent-glow text-black border-accent-glow shadow-lg shadow-accent-glow/20' 
                          : 'bg-surface-inset border-border hover:border-accent-glow/30 hover:bg-surface'
                      }`}
                    >
                      <span className={`text-body-sm font-bold truncate ${ms.date === date ? 'text-black' : 'text-fg-primary'}`}>{ms.topic}</span>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono ${ms.date === date ? 'text-black/70' : 'text-fg-tertiary'}`}>{format(parseISO(ms.date), 'MMM d')}</span>
                        <span className={`text-[10px] uppercase font-bold tracking-tighter ${ms.date === date ? 'text-black/70' : 'text-fg-tertiary'}`}>{ms.session_type}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="flex-1 flex items-center justify-center py-6 bg-surface-inset rounded-xl border border-dashed border-border gap-2">
                    <Calendar className="w-5 h-5 opacity-20" />
                    <span className="text-caption text-fg-tertiary italic">No sessions found for this month</span>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="p-6 md:w-72 flex flex-col justify-center bg-surface-inset/30">
              {!session && !showNewSessionForm ? (
                <Button onClick={() => setShowNewSessionForm(true)} className="w-full h-12 bg-accent-glow text-black font-bold">
                  <Plus className="w-4 h-4 mr-2" /> New Session
                </Button>
              ) : session ? (
                <div className="flex flex-col gap-2">
                   <span className="text-micro uppercase text-fg-tertiary font-bold">Active Topic</span>
                   <span className="text-body font-bold text-fg-primary truncate">{session.topic}</span>
                   <Button variant="ghost" size="sm" className="text-accent-glow self-start -ml-2" onClick={() => setDate(format(new Date(), 'yyyy-MM-dd'))}>Reset to Today</Button>
                </div>
              ) : null}
            </div>
          </div>
        </Card>

        {/* Create Session Form Overlay */}
        {showNewSessionForm && !session && (
          <Card className="animate-scale-in border-accent-glow/20 bg-accent-glow-soft/5">
             <form onSubmit={handleCreateSession} className="flex flex-col md:flex-row items-end gap-4">
                <div className="flex-1 w-full">
                  <Input label="Session Topic" placeholder="e.g. Lab Session 01" value={newTopic} onChange={(e) => setNewTopic(e.target.value)} required autoFocus />
                </div>
                <div className="w-full md:w-48">
                  <Select label="Type" value={newType} onChange={(e) => setNewType(e.target.value)} options={SESSION_TYPES.map(t => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t }))} />
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="ghost" onClick={() => setShowNewSessionForm(false)}>Cancel</Button>
                  <Button type="submit" loading={saving} className="bg-accent-glow text-black">Create Session</Button>
                </div>
             </form>
          </Card>
        )}

        {/* Roster Area */}
        <Card className="min-h-[600px] flex flex-col p-0 overflow-hidden relative shadow-2xl border-accent-glow/5">
          {!session ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-dot-grid relative">
              <div className="relative z-10 flex flex-col items-center">
                <div className="w-20 h-20 bg-surface-raised border border-border rounded-3xl flex items-center justify-center mb-6 shadow-xl rotate-3">
                  <CheckSquare className="w-8 h-8 text-accent-glow" />
                </div>
                <h3 className="text-h3 font-display text-fg-primary mb-3">Roster Locked</h3>
                <p className="text-body text-fg-secondary max-w-sm">Select a session from the history above or create a new one to unlock the attendance sheet.</p>
              </div>
            </div>
          ) : (
            <>
              <div className="p-5 border-b border-border flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface/90 backdrop-blur-2xl sticky top-0 z-10">
                <div className="flex flex-col gap-1">
                  <h3 className="text-h3 font-display text-fg-primary">{session.topic}</h3>
                  <div className="flex items-center gap-2 text-caption text-fg-tertiary font-bold uppercase tracking-tighter">
                     <span className="text-accent-glow">{presentCount} Present</span>
                     <span className="w-1 h-1 rounded-full bg-border" />
                     <span>{format(parseISO(session.date), 'MMMM d')}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fg-tertiary" />
                    <input type="text" placeholder="Quick search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-11 pl-10 pr-4 rounded-xl bg-surface-inset border border-border text-body focus:outline-none focus:border-accent-glow transition-all shadow-inner" />
                  </div>
                  <Button onClick={handleSaveAttendance} loading={saving} className="bg-accent-glow text-black h-11 px-8 font-bold shadow-lg shadow-accent-glow/20 rounded-xl">
                    <Save className="w-4 h-4 mr-2" /> Save Attendance
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow hover={false}>
                      <TableHead className="w-12 text-center">#</TableHead>
                      <TableHead>Student Details</TableHead>
                      <TableHead>USN / ID</TableHead>
                      <TableHead className="w-32 text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStudents.map((student, index) => {
                      const isPresent = attendance[student.id] === true;
                      return (
                        <TableRow key={student.id} className={`cursor-pointer group ${isPresent ? 'bg-success-bg/5' : ''}`} onClick={() => toggleStudent(student.id)}>
                          <TableCell className="text-center text-fg-tertiary font-tabular text-caption">{index + 1}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className={`font-medium ${isPresent ? 'text-success' : 'text-fg-primary'}`}>{student.name}</span>
                              <span className="text-micro text-fg-tertiary uppercase tracking-wider">{student.branch_code || 'CS'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-fg-secondary font-mono text-body-sm">{student.usn}</TableCell>
                          <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center">
                              <button onClick={() => toggleStudent(student.id)} className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isPresent ? 'bg-success text-white' : 'bg-surface-inset border border-border'}`}>
                                <Check className={`w-5 h-5 ${isPresent ? 'scale-110' : 'scale-90 opacity-10'}`} />
                              </button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
