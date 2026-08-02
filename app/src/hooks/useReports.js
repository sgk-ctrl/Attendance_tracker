import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { fetchAllRows } from '../lib/fetchAll';
import { computeReport } from '../lib/reports';

export function useReports(bandId) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [error, setError] = useState(null);

  const loadReport = useCallback(async (year, term) => {
    setLoading(true);
    setError(null);

    try {
      let sessQ = supabase.from('sessions').select('*').eq('year', year).eq('band_id', bandId);
      if (term) sessQ = sessQ.eq('term', parseInt(term));
      const { data: sessions, error: sessErr } = await sessQ;
      if (sessErr) throw sessErr;

      if (!sessions || sessions.length === 0) {
        setReportData({ empty: true });
        return;
      }

      const sessionIds = sessions.map(s => s.id);

      // Paged: attendance crosses PostgREST's 1000-row cap mid-term (71
      // students x 15 sessions), and the cap truncates silently — every child's
      // percentage would quietly drop with no error to catch.
      const [attData, studRes, instRes] = await Promise.all([
        fetchAllRows(() =>
          supabase.from('attendance').select('session_id, student_id, present').in('session_id', sessionIds).order('id')),
        supabase.from('students').select('*').eq('active', true).eq('band_id', bandId).order('last_name'),
        supabase.from('instruments').select('*').eq('band_id', bandId).order('display_order'),
      ]);

      const students = studRes.data || [];
      const instruments = instRes.data || [];

      // All arithmetic lives in lib/reports.js (pure, tested under Node, ports
      // to native unchanged). This hook only fetches and stores.
      const computed = computeReport({ sessions, attData, students, instruments });

      setReportData({
        empty: false,
        ...computed,
        year,
        term,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [bandId]);

  return { reportData, loading, error, loadReport };
}
