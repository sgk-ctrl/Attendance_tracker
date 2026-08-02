// Tests for the report arithmetic. Each case pins a defect that was found live
// in production during Term 3 2026 — if one fails, wrong numbers are back in
// front of parents and the coordinator.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { computeReport } from './reports.js';

const students = [
  { id: 1, first_name: 'Alice', last_name: 'A', instrument_id: 10 },
  { id: 2, first_name: 'Ben', last_name: 'B', instrument_id: 10 },
];
const instruments = [{ id: 10, name: 'Flute', display_order: 1 }];
const sess = (id, date) => ({ id, session_date: date, session_time: '3:10 PM', session_type: 'afternoon' });
const row = (session_id, student_id, present) => ({ session_id, student_id, present });

const byId = (r, id) => r.studentRows.find(s => s.id === id);

describe('ghost sessions (the live Term-3 defect)', () => {
  test('a session with zero attendance rows does not count — with 2 ghosts + 1 real rehearsal, a fully-present child reads 100%, not 33%', () => {
    const sessions = [sess(90, '2026-07-17'), sess(91, '2026-07-21'), sess(92, '2026-07-22')];
    const attData = [row(92, 1, true), row(92, 2, true)]; // only session 92 is real
    const r = computeReport({ sessions, attData, students, instruments });
    assert.equal(r.totalSessions, 1);
    assert.equal(byId(r, 1).pct, 100);
    assert.equal(byId(r, 1).total, 1);
  });

  test('ghost sessions do not appear as register columns of dashes', () => {
    const sessions = [sess(90, '2026-07-17'), sess(92, '2026-07-22')];
    const attData = [row(92, 1, true), row(92, 2, false)];
    const r = computeReport({ sessions, attData, students, instruments });
    assert.deepEqual(r.sortedSessions.map(s => s.id), [92]);
  });
});

describe('mid-term joiner (per-student denominator)', () => {
  test('a student who joined for the last 2 of 5 sessions is scored over 2, not 5', () => {
    const sessions = [1, 2, 3, 4, 5].map(i => sess(i, `2026-07-${10 + i}`));
    const attData = [
      // Alice: all five sessions, all present
      ...[1, 2, 3, 4, 5].map(i => row(i, 1, true)),
      // Ben joined at session 4: present 4, absent 5
      row(4, 2, true), row(5, 2, false),
    ];
    const r = computeReport({ sessions, attData, students, instruments });
    const ben = byId(r, 2);
    assert.equal(ben.total, 2);   // not 5
    assert.equal(ben.pct, 50);    // 1 of 2 — not 20% (1 of 5)
    assert.equal(byId(r, 1).pct, 100);
  });

  test("instrument % uses members' own windows — a joiner no longer drags the section", () => {
    const sessions = [1, 2].map(i => sess(i, `2026-07-${10 + i}`));
    const attData = [row(1, 1, true), row(2, 1, true), row(2, 2, true)]; // Ben only enrolled for session 2
    const r = computeReport({ sessions, attData, students, instruments });
    const flute = r.instRows.find(i => i.id === 10);
    assert.equal(flute.attended, 3);
    assert.equal(flute.possible, 3); // 2 (Alice) + 1 (Ben), NOT 2 students x 2 sessions = 4
    assert.equal(flute.pct, 100);
  });
});

describe('ordinary maths still hold', () => {
  test('absences count against the denominator as before', () => {
    const sessions = [1, 2].map(i => sess(i, `2026-07-${10 + i}`));
    const attData = [row(1, 1, true), row(2, 1, false), row(1, 2, false), row(2, 2, false)];
    const r = computeReport({ sessions, attData, students, instruments });
    assert.equal(byId(r, 1).pct, 50);
    assert.equal(byId(r, 2).pct, 0);
    assert.equal(r.totalSessions, 2);
  });

  test('no sessions at all → empty-safe zeros', () => {
    const r = computeReport({ sessions: [], attData: [], students, instruments });
    assert.equal(r.totalSessions, 0);
    assert.equal(byId(r, 1).pct, 0);
  });

  test('rows for a student no longer in the roster query are ignored, not crashed on', () => {
    const sessions = [sess(1, '2026-07-11')];
    const attData = [row(1, 1, true), row(1, 999, true)]; // 999 deactivated/unknown
    const r = computeReport({ sessions, attData, students, instruments });
    assert.equal(byId(r, 1).pct, 100);
    assert.equal(r.studentRows.length, 2);
  });
});
