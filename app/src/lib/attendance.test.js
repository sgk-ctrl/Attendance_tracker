// Tests for the attendance write path — the only code in this app that can
// silently destroy a roll call. Run with: npm test
//
// Uses Node's built-in test runner (node:test) deliberately: no new dependency,
// no config, nothing extra for a solo maintainer to keep working. The Supabase
// client is stubbed via a module mock so the real saveAttendance logic runs
// untouched — these tests exercise the shipped code, not a copy of it.
//
// Every case below is a bug that actually reached production or was caught in
// review. If one fails, that bug is back.

import { test, describe, mock } from 'node:test';
import assert from 'node:assert/strict';

const calls = [];
let scenario = {};

function makeClient() {
  return {
    from(table) {
      const q = { table, _f: {} };
      q.select = () => q;
      q.eq = (k, v) => { q._f[k] = v; return q; };
      q.order = () => q;
      q.limit = () => {
        if (table === 'sessions') {
          const hit = (scenario.existingSessions || []).find(s =>
            s.band_id === q._f.band_id && s.session_date === q._f.session_date && s.session_time === q._f.session_time);
          return Promise.resolve({ data: hit ? [hit] : [], error: null });
        }
        return Promise.resolve({ data: [], error: null });
      };
      // The roster refetch is awaited directly (no .limit()), so the builder
      // itself must be thenable.
      q.then = (res) => {
        calls.push({ op: 'students-refetch', filters: { ...q._f } });
        return Promise.resolve(scenario.studentsResult ?? { data: [], error: null }).then(res);
      };
      q.insert = (row) => {
        calls.push({ op: 'insert', table, row });
        const chain = {
          select: () => chain,
          single: () => {
            if (scenario.insertConflict) {
              (scenario.existingSessions ||= []).push({ id: 99, ...row });
              return Promise.resolve({ data: null, error: { code: '23505', message: 'duplicate key' } });
            }
            return Promise.resolve({ data: { id: 7, ...row }, error: null });
          },
        };
        return chain;
      };
      q.upsert = (rows, opts) => {
        calls.push({ op: 'upsert', table, count: rows.length, onConflict: opts?.onConflict, rows });
        return Promise.resolve({ error: (scenario.upsertErrors || []).shift() ?? null });
      };
      return q;
    },
  };
}

mock.module('./supabase.js', { namedExports: { get supabase() { return makeClient(); } } });
const { saveAttendance } = await import('./attendance.js');

const P = { bandId: 1, dateStr: '2026-07-20', sessionTime: '3:10 PM', sessionType: 'afternoon', term: 3, year: 2026, recordedBy: 'a@b.com' };
const RECORDS = [{ student_id: 1, present: true }, { student_id: 2, present: false }];

function reset(s = {}) { calls.length = 0; scenario = s; }
const upserts = () => calls.filter(c => c.op === 'upsert');

describe('session handling', () => {
  test('creates a session carrying session_time — a NULL/empty time makes the session invisible to every read path and duplicates the rehearsal', async () => {
    reset();
    await saveAttendance({ ...P, records: RECORDS });
    const ins = calls.find(c => c.op === 'insert');
    assert.equal(ins.row.session_time, '3:10 PM');
    assert.equal(ins.row.recorded_by, 'a@b.com');
  });

  test('reuses an existing session instead of creating a duplicate', async () => {
    reset({ existingSessions: [{ id: 42, band_id: 1, session_date: '2026-07-20', session_time: '3:10 PM' }] });
    await saveAttendance({ ...P, records: RECORDS });
    assert.equal(calls.some(c => c.op === 'insert'), false);
    assert.equal(upserts()[0].rows[0].session_id, 42);
  });

  test('adopts the winner row when two volunteers race (23505)', async () => {
    reset({ insertConflict: true });
    await saveAttendance({ ...P, records: RECORDS });
    assert.equal(upserts()[0].rows[0].session_id, 99);
  });
});

describe('attendance writes', () => {
  test('writes the roll call as ONE upsert on the unique key — the old update-loop discarded its errors and reported false success', async () => {
    reset();
    await saveAttendance({ ...P, records: RECORDS });
    assert.equal(upserts().length, 1);
    assert.equal(upserts()[0].onConflict, 'session_id,student_id');
    assert.equal(upserts()[0].count, 2);
  });

  test('throws on a rejected write — must never report success while the DB keeps the old marks', async () => {
    reset({ upsertErrors: [{ code: '42501', message: 'permission denied' }] });
    await assert.rejects(() => saveAttendance({ ...P, records: RECORDS }));
  });
});

describe('roster changed mid-session (FK violation)', () => {
  test('drops only the hard-deleted student and keeps the rest', async () => {
    reset({ upsertErrors: [{ code: '23503', message: 'foreign key' }], studentsResult: { data: [{ id: 1 }], error: null } });
    const r = await saveAttendance({ ...P, records: RECORDS });
    assert.equal(upserts()[1].count, 1);
    assert.match(r.warning, /1 student was excluded/);
  });

  test('does NOT filter the roster by active — an FK only fails for a row that no longer exists, so filtering would silently drop deactivated students real marks', async () => {
    reset({ upsertErrors: [{ code: '23503', message: 'foreign key' }], studentsResult: { data: [{ id: 1 }, { id: 2 }], error: null } });
    await saveAttendance({ ...P, records: RECORDS });
    assert.equal(calls.find(c => c.op === 'students-refetch').filters.active, undefined);
    assert.equal(upserts()[1].count, 2);
  });

  test('throws if the roster refetch fails — returning success here wrote zero rows and the caller then deleted the local backup', async () => {
    reset({ upsertErrors: [{ code: '23503', message: 'foreign key' }], studentsResult: { data: null, error: { message: 'network down' } } });
    await assert.rejects(() => saveAttendance({ ...P, records: RECORDS }));
  });

  test('throws when nothing is writable rather than claiming an empty success', async () => {
    reset({ upsertErrors: [{ code: '23503', message: 'foreign key' }], studentsResult: { data: [], error: null } });
    await assert.rejects(() => saveAttendance({ ...P, records: RECORDS }));
  });
});
