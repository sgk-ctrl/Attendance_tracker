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

  test('a small table costs one confirming request — the deliberate price of not assuming the cap', async () => {
    const t = makeCappedTable(71);
    const rows = await fetchAllRows(t.query);
    assert.equal(rows.length, 71);
    // A first page shorter than requested is ambiguous: end-of-data, or the
    // server capping us? We ask once more rather than guess. Assuming here is
    // what silently truncated reports before. Two requests on a 71-row roster
    // is imperceptible; a quietly under-counted term is not.
    assert.equal(t.ranges.length, 2);
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

  // These caps are the whole point: the first version of this helper assumed the
  // server's ceiling was 1000, so a project configured lower silently returned a
  // truncated term — the exact bug the helper exists to prevent. The cap is
  // discovered at runtime now; never reintroduce a hardcoded page size.
  for (const cap of [500, 200, 137]) {
    test(`returns every row when the server caps responses at ${cap} (below the request size)`, async () => {
      const t = makeCappedTable(1420, cap);
      const rows = await fetchAllRows(t.query);
      assert.equal(rows.length, 1420);
      assert.deepEqual(rows.map(r => r.id), t.all.map(r => r.id));
    });
  }

  test('a table smaller than the server cap still returns fully', async () => {
    const rows = await fetchAllRows(makeCappedTable(71, 500).query);
    assert.equal(rows.length, 71);
  });
});
