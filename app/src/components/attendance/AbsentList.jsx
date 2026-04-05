export default function AbsentList({ breakdown }) {
  const hasAbsent = breakdown.some(b => b.absent.length > 0);
  if (!hasAbsent) return null;

  return (
    <div className="bg-[var(--bg-card)] rounded-[16px] p-5 mb-4 shadow-[var(--shadow)] border border-[var(--border-card)] backdrop-blur-[10px]">
      <h4 className="text-sm font-bold text-[var(--accent-red)] mb-2">
        Absent Students
      </h4>
      {breakdown
        .filter(b => b.absent.length > 0)
        .map(({ inst, absent }) => (
          <div key={inst.id}>
            <div className="text-[13px] font-semibold text-[var(--text-secondary)] mt-2.5 mb-1">
              {inst.name}
            </div>
            {absent.map(s => (
              <div key={s.id} className="text-[13px] text-[var(--text-muted)] py-0.5">
                {s.first_name} {s.last_name}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
