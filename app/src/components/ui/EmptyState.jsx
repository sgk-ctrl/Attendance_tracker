export default function EmptyState({ icon, children }) {
  return (
    <div className="text-center py-10 px-5 text-[var(--gray-600)] text-[15px]">
      {icon && <span className="text-[40px] mb-3 block">{icon}</span>}
      {children}
    </div>
  );
}
