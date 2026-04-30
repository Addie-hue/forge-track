import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { BookOpen, ExternalLink, Play, FileText, Download } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function MyMaterialsPage() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMaterials() {
      try {
        // Fetch materials with session info
        const { data, error } = await supabase
          .from('materials')
          .select('*, session:sessions(topic, date)')
          .order('created_at', { ascending: false });
          
        if (error) throw error;
        setMaterials(data || []);
      } catch (error) {
        console.error('Error fetching materials:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchMaterials();
  }, []);

  const getTypeIcon = (type) => {
    switch (type) {
      case 'slides': return <FileText className="w-5 h-5" />;
      case 'recording': return <Play className="w-5 h-5" />;
      case 'document': return <Download className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
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

  // Group materials by session date (month/year) for better display, or just show as list
  // For simplicity, we'll just show a nice list/grid.

  return (
    <div className="flex flex-col gap-8 pb-24 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 font-display text-fg-primary tracking-tight">Study Materials</h1>
        <p className="text-body text-fg-secondary">Access slides, recordings, and class resources.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="flex gap-4">
              <Skeleton variant="circular" className="w-12 h-12 flex-shrink-0" />
              <div className="flex-1 flex flex-col gap-2">
                <Skeleton variant="text" className="w-3/4 h-5" />
                <Skeleton variant="text" className="w-1/2 h-4" />
              </div>
            </Card>
          ))}
        </div>
      ) : materials.length === 0 ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No materials yet"
            description="Mentors haven't uploaded any study materials. Check back soon."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-scale-in">
          {materials.map((mat) => (
            <a 
              key={mat.id} 
              href={mat.url} 
              target="_blank" 
              rel="noreferrer"
              className="block group"
            >
              <Card className="flex items-start gap-4 transition-all duration-200 hover:border-accent-glow hover:bg-surface-inset h-full">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 ${
                  mat.type === 'slides' ? 'bg-accent-glow-soft text-accent-glow' :
                  mat.type === 'recording' ? 'bg-success-bg text-success' :
                  'bg-surface-inset border border-border text-fg-secondary'
                }`}>
                  {getTypeIcon(mat.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="text-body font-medium text-fg-primary truncate group-hover:text-accent-glow transition-colors">
                      {mat.title}
                    </h3>
                    <ExternalLink className="w-4 h-4 text-fg-tertiary opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </div>
                  
                  <p className="text-caption text-fg-secondary truncate mb-3">
                    {mat.session?.topic || 'General Resource'}
                  </p>
                  
                  <div className="flex items-center gap-3">
                    <Badge variant={getTypeBadgeColor(mat.type)}>{mat.type}</Badge>
                    <span className="text-micro text-fg-tertiary font-mono">
                      {mat.session?.date ? format(parseISO(mat.session.date), 'MMM d, yyyy') : 'No Date'}
                    </span>
                  </div>
                </div>
              </Card>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
