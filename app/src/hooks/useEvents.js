import { useState, useEffect, useCallback, useRef } from 'react';
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
  // A failed load leaves `attendance` empty, which renders EXACTLY like a
  // legitimate "nobody marked yet" — and submit would then faithfully write 71
  // absences over the real marks. An unread list is not an empty list. Mirrors
  // editPrefillLoadedRef on the rehearsal path (useAttendanceFlow.js).
  const [loadError, setLoadError] = useState(null);
  const loadedRef = useRef(false);

  useEffect(() => {
    if (!eventId) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      loadedRef.current = false;
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
          setLoadError(null);
          loadedRef.current = true;
        }
      } catch (e) {
        console.error('Failed to load event attendance:', e);
        if (!cancelled) setLoadError(e.message || 'Could not load existing marks.');
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
    // Refuse rather than overwrite: if the existing marks never loaded, what is
    // on screen is "unknown", not "everyone absent". The upsert below is
    // reliable now, which makes writing a wrong take MORE damaging, not less.
    if (!loadedRef.current) {
      throw new Error("This event's existing attendance could not be loaded, so it can't be saved over. Go back and reopen it.");
    }
    setSubmitting(true);
    try {
      const records = students.map(s => ({
        event_id: eventId,
        student_id: s.id,
        present: !!attendance[s.id],
      }));

      // One checked upsert, matching the rehearsal path (lib/attendance.js).
      // This replaces a read-then-update-loop whose UPDATE results were thrown
      // away — and supabase-js RESOLVES rather than throws on a PostgREST
      // error, so a rejected or aborted write reported success while the
      // database kept the old marks. Relies on the existing unique constraint
      // event_attendance(event_id, student_id).
      const { error } = await supabase
        .from('event_attendance')
        .upsert(records, { onConflict: 'event_id,student_id' });
      if (error) throw error;

      return { success: true };
    } finally {
      setSubmitting(false);
    }
  }, [eventId, attendance]);

  return { attendance, toggleStudent, loading, submitting, submitAttendance, loadError };
}
