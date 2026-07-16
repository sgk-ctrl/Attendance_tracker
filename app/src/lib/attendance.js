// Explicit .js extension so this module is loadable by Node's test runner as
// well as Vite — it is the one module with real tests (attendance.test.js).
import { supabase } from './supabase.js';

// THE single write path for attendance. Both the live submit (useAttendanceFlow)
// and the offline retry (useOfflineSync) call saveAttendance — previously each
// had its own copy of this logic and they drifted: the offline copy omitted
// session_time, inserting a session every read path filtered right past, so an
// offline-recorded rehearsal was invisible and got recorded a second time.
// If you are changing how attendance is written, change it here only.

/**
 * Find the session for this band/date/time, or create it. Safe under two
 * volunteers submitting at once: the unique index on
 * sessions(band_id, session_date, session_time) makes the loser's insert fail
 * with 23505, and we adopt the winner's row rather than duplicating.
 */
export async function ensureSession({ bandId, dateStr, sessionTime, sessionType, term, year, recordedBy }) {
  const time = sessionTime || '';

  const find = async () => {
    // .limit(1) not .maybeSingle(): maybeSingle throws PGRST116 if duplicates
    // already exist, which would wedge a pending record forever with no way out.
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('band_id', bandId)
      .eq('session_date', dateStr)
      .eq('session_time', time)
      .order('id', { ascending: true })
      .limit(1);
    if (error) throw error;
    return data?.[0] ?? null;
  };

  const existing = await find();
  if (existing) return existing;

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      band_id: bandId,
      session_date: dateStr,
      session_time: time,
      session_type: sessionType,
      term,
      year,
      recorded_by: recordedBy || '',
    })
    .select()
    .single();

  if (error) {
    // Lost the race (or any other insert failure) — adopt the existing row.
    const adopted = await find();
    if (adopted) return adopted;
    throw error;
  }
  return data;
}

/**
 * Write a whole roll call. Idempotent: re-running it with the same input is a
 * no-op, which is what makes the offline retry safe to run repeatedly.
 *
 * records: [{ student_id, present }]
 */
export async function saveAttendance({ records, ...sessionParams }) {
  const session = await ensureSession(sessionParams);

  const rows = records.map(r => ({
    session_id: session.id,
    student_id: r.student_id,
    present: !!r.present,
  }));

  // One upsert replaces the old read-then-update-loop-then-insert. That loop
  // ignored the error on every UPDATE (supabase-js resolves rather than throws
  // on a PostgREST error), so a rejected write reported success while the
  // database kept the old marks. It also cost up to 71 serial round-trips.
  const { error } = await supabase
    .from('attendance')
    .upsert(rows, { onConflict: 'session_id,student_id' });

  if (error) {
    // A student HARD-deleted from the roster mid-session fails the FK. Drop only
    // the stale rows and retry, rather than losing the other 70 children's marks.
    if (error.code === '23503' || error.message?.includes('foreign key')) {
      // No .eq('active', true) here: an FK only fails for a row that no longer
      // EXISTS. Filtering on active would also discard students who were merely
      // deactivated — silently dropping real marks the database would accept.
      const { data: fresh, error: freshErr } = await supabase.from('students').select('id');
      // If we cannot establish which students are real, we cannot know what is
      // safe to write. Throw: the caller keeps its local copy and retries later.
      // Returning success here wrote ZERO rows and then deleted the backup.
      if (freshErr) throw freshErr;

      const valid = new Set((fresh || []).map(s => s.id));
      const kept = rows.filter(r => valid.has(r.student_id));
      if (kept.length === 0) throw error; // nothing writable — do not claim success

      const { error: retryErr } = await supabase
        .from('attendance')
        .upsert(kept, { onConflict: 'session_id,student_id' });
      if (retryErr) throw retryErr;

      const dropped = rows.length - kept.length;
      return { session, warning: `${dropped} student${dropped === 1 ? ' was' : 's were'} excluded — they are no longer on the roster.` };
    }
    throw error;
  }

  return { session };
}
