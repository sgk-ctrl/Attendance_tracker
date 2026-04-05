export default function AbsentList({ breakdown }) {
  const hasAbsent = breakdown.some(b => b.absent.length > 0);
  if (!hasAbsent) return null;

  return (
    <div className="bg-white rounded-xl p-5 mb-4 shadow-[var(--shadow)]">
      <h4 className="text-sm font-bold text-[var(--red-600)] mb-2">
        Absent Students
      </h4>
      {breakdown
        .filter(b => b.absent.length > 0)
        .map(({ inst, absent }) => (
          <div key={inst.id}>
            <div className="text-[13px] font-semibold text-[var(--gray-700)] mt-2.5 mb-1">
              {inst.name}
            </div>
            {absent.map(s => (
              <div key={s.id} className="text-[13px] text-[var(--gray-600)] py-0.5">
                {s.first_name} {s.last_name}
              </div>
            ))}
          </div>
        ))}
    </div>
  );
}
