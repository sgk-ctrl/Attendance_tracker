export default function SummaryHero({ presentCount, totalStudents, recordedBy }) {
  // No count-up animation. A volunteer takes this roll twice a week; a number
  // that ticks up over 800ms is friction dressed as delight, and it delays them
  // reading the one figure they came for. Silent success: show it instantly.
  // The hero IS the emphasised surface — it keeps the full card treatment while
  // tally rows sit flatter, so the flow has a clear peak.
  return (
    <div className="bg-[var(--bg-card-solid)] rounded-[16px] p-6 mb-4 shadow-[var(--shadow-md)] border border-[var(--border-card)] text-center">
      <div className="text-xs uppercase tracking-[0.14em] text-[var(--text-muted)] font-semibold mb-3">
        Attendance recorded
      </div>
      <div className="display-num text-6xl text-[var(--accent-blue-light)] leading-none">
        {presentCount}<span className="text-[var(--text-muted)] font-normal">/{totalStudents}</span>
      </div>
      <div className="text-sm text-[var(--text-secondary)] mt-2">
        students present
      </div>
      {recordedBy && (
        <div className="text-xs text-[var(--text-muted)] mt-3 pt-3 border-t border-[var(--border-subtle)]">
          Recorded by: <span className="font-semibold text-[var(--text-secondary)]">{recordedBy}</span>
        </div>
      )}
    </div>
  );
}
