export default function StudentRow({ student, checked, onToggle }) {
  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <div
      className={`student-row ${checked ? 'border-l-3 border-l-[var(--accent-green)]' : ''}`}
      role="checkbox"
      aria-checked={checked}
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
    >
      <div
        className={`w-7 h-7 border-2 rounded-md flex items-center justify-center flex-shrink-0 transition-all duration-200 text-base ${
          checked
            ? 'bg-[var(--accent-green)] border-[var(--accent-green)] text-white'
            : 'border-[#475569] text-transparent'
        }`}
      >
        &#10003;
      </div>
      <div className="text-[15px] font-medium flex-1 text-[var(--text-primary)]">
        {student.first_name} {student.last_name}
      </div>
      <div className="text-xs text-[var(--text-muted)] flex-shrink-0">
        {student.grade || '?'}
      </div>
    </div>
  );
}
