import { useEffect, useRef } from 'react';
import { animateCountUp } from '../../lib/utils';

export default function SummaryHero({ presentCount, totalStudents, recordedBy }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      animateCountUp(ref.current, presentCount, totalStudents, 800);
    }
  }, [presentCount, totalStudents]);

  return (
    <div className="bg-[var(--bg-card)] rounded-[16px] p-6 mb-4 shadow-[var(--shadow)] border border-[var(--border-card)] backdrop-blur-[10px] text-center">
      <div className="text-sm text-[var(--accent-green)] font-semibold mb-2">
        &#10003; Attendance Recorded
      </div>
      <div
        ref={ref}
        className="text-5xl font-extrabold text-[var(--accent-blue-light)]"
      >
        {presentCount} / {totalStudents}
      </div>
      <div className="text-sm text-[var(--text-secondary)] mt-1">
        students present
      </div>
      {recordedBy && (
        <div className="text-xs text-[var(--text-muted)] mt-3 pt-3 border-t border-[var(--border-subtle)]">
          Recorded by: <span className="font-semibold text-[var(--text-secondary)]">{recordedBy}</span>
        </div>
      )}
    </div>
  );
}
