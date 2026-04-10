import StudentRow from './StudentRow';

export default function ResolveSection({ instrument, students, targetCount, majorityPresent, attendance, onToggle, onSelectAll, onDeselectAll }) {
  const checkedCount = students.filter(s => attendance[s.id] === true).length;
  const isResolved = checkedCount === targetCount;
  const absentTarget = students.length - targetCount;
  const absentCount = students.length - checkedCount;

  // When most students are present, flip the framing: ask "who is absent?" and
  // show progress toward the absent target. This matches how volunteers think
  // when only a few students are missing.
  const invertedPrompt = majorityPresent;
  const promptText = invertedPrompt
    ? `Tap the ${absentTarget} absent student${absentTarget === 1 ? '' : 's'}`
    : `Tap the ${targetCount} present student${targetCount === 1 ? '' : 's'}`;
  const statusText = invertedPrompt
    ? `${absentCount} of ${absentTarget} absent (${students.length} total)`
    : `${checkedCount} of ${targetCount} present (${students.length} total)`;

  return (
    <div className="mb-6">
      <div className="bg-[var(--accent-blue-bg-strong)] border border-[var(--border-card)] rounded-t-lg px-4 py-3.5 font-bold text-[var(--accent-blue-light)] flex justify-between items-start gap-2 text-[15px]">
        <div className="flex-1 min-w-0">
          {instrument.name}
          <small className="block text-[11px] font-normal text-[var(--text-muted)] mt-0.5">
            {promptText}
          </small>
          <small
            className={`block font-medium text-[13px] mt-0.5 ${
              isResolved ? 'text-[var(--accent-green)]' : 'text-[var(--accent-blue-light)]'
            }`}
          >
            {statusText}
          </small>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          <button
            className="px-2.5 py-1 rounded-[14px] text-xs font-semibold border cursor-pointer transition-all duration-200 bg-[var(--accent-green-bg)] text-[var(--accent-green)] border-[var(--accent-green-border)] active:bg-[var(--accent-green)] active:text-white"
            onClick={onSelectAll}
          >
            Select All
          </button>
          <button
            className="px-2.5 py-1 rounded-[14px] text-xs font-semibold border cursor-pointer transition-all duration-200 bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] active:bg-[var(--text-muted)] active:text-white"
            onClick={onDeselectAll}
          >
            Deselect All
          </button>
        </div>
      </div>
      <div className="bg-[var(--bg-card)] rounded-b-lg shadow-[var(--shadow)] border border-t-0 border-[var(--border-card)] overflow-hidden">
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
