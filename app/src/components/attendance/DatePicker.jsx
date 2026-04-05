import { DAYS } from '../../lib/constants';
import { formatDate, dateToISO } from '../../lib/utils';

export default function DatePicker({ date, onChange }) {
  const dayName = DAYS[date.getDay()];
  const fullDate = formatDate(date);
  const isoValue = dateToISO(date);

  const handleChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    const parts = val.split('-');
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    if (!isNaN(d.getTime())) {
      onChange(d);
    }
  };

  return (
    <div className="text-center py-6 px-5">
      <div className="text-sm uppercase tracking-[1.5px] text-[var(--blue-600)] font-semibold">
        {dayName}
      </div>
      <div className="text-[28px] font-bold my-2 text-[var(--gray-900)]">
        {fullDate}
      </div>
      <div className="mt-3">
        <input
          type="date"
          value={isoValue}
          onChange={handleChange}
          className="w-full max-w-[280px] mx-auto block px-4 py-3 text-base font-semibold text-center border-2 border-[var(--blue-500)] rounded-lg bg-white text-[var(--gray-900)] cursor-pointer"
          style={{ fontSize: '16px' }}
        />
      </div>
    </div>
  );
}
