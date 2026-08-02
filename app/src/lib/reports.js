// Pure report arithmetic — extracted from useReports so it can be tested under
// Node's runner (no React, no jsdom) and ported to a native app unchanged.
//
// The two rules that make the numbers honest:
//
// 1. A session only counts if it carries at least one attendance row. The old
//    `sessions.length` denominator counted "ghost" sessions (created by opening
//    the flow and backing out under the pre-fix build) — two ghosts + one real
//    rehearsal made every child read 33% instead of 100%.
//
// 2. Each student's denominator is THEIR OWN row count, not the term's session
//    count. Submitting writes a row for every active student, so a child who
//    joins mid-term has rows only from the session they joined — dividing by
//    the whole term scored a new joiner 0/15 instead of, say, 5/6. No join-date
//    column needed; the rows already encode the window.
export function computeReport({ sessions, attData, students, instruments }) {
  // Sessions that actually carry marks (rule 1).
  const markedSessionIds = new Set(attData.map(a => a.session_id));
  const countedSessions = sessions.filter(s => markedSessionIds.has(s.id));
  const totalSessions = countedSessions.length;

  const instMap = {};
  instruments.forEach(i => { instMap[i.id] = i.name; });

  // Per-student tallies: rows = sessions they were on the roster for (rule 2),
  // attended = rows marked present.
  const studentAtt = {};
  students.forEach(s => { studentAtt[s.id] = { student: s, attended: 0, rows: 0 }; });
  attData.forEach(a => {
    const sa = studentAtt[a.student_id];
    if (!sa) return; // row for a student not in the (active) roster query
    sa.rows++;
    if (a.present) sa.attended++;
  });

  const studentRows = Object.values(studentAtt)
    .map(sa => ({
      id: sa.student.id,
      name: `${sa.student.first_name} ${sa.student.last_name}`,
      instrument: instMap[sa.student.instrument_id] || '?',
      instrumentId: sa.student.instrument_id,
      attended: sa.attended,
      total: sa.rows,
      pct: sa.rows > 0 ? Math.round(sa.attended / sa.rows * 100) : 0,
    }))
    .sort((a, b) => a.pct - b.pct);

  // Instrument %: sum of members' present marks over sum of their rows — so a
  // mid-term joiner no longer drags their whole section down.
  const instRows = instruments.map(inst => {
    const studs = students.filter(s => s.instrument_id === inst.id);
    let attended = 0, possible = 0;
    studs.forEach(s => {
      attended += studentAtt[s.id]?.attended || 0;
      possible += studentAtt[s.id]?.rows || 0;
    });
    return {
      id: inst.id,
      name: inst.name,
      attended,
      possible,
      pct: possible > 0 ? Math.round(attended / possible * 100) : 0,
    };
  }).sort((a, b) => a.pct - b.pct);

  // Register columns: only sessions with marks — a mark-less column of dashes
  // is noise, and under the fixed build a mark-less session is either transient
  // (sync in flight) or leftover damage.
  const sortedSessions = [...countedSessions].sort((a, b) => a.session_date.localeCompare(b.session_date));
  const attMap = {};
  attData.forEach(a => { attMap[`${a.student_id}_${a.session_id}`] = a.present; });

  const registerByInst = instruments
    .map(inst => {
      const studs = students
        .filter(s => s.instrument_id === inst.id)
        .sort((a, b) => a.last_name.localeCompare(b.last_name));
      return studs.length > 0 ? { inst, studs } : null;
    })
    .filter(Boolean);

  return { studentRows, instRows, totalSessions, sortedSessions, registerByInst, attMap, instMap };
}
