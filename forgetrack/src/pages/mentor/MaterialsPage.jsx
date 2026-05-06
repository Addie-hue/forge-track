import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/ToastProvider';
import { Badge } from '../../components/ui/Badge';
import { BookOpen, Plus, ExternalLink, Link2, Trash2, ChevronLeft, ChevronRight, Calendar, FileUp, Loader2, RefreshCw, FileText, Video, Presentation } from 'lucide-react';
import { MATERIAL_TYPES } from '../../lib/constants';
import { format, parseISO, startOfMonth, endOfMonth, addMonths, subMonths, isValid } from 'date-fns';

export function MaterialsPage() {
  const { user } = useAuth();
  const toast = useToast();
  
  const [materials, setMaterials] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    session_id: '',
    title: '',
    type: 'document',
    url: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadAll();
  }, [currentDate]);

  const loadAll = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const monthStart = format(startOfMonth(currentDate), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(currentDate), 'yyyy-MM-dd');

      // Fetch sessions and materials in parallel for speed
      const [sessRes, matsRes] = await Promise.all([
        supabase
          .from('sessions')
          .select('id, topic, date')
          .gte('date', monthStart)
          .lte('date', monthEnd)
          .order('date', { ascending: false }),
        supabase
          .from('materials')
          .select('*')
          .order('created_at', { ascending: false })
      ]);

      if (sessRes.error) throw sessRes.error;
      if (matsRes.error) throw matsRes.error;

      setSessions(sessRes.data || []);
      setMaterials(matsRes.data || []);
    } catch (error) {
      console.error('Fetch Error:', error);
      toast.error('Failed to sync content');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!formData.session_id || !formData.title) {
      toast.error('Session and Title are required');
      return;
    }
    if (!formData.url && !selectedFile) {
      toast.error('Please provide a URL or upload a file');
      return;
    }

    setSaving(true);
    setUploadProgress(10);
    try {
      let finalUrl = formData.url;
      let finalType = formData.type;

      if (selectedFile) {
        const fileExt = selectedFile.name.split('.').pop().toLowerCase();
        // Use a cleaner file naming convention
        const cleanName = selectedFile.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const filePath = `${formData.session_id}/${Date.now()}_${cleanName}`;

        // Auto-detect type
        if (['pdf', 'doc', 'docx', 'txt'].includes(fileExt)) finalType = 'document';
        else if (['ppt', 'pptx', 'key'].includes(fileExt)) finalType = 'slides';
        else if (['mp4', 'mov', 'avi', 'mkv'].includes(fileExt)) finalType = 'recording';

        setUploadProgress(30);
        const { error: uploadError } = await supabase.storage
          .from('materials')
          .upload(filePath, selectedFile, { cacheControl: '3600', upsert: true });

        if (uploadError) throw uploadError;

        setUploadProgress(70);
        const { data: { publicUrl } } = supabase.storage.from('materials').getPublicUrl(filePath);
        finalUrl = publicUrl;
      }

      if (!finalUrl) throw new Error('No attachment provided');

      setUploadProgress(90);
      const { data: insertedData, error: insertError } = await supabase
        .from('materials')
        .insert({
          session_id: formData.session_id,
          title: formData.title,
          type: finalType,
          url: finalUrl
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      toast.success('Material shared successfully!');
      setIsModalOpen(false);
      setFormData({ session_id: '', title: '', type: 'document', url: '' });
      setSelectedFile(null);
      
      // Optimistic Update: Update local state immediately for a "jiffy" feel
      if (insertedData) {
        setMaterials(prev => [insertedData, ...prev]);
      } else {
        loadAll(true);
      }
    } catch (error) {
      console.error('Upload Error:', error);
      const isBucketError = error.message?.toLowerCase().includes('bucket not found') || error.status === 404;
      if (isBucketError) {
        toast.error('Storage bucket "materials" not found. Please create it in your Supabase Dashboard.');
      } else {
        toast.error(error.message || 'Upload failed. Please check your connection.');
      }
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      await supabase.from('materials').delete().eq('id', id);
      toast.success('Deleted');
      loadAll();
    } catch (error) {
      toast.error('Delete failed');
    }
  };

  const safeFormatDate = (dateStr) => {
    try {
      const d = parseISO(dateStr);
      return isValid(d) ? format(d, 'EEEE, MMMM d') : 'Invalid Date';
    } catch (e) {
      return 'Invalid Date';
    }
  };

  // Helper Functions for UI
  const getResourceIcon = (type, title = '') => {
    const t = type?.toLowerCase();
    const lowTitle = title.toLowerCase();
    if (t === 'recording' || lowTitle.includes('video')) return <Video className="w-4 h-4" />;
    if (t === 'slides' || lowTitle.includes('ppt') || lowTitle.includes('slide')) return <Presentation className="w-4 h-4" />;
    if (t === 'document' || lowTitle.includes('pdf') || lowTitle.includes('doc')) return <FileText className="w-4 h-4" />;
    return <BookOpen className="w-4 h-4" />;
  };

  const getResourceColor = (type) => {
    switch(type?.toLowerCase()) {
      case 'recording': return 'bg-success-bg text-success border-success/20';
      case 'slides': return 'bg-accent-glow-soft text-accent-glow border-accent-glow/20';
      case 'document': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-surface-inset text-fg-tertiary border-border';
    }
  };

  const getResourceLabel = (type, title = '') => {
    if (title.toLowerCase().includes('pdf')) return 'PDF DOCUMENT';
    if (type === 'document') return 'DOCUMENT';
    if (type === 'slides') return 'SLIDES';
    if (type === 'recording') return 'VIDEO';
    return type?.toUpperCase() || 'LINK';
  };

  const groupedMaterials = useMemo(() => {
    return (sessions || []).map(session => ({
      ...session,
      materials: (materials || []).filter(m => m.session_id === session.id)
    }));
  }, [sessions, materials]);

  return (
    <div className="flex flex-col gap-8 pb-24 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-h1 font-display text-fg-primary tracking-tight">Resource Hub</h1>
          <p className="text-body text-fg-secondary mt-1">Manage course materials.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={loadAll} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="bg-accent-glow hover:bg-accent-glow-strong text-black">
            <Plus className="w-4 h-4 mr-2" /> Add Material
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between bg-surface-inset p-4 rounded-xl border border-border">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}><ChevronLeft className="w-5 h-5" /></Button>
          <div className="flex items-center gap-2 min-w-[160px] justify-center text-fg-primary">
            <Calendar className="w-4 h-4 text-accent-glow" />
            <span className="text-h3 font-display capitalize">{format(currentDate, 'MMMM yyyy')}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}><ChevronRight className="w-5 h-5" /></Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-fg-tertiary"><Loader2 className="w-8 h-8 animate-spin" /></div>
        ) : groupedMaterials.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-fg-tertiary bg-surface-inset rounded-2xl border border-dashed border-border gap-4 text-center">
            <BookOpen className="w-12 h-12 opacity-10" />
            <p>No sessions found for this month.</p>
          </div>
        ) : (
          groupedMaterials.map((session) => (
            <Card key={session.id} className="p-0 overflow-hidden border-border/60 shadow-sm">
              <div className="p-5 border-b border-border bg-surface-inset/30 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <h3 className="text-h3 font-bold text-fg-primary">{session.topic}</h3>
                  <span className="text-caption text-fg-tertiary">{safeFormatDate(session.date)}</span>
                </div>
                <Button variant="ghost" size="sm" className="text-accent-glow" onClick={() => { setFormData(p => ({ ...p, session_id: session.id })); setIsModalOpen(true); }}><Plus className="w-4 h-4 mr-1" /> Add</Button>
              </div>
              <div className="p-4">
                {session.materials.length === 0 ? (
                  <div className="py-8 text-center text-caption text-fg-tertiary italic opacity-60">No materials.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {session.materials.map((mat) => (
                      <div key={mat.id} className="group relative flex flex-col p-4 rounded-xl bg-surface border border-border hover:bg-surface-raised transition-all cursor-pointer" onClick={() => window.open(mat.url, '_blank')}>
                        <div className="flex items-center justify-between mb-3">
                          <div className={`p-2 rounded-lg border ${getResourceColor(mat.type)}`}>
                            {getResourceIcon(mat.type, mat.title)}
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-danger opacity-0 group-hover:opacity-100" onClick={(e) => { e.stopPropagation(); handleDelete(mat.id); }}><Trash2 className="w-4 h-4" /></Button>
                        </div>
                        <span className="text-body-sm font-bold text-fg-primary line-clamp-2 mb-1">{mat.title}</span>
                        <span className={`text-[9px] font-bold tracking-widest uppercase ${mat.type === 'document' ? 'text-blue-400' : 'text-fg-tertiary'}`}>
                          {getResourceLabel(mat.type, mat.title)}
                        </span>
                        <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100"><ExternalLink className="w-3 h-3 text-accent-glow" /></div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => !saving && setIsModalOpen(false)} title="Share Resource" maxWidth="480px">
        <form onSubmit={handleAddMaterial} className="flex flex-col gap-6">
          <Select label="Select Session" value={formData.session_id} onChange={(e) => setFormData(p => ({ ...p, session_id: e.target.value }))} required options={[{ label: 'Choose a session...', value: '' }, ...(sessions || []).map(s => ({ label: `${s.topic} (${format(parseISO(s.date), 'MMM d')})`, value: s.id }))]} />
          <Input label="Title" placeholder="e.g. Session Slides" value={formData.title} onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))} required />
          <div className="flex flex-col gap-3">
            <label className="text-label uppercase text-fg-secondary font-bold">Attachment</label>
            <Input type="url" placeholder="Paste link" value={formData.url} onChange={(e) => { setFormData(p => ({ ...p, url: e.target.value })); if (e.target.value) setSelectedFile(null); }} disabled={!!selectedFile} />
            <div className="flex items-center gap-2 text-[10px] text-fg-tertiary font-bold uppercase justify-center py-1"><span>OR UPLOAD FILE</span></div>
            <div className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-xl transition-all ${selectedFile ? 'border-accent-glow bg-accent-glow-soft/5' : 'border-border'}`}>
              <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => { const f = e.target.files[0]; if (f) { setSelectedFile(f); setFormData(p => ({ ...p, url: '', title: p.title || f.name.split('.')[0] })); } }} disabled={!!formData.url} />
              <FileUp className={`w-8 h-8 mb-2 ${selectedFile ? 'text-accent-glow' : 'text-fg-tertiary'}`} />
              <span className="text-caption font-bold text-center">{selectedFile ? selectedFile.name : 'Upload PDF / Slides / Zip'}</span>
              {selectedFile && <Button type="button" variant="ghost" size="sm" className="mt-2 text-danger" onClick={(e) => { e.stopPropagation(); setSelectedFile(null); }}>Remove</Button>}
            </div>
          </div>
          {saving && uploadProgress > 0 && <div className="w-full bg-surface-inset h-1.5 rounded-full overflow-hidden mt-2"><div className="bg-accent-glow h-full transition-all" style={{ width: `${uploadProgress}%` }} /></div>}
          <div className="flex gap-3 justify-end mt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>Cancel</Button>
            <Button type="submit" loading={saving} className="bg-accent-glow text-black px-8">Save & Share</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
