import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { saveAttendance } from '../lib/attendance';
import { dateToISO, savePendingAttendance, removePendingAttendance } from '../lib/utils';

function getAuthEmail() {
  // Read email from the current Supabase session synchronously via cached storage
  try {
    const storageKey = Object.keys(localStorage).find(k => k.startsWith('sb-') && k.endsWith('-auth-token'));
    if (storageKey) {
      const session = JSON.parse(localStorage.getItem(storageKey));
      return session?.user?.email || session?.currentSession?.user?.email || '';
    }
  } catch { /* ignore */ }
  return '';
}

export function useAttendanceFlow({ instruments, students, sessionDate, sessionTime, sessionType, term, year, bandId }) {
  const [step, setStep] = useState(1); // 1=tally, 2=resolve, 3=summary
  const [tallies, setTallies] = useState({});
  const [attendance, setAttendance] = useState({});
  const [sessionId, setSessionId] = useState(null);
  const [existingSession, setExistingSession] = useState(null);
  const [mismatchInstruments, setMismatchInstruments] = useState([]);
  const [autoResolvedInfo, setAutoResolvedInfo] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasDataEntered, setHasDataEntered] = useState(false);
  const submittingRef = useRef(false);
  // True once an edit-mode prefill has actually loaded the existing marks.
  // Submit refuses to run while an edit is requested but unloaded — otherwise a
  // failed prefill lets the volunteer write a blank take over 71 real records.
  const editPrefillLoadedRef = useRef(false);

  const totalStudents = students.length;

  // Check for existing session
  const checkExisting = useCallback(async (date, time) => {
    try {
      const dateStr = dateToISO(date);
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_date', dateStr)
        .eq('session_time', time || '')
        .eq('band_id', bandId)
        .maybeSingle();
      if (error) throw error;
      setExistingSession(data || null);
      return data;
    } catch (e) {
      console.error('checkExistingSession error:', e);
      return null;
    }
  }, [bandId]);

  // Start or edit attendance. Read-only: looks up an existing session (for
  // edit mode) but never creates one — the session is created at SUBMIT time
  // (see lib/attendance.js), otherwise an abandoned flow leaves an empty
  // session that reports count as real.
  const startAttendance = useCallback(async (editMode = false) => {
    const dateStr = dateToISO(sessionDate);
    editPrefillLoadedRef.current = !editMode; // nothing to load unless editing

    let session = existingSession;
    if (!session) {
      // The error MUST be checked and thrown. supabase-js resolves rather than
      // throws on a PostgREST error, so swallowing it here made `session` null
      // on any transient blip — which sent edit mode down the reset branch and
      // silently reproduced the blank-then-overwrite bug this gate exists to
      // prevent. A failed lookup is not "no session".
      const { data: existing, error: findErr } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_date', dateStr)
        .eq('session_time', sessionTime || '')
        .eq('band_id', bandId)
        .maybeSingle();
      if (findErr) throw findErr;
      session = existing || null;
      // Cache it so submit reuses this row instead of re-querying, and so the
      // edit branch below stays true on re-render.
      if (session) setExistingSession(session);
    }
    setSessionId(session ? session.id : null);

    // Gate on the freshly-fetched `session`, NOT on the `existingSession`
    // state: this screen never calls checkExisting(), so that state was always
    // null here and edit mode silently fell through to the reset branch —
    // loading blank, then overwriting every real record on submit.
    if (editMode && session) {
      const { data: attData, error: attErr } = await supabase
        .from('attendance')
        .select('student_id, present')
        .eq('session_id', session.id);
      if (attErr) throw attErr;

      const att = {};
      (attData || []).forEach(a => { att[a.student_id] = a.present; });
      setAttendance(att);

      const t = {};
      instruments.forEach(inst => {
        const studs = students.filter(s => s.instrument_id === inst.id);
        t[inst.id] = studs.filter(s => att[s.id] === true).length;
      });
      setTallies(t);
      editPrefillLoadedRef.current = true;
    } else {
      setTallies({});
      setAttendance({});
    }

    setStep(1);
    return session;
  }, [sessionDate, sessionTime, bandId, instruments, students, existingSession]);

  // Update a tally value
  const setTally = useCallback((instId, value) => {
    setTallies(prev => {
      if (value === '' || value === undefined) {
        const next = { ...prev };
        delete next[instId];
        return next;
      }
      return { ...prev, [instId]: value };
    });
    setHasDataEntered(true);
  }, []);

  // Proceed to resolve step
  const goToResolve = useCallback(() => {
    let autoMatchCount = 0;
    let autoAbsentCount = 0;
    const mismatches = [];
    const newAttendance = { ...attendance };

    instruments.forEach(inst => {
      const studs = students.filter(s => s.instrument_id === inst.id);
      const expected = studs.length;
      if (expected === 0) return;
      const count = tallies[inst.id] || 0;

      if (count === expected) {
        const hasManualData = studs.some(s => newAttendance[s.id] !== undefined);
        if (!hasManualData || tallies[inst.id] === expected) {
          studs.forEach(s => { newAttendance[s.id] = true; });
        }
        autoMatchCount++;
      } else if (count === 0) {
        const hasManualData = studs.some(s => newAttendance[s.id] !== undefined);
        if (!hasManualData) {
          studs.forEach(s => { newAttendance[s.id] = false; });
        }
        autoAbsentCount++;
      } else {
        const hasManualData = studs.some(s => newAttendance[s.id] !== undefined);
        // Smart default: if more than half are present, default all to present
        // (volunteer unchecks the absent few). Otherwise default to absent
        // (volunteer checks the present few). This minimises taps.
        const majorityPresent = count > studs.length / 2;
        if (!hasManualData) {
          studs.forEach(s => { newAttendance[s.id] = majorityPresent; });
        }
        mismatches.push({ inst, studs, count, majorityPresent });
      }
    });

    setAttendance(newAttendance);
    setMismatchInstruments(mismatches);

    if (autoMatchCount > 0 || autoAbsentCount > 0) {
      const msgs = [];
      if (autoMatchCount > 0) msgs.push(`${autoMatchCount} instrument(s) all present`);
      if (autoAbsentCount > 0) msgs.push(`${autoAbsentCount} instrument(s) all absent`);
      setAutoResolvedInfo(msgs.join(', '));
    } else {
      setAutoResolvedInfo(null);
    }

    setStep(2);
  }, [instruments, students, tallies, attendance]);

  // Toggle student attendance
  const toggleStudent = useCallback((studentId) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
    setHasDataEntered(true);
  }, []);

  // Bulk set attendance for an instrument
  const setInstrumentAttendance = useCallback((instId, present) => {
    const studs = students.filter(s => s.instrument_id === instId);
    setAttendance(prev => {
      const next = { ...prev };
      studs.forEach(s => { next[s.id] = present; });
      return next;
    });
    setHasDataEntered(true);
  }, [students]);

  // Validate resolve screen
  const getUnresolvedCount = useCallback(() => {
    let count = 0;
    mismatchInstruments.forEach(({ studs, count: targetCount }) => {
      const checked = studs.filter(s => attendance[s.id] === true).length;
      if (checked !== targetCount) count++;
    });
    return count;
  }, [mismatchInstruments, attendance]);

  // Submit attendance
  const submitAttendance = useCallback(async () => {
    if (submittingRef.current) return;
    // Last line of defence for the edit path: if the volunteer asked to edit an
    // existing session but the prefill never loaded (lookup failed, prefill
    // threw), the on-screen marks are blank — not "everyone absent". Writing
    // them would destroy the real take for all 71 children. Refuse instead.
    if (!editPrefillLoadedRef.current) {
      throw new Error("This session's existing attendance could not be loaded, so it can't be saved over. Go back and reopen it.");
    }
    submittingRef.current = true;
    setSubmitting(true);

    const dateStr = dateToISO(sessionDate);
    const params = {
      bandId,
      dateStr,
      sessionTime: sessionTime || '',
      sessionType,
      term,
      year,
      recordedBy: getAuthEmail(),
    };

    const records = students.map(s => ({
      student_id: s.id,
      present: !!attendance[s.id],
    }));

    // WRITE-AHEAD: stash locally BEFORE touching the network, not in the catch.
    // A stalled request (the normal failure in a hall with bad reception) used
    // to hang forever without ever reaching a catch block, so the volunteer
    // force-quit and 71 records vanished with no pending banner. Saving first
    // means no failure mode — stall, crash, or closed tab — can lose the take.
    // stashed=false means storage is full/disabled: the safety net is NOT there,
    // and the UI must not claim otherwise if the submit then fails.
    const stashed = savePendingAttendance({ ...params, payload: records });

    try {
      const { session, warning } = await saveAttendance({ ...params, records });
      setSessionId(session.id);
      setExistingSession(session);

      // Only now is it safe to drop the local copy.
      removePendingAttendance(bandId, dateStr, sessionType, params.sessionTime);
      setHasDataEntered(false);
      setStep(3);
      return warning ? { success: true, warning } : { success: true };
    } catch (e) {
      // Tell the truth about whether the take survived: `stashed` decides
      // whether "we kept it for retry" is a promise or a lie.
      e.stashed = stashed;
      throw e;
    } finally {
      // On failure the pending record stays put for the retry path — that is
      // the whole point of the write-ahead above, so there is nothing to undo.
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [students, attendance, sessionDate, sessionTime, sessionType, term, year, bandId]);

  // Summary data
  const getSummaryData = useCallback(() => {
    const presentCount = students.filter(s => attendance[s.id]).length;
    const breakdown = instruments
      .map(inst => {
        const studs = students.filter(s => s.instrument_id === inst.id);
        if (studs.length === 0) return null;
        const present = studs.filter(s => attendance[s.id]).length;
        const absent = studs.filter(s => !attendance[s.id]);
        return { inst, present, total: studs.length, absent };
      })
      .filter(Boolean);
    return { presentCount, totalStudents, breakdown };
  }, [students, instruments, attendance, totalStudents]);

  return {
    step,
    setStep,
    tallies,
    setTally,
    attendance,
    toggleStudent,
    setInstrumentAttendance,
    sessionId,
    existingSession,
    checkExisting,
    startAttendance,
    goToResolve,
    mismatchInstruments,
    autoResolvedInfo,
    getUnresolvedCount,
    submitAttendance,
    submitting,
    getSummaryData,
    totalStudents,
    hasDataEntered,
    setHasDataEntered,
  };
}
