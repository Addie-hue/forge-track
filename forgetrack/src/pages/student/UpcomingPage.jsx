import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card, CardHeader } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { Calendar, Clock, MapPin } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export function UpcomingPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUpcoming() {
      try {
        const today = new Date().toISOString().split('T')[0];
        
        // Fetch sessions on or after today
        const { data, error } = await supabase
          .from('sessions')
          .select('*')
          .gte('date', today)
          .order('date', { ascending: true });
          
        if (error) throw error;
        setSessions(data || []);
      } catch (error) {
        console.error('Error fetching upcoming sessions:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUpcoming();
  }, []);

  return (
    <div className="flex flex-col gap-8 pb-24 animate-fade-in">
      <div className="flex flex-col gap-2">
        <h1 className="text-h1 font-display text-fg-primary tracking-tight">Upcoming Sessions</h1>
        <p className="text-body text-fg-secondary">View scheduled classes and assignments.</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <Card key={i} className="flex flex-col gap-4">
              <Skeleton variant="text" className="w-1/2 h-6" />
              <Skeleton variant="text" className="w-3/4 h-8" />
              <Skeleton variant="text" className="w-1/3 h-4 mt-auto" />
            </Card>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <EmptyState
            icon={Calendar}
            title="No upcoming sessions"
            description="There are currently no sessions scheduled for the future. Check back later."
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-scale-in">
          {sessions.map((sess, idx) => {
            const isToday = sess.date === new Date().toISOString().split('T')[0];
            
            return (
              <Card key={sess.id} hero={isToday} className={`flex flex-col relative overflow-hidden ${isToday ? 'border-accent-glow' : ''}`}>
                {isToday && (
                  <div className="absolute top-0 right-0 bg-accent-glow text-black text-micro font-bold uppercase tracking-widest px-3 py-1 rounded-bl-lg">
                    Today
                  </div>
                )}
                
                <div className="mb-6 mt-2">
                  <div className="flex items-center gap-2 text-fg-secondary text-body-sm mb-3">
                    <Calendar className="w-4 h-4" />
                    <span className="font-mono">{format(parseISO(sess.date), 'EEEE, MMM do')}</span>
                  </div>
                  <h3 className="text-h3 font-medium text-fg-primary leading-tight">{sess.topic}</h3>
                </div>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-border">
                  <span className={`px-2.5 py-1 rounded-md text-caption uppercase tracking-wider border ${
                    sess.type === 'offline' ? 'bg-surface-inset text-fg-secondary border-border' : 
                    sess.type === 'online' ? 'bg-info-bg text-info border-info-border' : 
                    'bg-warning-bg text-warning border-warning-border'
                  }`}>
                    {sess.type}
                  </span>
                  
                  <div className="flex items-center gap-1.5 text-caption text-fg-tertiary">
                    {sess.type === 'offline' ? (
                      <><MapPin className="w-3.5 h-3.5" /> Campus</>
                    ) : (
                      <><Clock className="w-3.5 h-3.5" /> TBA</>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
