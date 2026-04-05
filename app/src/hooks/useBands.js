import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useBands() {
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const [bandRes, studentRes] = await Promise.all([
          supabase.from('bands').select('*').eq('active', true).order('name'),
          supabase.from('students').select('id, band_id').eq('active', true),
        ]);

        if (bandRes.error) throw bandRes.error;
        if (studentRes.error) throw studentRes.error;

        if (!cancelled) {
          const counts = {};
          (studentRes.data || []).forEach(s => {
            counts[s.band_id] = (counts[s.band_id] || 0) + 1;
          });

          const bandsWithCounts = (bandRes.data || []).map(b => ({
            ...b,
            studentCount: counts[b.id] || 0,
          }));

          setBands(bandsWithCounts);
        }
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { bands, loading, error };
}
