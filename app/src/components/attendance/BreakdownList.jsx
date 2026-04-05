export default function BreakdownList({ breakdown }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-[16px] p-5 mb-4 shadow-[var(--shadow)] border border-[var(--border-card)] backdrop-blur-[10px]">
      <h3 className="text-[15px] font-bold mb-3 text-[var(--text-primary)]">Breakdown by Instrument</h3>
      {breakdown.map(({ inst, present, total }) => (
        <div
          key={inst.id}
          className="flex items-center justify-between py-2.5 border-b border-[var(--border-subtle)] last:border-b-0"
        >
          <div className="font-semibold text-sm text-[var(--text-primary)]">{inst.name}</div>
          <div className="text-sm text-[var(--text-secondary)] font-medium">
            {present} / {total}
          </div>
        </div>
      ))}
    </div>
  );
}
