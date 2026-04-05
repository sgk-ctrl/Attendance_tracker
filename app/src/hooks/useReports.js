import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

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

      const [attRes, studRes, instRes] = await Promise.all([
        supabase.from('attendance').select('session_id, student_id, present').in('session_id', sessionIds),
        supabase.from('students').select('*').eq('active', true).eq('band_id', bandId).order('last_name'),
        supabase.from('instruments').select('*').eq('band_id', bandId).order('display_order'),
      ]);

      if (attRes.error) throw attRes.error;

      const students = studRes.data || [];
      const instruments = instRes.data || [];
      const attData = attRes.data || [];
      const totalSessions = sessions.length;

      const instMap = {};
      instruments.forEach(i => { instMap[i.id] = i.name; });

      // Student attendance
      const studentAtt = {};
      students.forEach(s => { studentAtt[s.id] = { student: s, attended: 0 }; });
      attData.forEach(a => {
        if (a.present && studentAtt[a.student_id]) {
          studentAtt[a.student_id].attended++;
        }
      });

      const studentRows = Object.values(studentAtt)
        .map(sa => ({
          id: sa.student.id,
          name: `${sa.student.first_name} ${sa.student.last_name}`,
          instrument: instMap[sa.student.instrument_id] || '?',
          instrumentId: sa.student.instrument_id,
          attended: sa.attended,
          total: totalSessions,
          pct: totalSessions > 0 ? Math.round(sa.attended / totalSessions * 100) : 0,
        }))
        .sort((a, b) => a.pct - b.pct);

      // Instrument attendance
      const instRows = instruments.map(inst => {
        const studs = students.filter(s => s.instrument_id === inst.id);
        const possible = studs.length * totalSessions;
        let attended = 0;
        studs.forEach(s => { attended += (studentAtt[s.id]?.attended || 0); });
        return {
          id: inst.id,
          name: inst.name,
          attended,
          possible,
          pct: possible > 0 ? Math.round(attended / possible * 100) : 0,
        };
      }).sort((a, b) => a.pct - b.pct);

      // Detailed register data
      const sortedSessions = [...sessions].sort((a, b) => a.session_date.localeCompare(b.session_date));
      const attMap = {};
      attData.forEach(a => {
        attMap[`${a.student_id}_${a.session_id}`] = a.present;
      });

      const registerByInst = instruments
        .map(inst => {
          const studs = students
            .filter(s => s.instrument_id === inst.id)
            .sort((a, b) => a.last_name.localeCompare(b.last_name));
          return studs.length > 0 ? { inst, studs } : null;
        })
        .filter(Boolean);

      setReportData({
        empty: false,
        studentRows,
        instRows,
        totalSessions,
        sortedSessions,
        registerByInst,
        attMap,
        instMap,
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
