import { HOURS, MINUTES, AMPM } from '../../lib/constants';

export default function TimePicker({ hour, minute, ampm, onChange }) {
  return (
    <div className="mt-4">
      <label className="text-sm font-semibold text-[var(--gray-700)] block mb-2">
        Session start time:
      </label>
      <div className="time-picker-row flex items-center gap-1.5 justify-center">
        <select
          value={hour}
          onChange={(e) => onChange({ hour: e.target.value, minute, ampm })}
        >
          {HOURS.map(h => (
            <option key={h} value={h}>{h}</option>
          ))}
        </select>
        <span className="text-[22px] font-bold text-[var(--gray-700)]">:</span>
        <select
          value={minute}
          onChange={(e) => onChange({ hour, minute: e.target.value, ampm })}
        >
          {MINUTES.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={ampm}
          onChange={(e) => onChange({ hour, minute, ampm: e.target.value })}
        >
          {AMPM.map(a => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
