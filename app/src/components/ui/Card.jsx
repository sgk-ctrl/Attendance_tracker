export default function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-xl p-5 mb-4 shadow-[var(--shadow)] ${className}`}>
      {children}
    </div>
  );
}
