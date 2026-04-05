export default function WarningBanner({ icon = '\u26A0', children }) {
  return (
    <div className="bg-[var(--orange-100)] border border-[var(--orange-500)] rounded-lg p-3.5 px-4 mt-4 flex items-start gap-2.5 text-sm text-[var(--gray-900)]">
      <span className="text-lg flex-shrink-0">{icon}</span>
      <div>{children}</div>
    </div>
  );
}
