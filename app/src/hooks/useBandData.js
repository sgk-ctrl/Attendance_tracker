import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { cacheData, getCachedData } from '../lib/utils';

export function useBandData(bandId) {
  const [instruments, setInstruments] = useState([]);
  const [students, setStudents] = useState([]);
  const [band, setBand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!bandId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const [bandRes, instRes, studRes] = await Promise.all([
          supabase.from('bands').select('*').eq('id', bandId).single(),
          supabase.from('instruments').select('*').eq('band_id', bandId).order('display_order'),
          supabase.from('students').select('*').eq('active', true).eq('band_id', bandId).order('last_name').order('first_name'),
        ]);

        if (bandRes.error) throw bandRes.error;
        if (instRes.error) throw instRes.error;
        if (studRes.error) throw studRes.error;

        if (!cancelled) {
          setBand(bandRes.data);
          setInstruments(instRes.data || []);
          setStudents(studRes.data || []);
          cacheData(instRes.data, studRes.data);
        }
      } catch (e) {
        const cached = getCachedData();
        if (cached && !cancelled) {
          setInstruments(cached.instruments);
          setStudents(cached.students);
          setError('Using cached data - offline mode');
        } else if (!cancelled) {
          setError(e.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [bandId]);

  const reload = async () => {
    setLoading(true);
    try {
      const [instRes, studRes] = await Promise.all([
        supabase.from('instruments').select('*').eq('band_id', bandId).order('display_order'),
        supabase.from('students').select('*').eq('active', true).eq('band_id', bandId).order('last_name').order('first_name'),
      ]);
      if (instRes.error) throw instRes.error;
      if (studRes.error) throw studRes.error;
      setInstruments(instRes.data || []);
      setStudents(studRes.data || []);
      cacheData(instRes.data, studRes.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return { band, instruments, students, loading, error, reload };
}
