export default function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div
      className="flex gap-0 mb-5 rounded-[14px] p-[3px]"
      style={{
        background: 'rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          className="flex-1 py-[7px] px-2 border-none text-[11px] font-semibold rounded-[11px] cursor-pointer transition-all duration-200"
          style={
            activeTab === tab.id
              ? {
                  background: 'var(--accent-blue)',
                  color: '#fff',
                  boxShadow: '0 2px 8px var(--accent-blue-glow)',
                  fontFamily: 'var(--font-display)',
                }
              : {
                  background: 'transparent',
                  color: 'var(--text-muted)',
                  fontFamily: 'var(--font-display)',
                }
          }
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
