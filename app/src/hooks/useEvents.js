import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useEvents(bandId) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadEvents = useCallback(async () => {
    if (!bandId) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('band_events')
        .select('*')
        .eq('band_id', bandId)
        .order('event_date', { ascending: false });
      if (err) throw err;
      setEvents(data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [bandId]);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const createEvent = useCallback(async (eventData) => {
    const { data, error: err } = await supabase
      .from('band_events')
      .insert({ ...eventData, band_id: bandId })
      .select()
      .single();
    if (err) throw err;
    await loadEvents();
    return data;
  }, [bandId, loadEvents]);

  return { events, loading, error, loadEvents, createEvent };
}

export function useEventAttendance(eventId) {
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('event_attendance')
          .select('student_id, present')
          .eq('event_id', eventId);
        if (error) throw error;
        if (!cancelled) {
          const att = {};
          (data || []).forEach(a => { att[a.student_id] = a.present; });
          setAttendance(att);
        }
      } catch (e) {
        console.error('Failed to load event attendance:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [eventId]);

  const toggleStudent = useCallback((studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  }, []);

  const submitAttendance = useCallback(async (students) => {
    setSubmitting(true);
    try {
      const records = students.map(s => ({
        event_id: eventId,
        student_id: s.id,
        present: !!attendance[s.id],
      }));
      // Check existing, update or insert
      const { data: existing } = await supabase
        .from('event_attendance')
        .select('student_id')
        .eq('event_id', eventId);
      const existingIds = new Set((existing || []).map(e => e.student_id));
      for (const rec of records.filter(r => existingIds.has(r.student_id))) {
        await supabase.from('event_attendance').update({ present: rec.present })
          .eq('event_id', rec.event_id).eq('student_id', rec.student_id);
      }
      const toInsert = records.filter(r => !existingIds.has(r.student_id));
      if (toInsert.length > 0) {
        const { error } = await supabase.from('event_attendance').insert(toInsert);
        if (error) throw error;
      }
      return { success: true };
    } finally {
      setSubmitting(false);
    }
  }, [eventId, attendance]);

  return { attendance, toggleStudent, loading, submitting, submitAttendance };
}
