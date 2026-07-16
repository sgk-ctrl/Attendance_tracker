// PostgREST caps every response at the project's "Max Rows" setting (1000 by
// default) and truncates SILENTLY — no error, no flag. Checking `error` cannot
// catch it, which makes it invisible to this codebase's own discipline.
//
// This app hits that ceiling in the middle of a term: 71 students x 15 sessions
// = 1065 attendance rows. Past that, reports quietly under-count every child —
// the worst kind of bug here, because a slightly-wrong report looks exactly like
// a right one and nobody notices for weeks.
//
// Pages until a short page comes back. The server's cap is LEARNED from the
// first response rather than assumed: "shorter than we asked for" is only
// end-of-data if the server is not silently capping us at something smaller.
// Assuming a fixed 1000 here re-created the exact bug this file exists to
// prevent — with Max Rows set to 500, a 1420-row term returned 500 rows and no
// error. We cannot read that setting from the client, so we must not depend on
// knowing it.
const REQUEST_SIZE = 1000;

export async function fetchAllRows(buildQuery) {
  const rows = [];
  let serverCap = null; // discovered from the first full response
  for (let from = 0; ; from += (serverCap ?? REQUEST_SIZE)) {
    const asked = REQUEST_SIZE;
    const { data, error } = await buildQuery().range(from, from + asked - 1);
    if (error) throw error;
    const page = data || [];
    rows.push(...page);

    // Empty page = definitively the end, whatever the cap is.
    if (page.length === 0) return rows;

    // The first page reveals the server's real ceiling: if it returned fewer
    // rows than we asked for, that is either the end of the data OR the cap.
    // Treat it as the cap and ask again from the next offset — one extra
    // request settles it, and an extra request is cheap next to a silently
    // under-counted report.
    if (serverCap === null) serverCap = page.length;

    // A page shorter than the established ceiling means we are done.
    if (page.length < serverCap) return rows;

    // Backstop against a pathological server turning this into an infinite loop.
    if (rows.length > 500000) throw new Error('fetchAllRows: refusing to page beyond 500k rows');
  }
}
