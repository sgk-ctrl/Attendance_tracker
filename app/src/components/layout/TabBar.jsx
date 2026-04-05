export default function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex gap-0 mb-5 bg-[var(--bg-secondary)] rounded-lg p-[3px] border border-[var(--border-subtle)]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`flex-1 py-2.5 px-2 border-none text-sm font-semibold rounded-md cursor-pointer transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-[var(--accent-blue-bg-strong)] text-[var(--accent-blue-light)] border-b-2 border-b-[var(--accent-blue)] shadow-[var(--shadow-sm)]'
              : 'bg-transparent text-[var(--text-muted)]'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
