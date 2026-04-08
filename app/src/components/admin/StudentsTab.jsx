import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function StudentsTab({ students, instruments, onAdd, onUpdate, onToggleActive }) {
  const [showAll, setShowAll] = useState(false);
  const [newFirst, setNewFirst] = useState('');
  const [newLast, setNewLast] = useState('');
  const [newYear, setNewYear] = useState('');
  const [newInst, setNewInst] = useState('');

  const filtered = showAll ? students : students.filter(s => s.active);
  const instMap = {};
  instruments.forEach(i => { instMap[i.id] = i.name; });

  // Group by instrument
  const grouped = {};
  instruments.forEach(i => { grouped[i.id] = { name: i.name, students: [] }; });
  filtered.forEach(s => {
    if (grouped[s.instrument_id]) grouped[s.instrument_id].students.push(s);
    else {
      if (!grouped['unknown']) grouped['unknown'] = { name: 'Unknown', students: [] };
      grouped['unknown'].students.push(s);
    }
  });

  const handleAdd = async () => {
    if (!newFirst.trim() || !newLast.trim() || !newInst) return;
    await onAdd(newFirst.trim(), newLast.trim(), parseInt(newInst), newYear.trim() || null);
    setNewFirst(''); setNewLast(''); setNewYear(''); setNewInst('');
  };

  const inputClass = 'px-3 py-2 rounded-lg bg-[var(--surface-input,var(--bg-secondary))] border border-[var(--border-card)] text-[var(--text-primary)] text-sm';

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-[var(--text-primary)]">
          Students ({filtered.length}{showAll ? ` / ${students.length} total` : ''})
        </h3>
        <button onClick={() => setShowAll(!showAll)} className="text-sm text-[var(--accent-blue)] font-semibold min-h-[44px] px-2">
          {showAll ? 'Active Only' : 'Show All'}
        </button>
      </div>

      <div className="space-y-4">
        {Object.entries(grouped).map(([instId, group]) => {
          if (group.students.length === 0) return null;
          return (
            <div key={instId}>
              <div className="text-sm font-bold text-[var(--accent-blue)] mb-1">{group.name} ({group.students.length})</div>
              <div className="space-y-1">
                {group.students.map(s => (
                  <div key={s.id} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${s.active ? 'bg-[var(--bg-secondary)]' : 'bg-[var(--bg-secondary)] opacity-50'}`}>
                    <span className="flex-1 text-[var(--text-primary)]">{s.first_name} {s.last_name}</span>
                    <span className="text-xs text-[var(--text-muted)]">{s.grade || '-'}</span>
                    <select className="text-xs px-2 py-1 rounded bg-[var(--bg-card)] border border-[var(--border-card)] text-[var(--text-primary)]"
                      value={s.instrument_id} onChange={e => onUpdate(s.id, { instrument_id: parseInt(e.target.value) })}>
                      {instruments.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                    </select>
                    <button onClick={() => onToggleActive(s.id, !s.active)}
                      className={`text-xs font-semibold min-h-[36px] px-2 rounded ${s.active ? 'text-[var(--accent-red)]' : 'text-[var(--accent-green)]'}`}>
                      {s.active ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 pt-4 border-t border-[var(--border-card)]">
        <div className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Add Student</div>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <input className={inputClass} value={newFirst} onChange={e => setNewFirst(e.target.value)} placeholder="First name" />
          <input className={inputClass} value={newLast} onChange={e => setNewLast(e.target.value)} placeholder="Last name" />
          <input className={inputClass} value={newYear} onChange={e => setNewYear(e.target.value)} placeholder="Year (e.g. Year 3)" />
          <select className={inputClass} value={newInst} onChange={e => setNewInst(e.target.value)}>
            <option value="">Instrument</option>
            {instruments.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
          </select>
        </div>
        <Button onClick={handleAdd} disabled={!newFirst.trim() || !newLast.trim() || !newInst}>Add Student</Button>
      </div>
    </Card>
  );
}
