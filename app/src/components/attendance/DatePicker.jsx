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
    <div className="text-center py-8 px-5">
      <div className="text-sm uppercase tracking-[1.5px] text-[var(--blue-600)] font-semibold">
        {dayName}
      </div>
      <div className="text-[28px] font-bold my-2 text-[var(--gray-900)]">
        {fullDate}
      </div>
      <label className="relative overflow-hidden inline-flex items-center gap-2 bg-[var(--blue-50)] border-2 border-dashed border-[var(--blue-400)] rounded-lg py-3 px-5 mt-3 cursor-pointer transition-all duration-200 active:bg-[var(--blue-100)] active:border-[var(--blue-600)]">
        <span className="text-xl">&#128197;</span>
        <span className="text-sm font-semibold text-[var(--blue-700)]">Change Date</span>
        <input
          type="date"
          value={isoValue}
          onChange={handleChange}
          className="date-input-native"
        />
      </label>
    </div>
  );
}
