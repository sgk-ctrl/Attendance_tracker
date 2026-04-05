export function SessionBadge({ children }) {
  return (
    <span className="inline-block bg-[var(--blue-100)] text-[var(--blue-700)] px-4 py-2 rounded-full text-sm font-semibold mt-2">
      {children}
    </span>
  );
}

export function TermBadge({ children }) {
  return (
    <span className="inline-block bg-[var(--gray-200)] text-[var(--gray-700)] px-3.5 py-1.5 rounded-full text-[13px] font-medium mt-2">
      {children}
    </span>
  );
}
