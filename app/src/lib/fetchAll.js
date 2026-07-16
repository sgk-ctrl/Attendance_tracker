// PostgREST caps every response at the project's "Max Rows" setting (1000 by
// default) and truncates SILENTLY — no error, no flag. Checking `error` cannot
// catch it, which makes it invisible to this codebase's own discipline.
//
// This app hits that ceiling in the middle of a term: 71 students x 15 sessions
// = 1065 attendance rows. Past that, reports quietly under-count every child —
// the worst kind of bug here, because a slightly-wrong report looks exactly like
// a right one and nobody notices for weeks.
//
// Pages until a short page comes back, so it is correct regardless of what the
// dashboard's Max Rows is set to (which we cannot read from the client, and
// which nobody will remember to check again).
const PAGE_SIZE = 1000;

export async function fetchAllRows(buildQuery) {
  const rows = [];
  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    const page = data || [];
    rows.push(...page);
    // A short page means we reached the end. A full page might be the ceiling,
    // so ask again.
    if (page.length < PAGE_SIZE) return rows;
    // Backstop against an unexpected server-side cap smaller than PAGE_SIZE
    // turning this into an infinite loop.
    if (rows.length > 500000) throw new Error('fetchAllRows: refusing to page beyond 500k rows');
  }
}
