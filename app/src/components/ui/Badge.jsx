export function SessionBadge({ children }) {
  return (
    <span className="inline-block bg-[var(--accent-blue-bg-strong)] text-[var(--accent-blue-light)] px-4 py-2 rounded-full text-sm font-semibold mt-2">
      {children}
    </span>
  );
}

export function TermBadge({ children }) {
  return (
    <span className="inline-block bg-[var(--surface-elevated)] text-[var(--text-secondary)] px-3.5 py-1.5 rounded-full text-[13px] font-medium mt-2">
      {children}
    </span>
  );
}
