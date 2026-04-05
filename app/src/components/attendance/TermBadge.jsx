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
    <div className="mt-2">
      <span className="inline-block bg-[var(--surface-elevated)] text-[var(--text-secondary)] px-3.5 py-1.5 rounded-full text-[13px] font-medium">
        Term {term}, {year}
      </span>
      <span
        className="text-xs text-[var(--accent-blue-light)] cursor-pointer ml-1.5 underline inline-block align-middle"
        onClick={() => setEditing(true)}
      >
        edit
      </span>
    </div>
  );
}
