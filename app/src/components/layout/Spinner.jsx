export default function Spinner({ text = 'Loading...', show = false }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-white/85 z-[200] flex items-center justify-center flex-col gap-3">
      <div className="spinner-circle" />
      <div className="text-sm text-[var(--gray-600)] font-medium">{text}</div>
    </div>
  );
}
