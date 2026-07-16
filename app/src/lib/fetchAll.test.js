// PostgREST truncates at the project's Max Rows (default 1000) with NO error,
// so nothing in the app can detect it by checking `error`. These tests pin the
// paging behaviour that makes reports correct past ~session 15.

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { fetchAllRows } from './fetchAll.js';

// Stands in for a PostgREST endpoint that hard-caps every response at `cap`.
function makeCappedTable(totalRows, cap = 1000) {
  const all = Array.from({ length: totalRows }, (_, i) => ({ id: i + 1 }));
  const ranges = [];
  const q = {
    range(from, to) {
      ranges.push([from, to]);
      const page = all.slice(from, Math.min(to + 1, from + cap));
      return Promise.resolve({ data: page, error: null });
    },
  };
  return { query: () => q, ranges, all };
}

describe('fetchAllRows', () => {
  test('returns every row when the total exceeds the 1000-row cap — a term of attendance is 71 x 20 = 1420', async () => {
    const t = makeCappedTable(1420);
    const rows = await fetchAllRows(t.query);
    assert.equal(rows.length, 1420);
    assert.deepEqual(rows.map(r => r.id), t.all.map(r => r.id));
  });

  test('stops after one request when the data fits', async () => {
    const t = makeCappedTable(71);
    const rows = await fetchAllRows(t.query);
    assert.equal(rows.length, 71);
    assert.equal(t.ranges.length, 1);
  });

  test('handles an exact multiple of the page size without dropping or looping', async () => {
    const t = makeCappedTable(2000);
    const rows = await fetchAllRows(t.query);
    assert.equal(rows.length, 2000);
    assert.equal(t.ranges.length, 3); // 1000, 1000, then an empty page proves the end
  });

  test('returns empty for an empty table', async () => {
    const rows = await fetchAllRows(makeCappedTable(0).query);
    assert.deepEqual(rows, []);
  });

  test('propagates an error rather than silently returning a short result', async () => {
    await assert.rejects(() => fetchAllRows(() => ({
      range: () => Promise.resolve({ data: null, error: { message: 'boom' } }),
    })));
  });
});
