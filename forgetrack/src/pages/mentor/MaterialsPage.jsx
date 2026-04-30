import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/Table';
import { Modal } from '../../components/ui/Modal';
import { useToast } from '../../components/ui/ToastProvider';
import { Badge } from '../../components/ui/Badge';
import { BookOpen, Plus, ExternalLink, Link2, Trash2 } from 'lucide-react';
import { MATERIAL_TYPES } from '../../lib/constants';
import { format, parseISO } from 'date-fns';

export function MaterialsPage() {
  const { user } = useAuth();
  const toast = useToast();
  
  const [materials, setMaterials] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    session_id: '',
    title: '',
    type: 'slides',
    url: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      // Fetch materials with their session info
      const { data: matsData, error: matsError } = await supabase
        .from('materials')
        .select('*, session:sessions(topic, date)')
        .order('created_at', { ascending: false });

      if (matsError) throw matsError;
      setMaterials(matsData || []);

      // Fetch sessions for the dropdown
      const { data: sessData, error: sessError } = await supabase
        .from('sessions')
        .select('id, topic, date')
        .order('date', { ascending: false });

      if (sessError) throw sessError;
      setSessions(sessData || []);

    } catch (error) {
      console.error(error);
      toast.error('Failed to load materials');
    } finally {
      setLoading(false);
    }
  }

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    if (!formData.session_id || !formData.title || !formData.url) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('materials')
        .insert({
          session_id: formData.session_id,
          title: formData.title,
          type: formData.type,
          url: formData.url,
          uploaded_by: user.id
        });

      if (error) throw error;
      
      toast.success('Material added successfully');
      setIsModalOpen(false);
      setFormData({ session_id: '', title: '', type: 'slides', url: '' });
      fetchData(); // refresh list
    } catch (error) {
      console.error(error);
      toast.error('Failed to add material');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this material?')) return;
    
    try {
      const { error } = await supabase.from('materials').delete().eq('id', id);
      if (error) throw error;
      toast.success('Material deleted');
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete material');
    }
  };

  const getTypeBadgeColor = (type) => {
    switch(type) {
      case 'slides': return 'accent';
      case 'recording': return 'success';
      case 'document': return 'default';
      default: return 'default';
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-24 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-h1 font-display text-fg-primary tracking-tight">Class Materials</h1>
          <p className="text-body text-fg-secondary mt-1">Manage slides, recordings, and resources.</p>
        </div>
        
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="w-4 h-4" /> Add Material
        </Button>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Title & Type</TableHead>
                <TableHead>Session</TableHead>
                <TableHead>Date Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow hover={false}>
                  <TableCell colSpan={4} className="h-32 text-center text-fg-tertiary">Loading materials...</TableCell>
                </TableRow>
              ) : materials.length === 0 ? (
                <TableRow hover={false}>
                  <TableCell colSpan={4} className="h-32 text-center text-fg-tertiary">No materials found.</TableCell>
                </TableRow>
              ) : (
                materials.map((mat) => (
                  <TableRow key={mat.id}>
                    <TableCell>
                      <div className="flex flex-col items-start gap-2">
                        <span className="font-medium text-fg-primary">{mat.title}</span>
                        <Badge variant={getTypeBadgeColor(mat.type)}>{mat.type}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span className="text-body text-fg-secondary">{mat.session?.topic || 'Unknown'}</span>
                        <span className="text-caption text-fg-tertiary font-mono">
                          {mat.session?.date ? format(parseISO(mat.session.date), 'MMM d, yyyy') : ''}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-fg-tertiary text-body-sm">
                      {format(parseISO(mat.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => window.open(mat.url, '_blank')}>
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-danger hover:bg-danger-bg hover:text-danger" onClick={() => handleDelete(mat.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Add Material Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => !saving && setIsModalOpen(false)}
        title="Add New Material"
        maxWidth="480px"
      >
        <form id="material-form" onSubmit={handleAddMaterial} className="flex flex-col gap-5">
          <Select
            label="Session"
            value={formData.session_id}
            onChange={(e) => setFormData(prev => ({ ...prev, session_id: e.target.value }))}
            required
            options={[
              { label: 'Select a session...', value: '' },
              ...sessions.map(s => ({ 
                label: `${s.topic} (${format(parseISO(s.date), 'MMM d')})`, 
                value: s.id 
              }))
            ]}
          />
          
          <Input
            label="Title"
            placeholder="e.g. Slide Deck: Intro to NLP"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            required
          />

          <Select
            label="Type"
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            required
            options={MATERIAL_TYPES.map(t => ({ label: t.charAt(0).toUpperCase() + t.slice(1), value: t }))}
          />

          <div className="relative">
            <Input
              label="URL"
              type="url"
              placeholder="https://docs.google.com/..."
              value={formData.url}
              onChange={(e) => setFormData(prev => ({ ...prev, url: e.target.value }))}
              required
            />
            <Link2 className="absolute right-3 top-[38px] w-4 h-4 text-fg-tertiary" />
          </div>

          <div className="flex gap-3 justify-end mt-4">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Save Material
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
