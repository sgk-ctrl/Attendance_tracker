import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';
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

  // Find (or create) the session row. Creation happens at SUBMIT time, not
  // when the flow opens — otherwise abandoned flows leave empty sessions that
  // reports count as real, dragging every student's percentage down.
  // The database has a unique index on (band_id, session_date, session_time),
  // so a concurrent create surfaces as a 23505 and we adopt the winner's row.
  const ensureSession = useCallback(async () => {
    const dateStr = dateToISO(sessionDate);
    const volunteerName = getAuthEmail();

    const findExisting = async () => {
      const { data } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_date', dateStr)
        .eq('session_time', sessionTime || '')
        .eq('band_id', bandId)
        .maybeSingle();
      return data || null;
    };

    let session = existingSession || (await findExisting());
    if (!session) {
      const { data, error } = await supabase
        .from('sessions')
        .insert({
          session_date: dateStr,
          session_type: sessionType,
          session_time: sessionTime || '',
          term,
          year,
          band_id: bandId,
          recorded_by: volunteerName,
        })
        .select()
        .single();
      if (error) {
        // Unique violation (or race) — another volunteer created it first
        session = await findExisting();
        if (!session) throw error;
      } else {
        session = data;
      }
    }
    setSessionId(session.id);
    return session;
  }, [sessionDate, sessionTime, sessionType, term, year, bandId, existingSession]);

  // Start or edit attendance. Read-only: looks up an existing session (for
  // edit mode) but never creates one — see ensureSession above.
  const startAttendance = useCallback(async (editMode = false) => {
    const dateStr = dateToISO(sessionDate);

    let session = existingSession;
    if (!session) {
      const { data: existing } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_date', dateStr)
        .eq('session_time', sessionTime || '')
        .eq('band_id', bandId)
        .maybeSingle();
      session = existing || null;
    }
    setSessionId(session ? session.id : null);

    if (editMode && existingSession && session) {
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
    submittingRef.current = true;
    setSubmitting(true);

    const dateStr = dateToISO(sessionDate);

    // Records without a session id — resolved below, and re-resolved by the
    // offline retry path, which stamps session_id fresh before inserting.
    const baseRecords = students.map(s => ({
      student_id: s.id,
      present: !!attendance[s.id],
    }));

    try {
      // Create (or adopt) the session row now that there is real data to save
      const session = await ensureSession();
      const records = baseRecords.map(r => ({ ...r, session_id: session.id }));

      // Check if attendance records already exist for this session
      const { data: existingAtt } = await supabase
        .from('attendance')
        .select('student_id')
        .eq('session_id', session.id);

      const existingIds = new Set((existingAtt || []).map(e => e.student_id));
      const toUpdate = records.filter(r => existingIds.has(r.student_id));
      const toInsert = records.filter(r => !existingIds.has(r.student_id));

      // Update existing records
      for (const rec of toUpdate) {
        await supabase
          .from('attendance')
          .update({ present: rec.present })
          .eq('session_id', rec.session_id)
          .eq('student_id', rec.student_id);
      }

      // Insert new records
      if (toInsert.length > 0) {
        const { error } = await supabase
          .from('attendance')
          .insert(toInsert);
        if (error) {
          if (error.code === '23503' || (error.message && error.message.includes('foreign key'))) {
            const { data: freshStudents } = await supabase.from('students').select('id').eq('active', true);
            const validIds = new Set((freshStudents || []).map(s => s.id));
            const validInserts = toInsert.filter(r => validIds.has(r.student_id));
            if (validInserts.length > 0) {
              const { error: retryErr } = await supabase.from('attendance').insert(validInserts);
              if (retryErr) throw retryErr;
            }
            removePendingAttendance(bandId, dateStr, sessionType);
            setHasDataEntered(false);
            setStep(3);
            return { success: true, warning: 'Some students were excluded due to roster changes.' };
          }
          throw error;
        }
      }

      removePendingAttendance(bandId, dateStr, sessionType);
      setHasDataEntered(false);
      setStep(3);
      return { success: true };
    } catch (e) {
      savePendingAttendance(bandId, dateStr, sessionType, term, year, baseRecords);
      throw e;
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [students, attendance, sessionDate, sessionType, term, year, bandId, ensureSession]);

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
