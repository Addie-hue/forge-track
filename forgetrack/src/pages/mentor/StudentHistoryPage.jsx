import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { SearchCombobox } from '../../components/ui/SearchCombobox';
import { StatusPill } from '../../components/ui/StatusPill';
import { EmptyState } from '../../components/ui/EmptyState';
import { useToast } from '../../components/ui/ToastProvider';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { 
  History, 
  TrendingUp, 
  UserPlus, 
  Edit3, 
  User, 
  Mail, 
  Hash, 
  Briefcase, 
  Calendar,
  ChevronRight,
  MoreVertical,
  CheckCircle2,
  XCircle,
  Clock
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function StudentHistoryPage() {
  const { user } = useAuth();
  const toast = useToast();
  
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({ present: 0, total: 0, rate: 0 });

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    usn: '',
    email: '',
    branch_code: '',
    admission_number: '',
    batch: '2024-2028'
  });

  // 1. Fetch students
  async function fetchStudents() {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('is_active', true)
      .order('name');
      
    if (!error && data) {
      setStudents(data);
      // If we were editing, update the selected student object
      if (selectedStudent) {
        const updated = data.find(s => s.id === selectedStudent.id);
        if (updated) setSelectedStudent(updated);
      }
    }
  }

  useEffect(() => {
    fetchStudents();
  }, []);

  // 2. Fetch history when student selected
  const fetchHistory = useCallback(async () => {
    if (!selectedStudent) return;
    setLoading(true);
    try {
      // Parallel fetch with specific column selection for speed
      const [sessRes, attRes] = await Promise.all([
        supabase.from('sessions').select('id, date, topic, session_type').order('date', { ascending: false }),
        supabase.from('attendance').select('session_id, present, knowledge_score, skill_score').eq('student_id', selectedStudent.id)
      ]);
        
      if (sessRes.error) throw sessRes.error;
      if (attRes.error) throw attRes.error;

      const attMap = {};
      const historyMap = {};
      (attRes.data || []).forEach(a => {
        attMap[a.session_id] = a.present;
        historyMap[a.session_id] = a;
      });

      let presentCount = 0;
      let totalCount = 0;

      const merged = (sessRes.data || []).map(sess => {
        const present = attMap[sess.id];
        const knowledge_score = historyMap[sess.id]?.knowledge_score;
        const skill_score = historyMap[sess.id]?.skill_score;
        
        if (present !== undefined) {
          totalCount++;
          if (present) presentCount++;
        }
        return { ...sess, present, knowledge_score, skill_score };
      });

      setHistory(merged);
      setStats({
        present: presentCount,
        total: totalCount,
        rate: totalCount > 0 ? Math.round((presentCount / totalCount) * 100) : 0
      });

    } catch (error) {
      console.error('History Fetch Error:', error);
      toast.error('Failed to sync records');
    } finally {
      setLoading(false);
    }
  }, [selectedStudent, toast]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  // Modal Actions
  const openAddModal = () => {
    setModalMode('add');
    setFormData({ name: '', usn: '', email: '', branch_code: '', admission_number: '', batch: '2024-2028' });
    setIsModalOpen(true);
  };

  const openEditModal = () => {
    if (!selectedStudent) return;
    setModalMode('edit');
    setFormData({
      name: selectedStudent.name,
      usn: selectedStudent.usn,
      email: selectedStudent.email || '',
      branch_code: selectedStudent.branch_code,
      admission_number: selectedStudent.admission_number || '',
      batch: selectedStudent.batch || '2024-2028'
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (modalMode === 'add') {
        const { error } = await supabase.from('students').insert([formData]);
        if (error) throw error;
        toast.success('Student added successfully');
      } else {
        const { error } = await supabase
          .from('students')
          .update(formData)
          .eq('id', selectedStudent.id);
        if (error) throw error;
        toast.success('Student updated successfully');
      }
      setIsModalOpen(false);
      fetchStudents();
    } catch (error) {
      console.error(error);
      toast.error(error.message || 'Operation failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-10 pb-32 animate-fade-in">
      {/* Premium Header - Refined & Justified */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-border/40 pb-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-accent-glow">
              <div className="w-8 h-8 rounded-lg bg-accent-glow-soft flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <span className="text-micro tracking-[0.2em] uppercase font-bold opacity-80">Analytics Engine</span>
            </div>
            <h1 className="text-display-md font-display text-fg-primary tracking-tight leading-tight">Student History</h1>
            <p className="text-body text-fg-secondary max-w-2xl leading-relaxed">
              Analyze individual attendance trends, manage student profiles, and track semester-wide engagement with precision-mapped analytics.
            </p>
          </div>
          
          <Button 
            onClick={openAddModal} 
            className="h-14 px-8 bg-accent-glow hover:bg-accent-glow-strong text-black font-bold shadow-2xl shadow-accent-glow/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] border-none"
          >
            <UserPlus className="w-5 h-5 mr-2" /> Add Student
          </Button>
        </div>

        {/* Justified Search Bar */}
        <div className="max-w-xl">
          <div className="group relative transition-all duration-300">
            <div className="absolute -inset-1 bg-gradient-to-r from-accent-glow/20 to-transparent rounded-2xl blur opacity-0 group-hover:opacity-100 transition-opacity" />
            <SearchCombobox
              items={students}
              value={selectedStudent}
              onChange={setSelectedStudent}
              placeholder="Search by student name or USN..."
              renderItem={(item) => `${item.name} (${item.usn})`}
              className="bg-surface-inset border-border-strong h-14 shadow-lg rounded-xl relative z-10 text-body"
            />
          </div>
        </div>
      </div>

      {!selectedStudent ? (
        <Card className="flex-1 min-h-[500px] flex items-center justify-center border-dashed border-2 bg-surface-inset/30 group hover:border-accent-glow/50 transition-all duration-500 overflow-hidden relative">
          <div className="absolute inset-0 bg-dot-grid opacity-20" />
          <EmptyState
            icon={User}
            title="Search for a student"
            description="Select a student from the dropdown above to view their attendance metrics and edit their profile."
            className="z-10"
          />
        </Card>
      ) : loading ? (
        <div className="h-[500px] flex flex-col items-center justify-center gap-4 text-fg-tertiary">
          <div className="w-12 h-12 border-4 border-accent-glow/20 border-t-accent-glow rounded-full animate-spin" />
          <span className="text-body font-medium animate-pulse">Aggregating session data...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-scale-in">
          
          {/* Left Column: Student Profile Card */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <Card className="relative overflow-hidden group border-accent-glow/10 hover:border-accent-glow/30 transition-all duration-500">
              <div className="absolute top-0 right-0 p-4 z-20">
                <Button variant="icon" onClick={openEditModal} className="rounded-full bg-surface-raised/80 backdrop-blur-md border-border hover:border-accent-glow hover:text-accent-glow transition-all">
                  <Edit3 className="w-4 h-4" />
                </Button>
              </div>

              {/* Profile Background Glow */}
              <div className="absolute -top-24 -left-24 w-48 h-48 bg-accent-glow/10 blur-[60px] rounded-full group-hover:bg-accent-glow/20 transition-all duration-700" />
              
              <div className="relative z-10 flex flex-col items-center text-center pt-8 pb-6 border-b border-border/50">
                <div className="w-24 h-24 rounded-3xl bg-surface-raised border border-border shadow-raised flex items-center justify-center text-display-sm text-fg-primary mb-5 rotate-3 group-hover:rotate-0 transition-transform duration-500">
                  {selectedStudent.name.charAt(0)}
                </div>
                <h2 className="text-h2 font-display text-fg-primary tracking-tight">{selectedStudent.name}</h2>
                <div className="flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-surface-inset border border-border text-caption font-mono text-fg-tertiary">
                  <Hash className="w-3 h-3" /> {selectedStudent.usn}
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 gap-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1 p-4 rounded-xl bg-surface-inset border border-border/50">
                    <span className="text-micro uppercase text-fg-tertiary">Attendance Rate</span>
                    <div className="flex items-center gap-2">
                      <span className={`text-h2 font-display ${stats.rate >= 75 ? 'text-success' : stats.rate >= 60 ? 'text-warning' : 'text-danger'}`}>
                        {stats.rate}%
                      </span>
                      <TrendingUp className={`w-4 h-4 ${stats.rate >= 75 ? 'text-success' : 'text-warning'}`} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-1 p-4 rounded-xl bg-surface-inset border border-border/50">
                    <span className="text-micro uppercase text-fg-tertiary">Current Status</span>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-2 h-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_var(--success-fg)]" />
                      <span className="text-body-sm font-medium text-success">Active</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-fg-secondary">
                    <div className="w-8 h-8 rounded-lg bg-surface-inset flex items-center justify-center text-fg-tertiary">
                      <Mail className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-micro uppercase text-fg-tertiary">Email</span>
                      <span className="text-body-sm truncate max-w-[200px]">{selectedStudent.email || 'Not provided'}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-fg-secondary">
                    <div className="w-8 h-8 rounded-lg bg-surface-inset flex items-center justify-center text-fg-tertiary">
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-micro uppercase text-fg-tertiary">Branch & Batch</span>
                      <span className="text-body-sm">{selectedStudent.branch_code} • {selectedStudent.batch}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="bg-accent-glow text-white p-6 overflow-hidden relative">
               <div className="absolute top-0 right-0 opacity-10 translate-x-4 -translate-y-4">
                 <Clock className="w-32 h-32" />
               </div>
               <div className="relative z-10 flex flex-col gap-4">
                 <h4 className="text-h3 font-display">Activity Summary</h4>
                 <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col">
                     <span className="text-micro uppercase opacity-70">Present</span>
                     <span className="text-h2">{stats.present}</span>
                   </div>
                   <div className="flex flex-col">
                     <span className="text-micro uppercase opacity-70">Total Recorded</span>
                     <span className="text-h2">{stats.total}</span>
                   </div>
                 </div>
               </div>
            </Card>
          </div>

          {/* Right Column: Attendance Timeline */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Card className="p-0 overflow-hidden flex flex-col h-full shadow-raised border-border-strong">
              <div className="p-6 border-b border-border bg-surface-inset/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent-glow/10 flex items-center justify-center text-accent-glow">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="text-h3 font-display text-fg-primary">Attendance Timeline</h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-caption text-fg-tertiary">Showing {history.length} total sessions</span>
                </div>
              </div>

              <div className="overflow-x-auto flex-1">
                <Table>
                  <TableHeader>
                    <TableRow hover={false} className="bg-surface-inset/30">
                      <TableHead>Date</TableHead>
                      <TableHead>Session Topic</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Marks (K/S)</TableHead>
                      <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {history.length === 0 ? (
                      <TableRow hover={false}>
                        <TableCell colSpan={4} className="h-64 text-center text-fg-tertiary italic">
                          No session records found for this student.
                        </TableCell>
                      </TableRow>
                    ) : (
                      history.map((sess) => (
                        <TableRow key={sess.id} className="group cursor-default">
                          <TableCell className="font-mono text-body-sm text-fg-secondary">
                            <div className="flex items-center gap-3">
                              <div className="w-1.5 h-1.5 rounded-full bg-border group-hover:bg-accent-glow transition-colors" />
                              {format(parseISO(sess.date), 'MMM d, yyyy')}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-fg-primary group-hover:text-accent-glow transition-colors">
                            {sess.topic}
                          </TableCell>
                          <TableCell>
                            <span className={`text-micro uppercase px-2 py-1 rounded-md font-bold tracking-wider ${
                              sess.session_type === 'online' ? 'bg-info-bg text-info-fg' : 'bg-surface-inset text-fg-tertiary'
                            }`}>
                              {sess.session_type}
                            </span>
                          </TableCell>
                          <TableCell>
                            {sess.knowledge_score !== null || sess.skill_score !== null ? (
                              <div className="flex items-center gap-2">
                                <span className="text-caption font-bold text-accent-glow">{sess.knowledge_score ?? '-'}</span>
                                <span className="text-fg-tertiary">/</span>
                                <span className="text-caption font-bold text-success">{sess.skill_score ?? '-'}</span>
                              </div>
                            ) : (
                              <span className="text-caption text-fg-tertiary opacity-40">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {sess.present === true ? (
                              <div className="flex items-center justify-end gap-2 text-success">
                                <CheckCircle2 className="w-4 h-4" />
                                <span className="text-body-sm font-bold uppercase tracking-tight">Present</span>
                              </div>
                            ) : sess.present === false ? (
                              <div className="flex items-center justify-end gap-2 text-danger">
                                <XCircle className="w-4 h-4" />
                                <span className="text-body-sm font-bold uppercase tracking-tight">Absent</span>
                              </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2 text-fg-tertiary italic opacity-50">
                                <Clock className="w-4 h-4" />
                                <span className="text-caption">Not Marked</span>
                              </div>
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

      {/* Student Modal (Add/Edit) */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={modalMode === 'add' ? 'Onboard New Student' : 'Edit Student Profile'}
      >
        <form onSubmit={handleFormSubmit} className="flex flex-col gap-6 p-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              autoFocus
            />
            <Input
              label="USN / Roll Number"
              placeholder="e.g. 4SH24CS001"
              value={formData.usn}
              onChange={(e) => setFormData({ ...formData, usn: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="student@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <Input
              label="Admission Number"
              placeholder="ADM/2024/001"
              value={formData.admission_number}
              onChange={(e) => setFormData({ ...formData, admission_number: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Branch Code"
              placeholder="e.g. CS, IS, EC"
              value={formData.branch_code}
              onChange={(e) => setFormData({ ...formData, branch_code: e.target.value })}
              required
            />
            <Input
              label="Batch"
              placeholder="e.g. 2024-2028"
              value={formData.batch}
              onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border mt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              loading={saving} 
              className="bg-gradient-to-r from-accent-glow to-[#4F46E5] text-white border-none shadow-lg shadow-accent-glow/20 min-w-[140px]"
            >
              {modalMode === 'add' ? 'Register Student' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
