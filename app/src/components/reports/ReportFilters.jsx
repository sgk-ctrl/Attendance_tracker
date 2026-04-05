import { REPORT_YEARS } from '../../lib/constants';
import Button from '../ui/Button';

export default function ReportFilters({ year, term, onYearChange, onTermChange, onGenerate }) {
  return (
    <div className="mb-4">
      <div className="flex gap-2.5 flex-wrap mb-4">
        <select
          value={year}
          onChange={(e) => onYearChange(parseInt(e.target.value))}
          className="flex-1 min-w-[120px] px-3 py-2.5 border-2 border-[var(--gray-300)] rounded-lg text-sm bg-white"
        >
          {REPORT_YEARS.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <select
          value={term}
          onChange={(e) => onTermChange(e.target.value)}
          className="flex-1 min-w-[120px] px-3 py-2.5 border-2 border-[var(--gray-300)] rounded-lg text-sm bg-white"
        >
          <option value="">All Terms</option>
          <option value="1">Term 1</option>
          <option value="2">Term 2</option>
          <option value="3">Term 3</option>
          <option value="4">Term 4</option>
        </select>
      </div>
      <Button onClick={onGenerate} className="mb-4">Generate Report</Button>
    </div>
  );
}
