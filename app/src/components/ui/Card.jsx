export default function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-[20px] p-5 mb-4 ${className}`}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
      }}
    >
      {children}
    </div>
  );
}
