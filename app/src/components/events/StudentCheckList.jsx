import StudentRow from '../attendance/StudentRow';

export default function StudentCheckList({ students, attendance, onToggle }) {
  return (
    <div className="bg-white rounded-xl shadow-[var(--shadow)] overflow-hidden">
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
