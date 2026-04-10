import { useState } from 'react';
import { TERMS } from '../../lib/constants';

export default function TermBadgeEditor({ term, year, onTermChange }) {
  const [editing, setEditing] = useState(false);

  const handleChange = (e) => {
    onTermChange(parseInt(e.target.value));
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="mt-2">
        <select
          className="term-override-select"
          value={term}
          onChange={handleChange}
        >
          {TERMS.map(t => (
            <option key={t} value={t}>Term {t}</option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="mt-2 flex items-center gap-1">
      <span className="inline-block bg-[var(--surface-elevated)] text-[var(--text-secondary)] px-3.5 py-1.5 rounded-full text-[13px] font-medium">
        Term {term}, {year}
      </span>
      <button
        type="button"
        className="text-xs text-[var(--accent-blue-light)] underline bg-transparent border-none cursor-pointer px-3 min-h-[44px] min-w-[44px]"
        onClick={() => setEditing(true)}
        aria-label={`Edit term (currently Term ${term})`}
      >
        edit
      </button>
    </div>
  );
}
