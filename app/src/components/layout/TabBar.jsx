export default function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex gap-0 mb-5 bg-[var(--gray-200)] rounded-lg p-[3px]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`flex-1 py-2.5 px-2 border-none text-sm font-semibold rounded-md cursor-pointer transition-all duration-200 ${
            activeTab === tab.id
              ? 'bg-white text-[var(--blue-700)] shadow-[var(--shadow-sm)]'
              : 'bg-transparent text-[var(--gray-600)]'
          }`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
