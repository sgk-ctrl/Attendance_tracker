export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-[var(--bg-card)] rounded-[16px] p-5 mb-4 shadow-[var(--shadow)] border border-[var(--border-card)] backdrop-blur-[10px] ${className}`}>
      {children}
    </div>
  );
}
