export default function BreakdownList({ breakdown }) {
  return (
    <div className="bg-white rounded-xl p-5 mb-4 shadow-[var(--shadow)]">
      <h3 className="text-[15px] font-bold mb-3">Breakdown by Instrument</h3>
      {breakdown.map(({ inst, present, total }) => (
        <div
          key={inst.id}
          className="flex items-center justify-between py-2.5 border-b border-[var(--gray-200)] last:border-b-0"
        >
          <div className="font-semibold text-sm">{inst.name}</div>
          <div className="text-sm text-[var(--gray-600)] font-medium">
            {present} / {total}
          </div>
        </div>
      ))}
    </div>
  );
}
