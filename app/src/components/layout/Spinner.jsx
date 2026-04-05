export default function Spinner({ text = 'Loading...', show = false }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(10,15,26,0.9)] backdrop-blur-sm z-[200] flex items-center justify-center flex-col gap-3">
      <div className="spinner-circle" />
      <div className="text-sm text-[var(--text-secondary)] font-medium">{text}</div>
    </div>
  );
}
