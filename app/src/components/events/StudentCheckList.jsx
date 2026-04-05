import StudentRow from '../attendance/StudentRow';

export default function StudentCheckList({ students, attendance, onToggle }) {
  return (
    <div className="bg-[var(--bg-card)] rounded-[16px] shadow-[var(--shadow)] border border-[var(--border-card)] backdrop-blur-[10px] overflow-hidden">
      {students.map(s => (
        <StudentRow
          key={s.id}
          student={s}
          checked={!!attendance[s.id]}
          onToggle={() => onToggle(s.id)}
        />
      ))}
    </div>
  );
}
