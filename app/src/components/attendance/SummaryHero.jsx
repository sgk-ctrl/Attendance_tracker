import { useEffect, useRef } from 'react';
import { animateCountUp } from '../../lib/utils';

export default function SummaryHero({ presentCount, totalStudents }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      animateCountUp(ref.current, presentCount, totalStudents, 800);
    }
  }, [presentCount, totalStudents]);

  return (
    <div className="bg-white rounded-xl p-6 mb-4 shadow-[var(--shadow)] text-center">
      <div className="text-sm text-[var(--green-600)] font-semibold mb-2">
        &#10003; Attendance Recorded
      </div>
      <div
        ref={ref}
        className="text-5xl font-extrabold text-[var(--blue-700)]"
      >
        {presentCount} / {totalStudents}
      </div>
      <div className="text-sm text-[var(--gray-600)] mt-1">
        students present
      </div>
    </div>
  );
}
