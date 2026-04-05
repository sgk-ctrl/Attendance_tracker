import StudentRow from './StudentRow';

export default function ResolveSection({ instrument, students, targetCount, attendance, onToggle, onSelectAll, onDeselectAll }) {
  const checkedCount = students.filter(s => attendance[s.id] === true).length;
  const isResolved = checkedCount === targetCount;

  return (
    <div className="mb-6">
      <div className="bg-[var(--blue-100)] rounded-t-lg px-4 py-3.5 font-bold text-[var(--blue-800)] flex justify-between items-start gap-2 text-[15px]">
        <div>
          {instrument.name}
          <small
            className={`block font-medium text-[13px] mt-0.5 ${
              isResolved ? 'text-[var(--green-600)]' : 'text-[var(--blue-600)]'
            }`}
          >
            {checkedCount} of {targetCount} selected ({students.length} total)
          </small>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            className="px-2.5 py-1 rounded-[14px] text-xs font-semibold border cursor-pointer transition-all duration-200 bg-[var(--green-100)] text-[var(--green-600)] border-[var(--green-500)] active:bg-[var(--green-500)] active:text-white"
            onClick={onSelectAll}
          >
            Select All
          </button>
          <button
            className="px-2.5 py-1 rounded-[14px] text-xs font-semibold border cursor-pointer transition-all duration-200 bg-[var(--gray-200)] text-[var(--gray-700)] border-[var(--gray-400)] active:bg-[var(--gray-400)] active:text-white"
            onClick={onDeselectAll}
          >
            Deselect All
          </button>
        </div>
      </div>
      <div className="bg-white rounded-b-lg shadow-[var(--shadow)] overflow-hidden">
        {students.map(s => (
          <StudentRow
            key={s.id}
            student={s}
            checked={!!attendance[s.id]}
            onToggle={() => onToggle(s.id)}
          />
        ))}
      </div>
    </div>
  );
}
