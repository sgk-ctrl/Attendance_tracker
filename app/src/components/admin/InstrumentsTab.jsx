import { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function InstrumentsTab({ instruments, students, onAdd, onUpdate, onDelete }) {
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState('');

  const studentCountMap = {};
  (students || []).forEach(s => {
    studentCountMap[s.instrument_id] = (studentCountMap[s.instrument_id] || 0) + 1;
  });

  const handleAdd = async () => {
    if (!newName.trim()) return;
    const maxOrder = instruments.reduce((m, i) => Math.max(m, i.display_order || 0), 0);
    await onAdd(newName.trim(), maxOrder + 1);
    setNewName('');
  };

  const handleSaveEdit = async (id) => {
    if (!editName.trim()) return;
    await onUpdate(id, { name: editName.trim() });
    setEditId(null);
  };

  const inputClass = 'px-3 py-2 rounded-lg bg-[var(--surface-input,var(--bg-secondary))] border border-[var(--border-card)] text-[var(--text-primary)] text-sm';

  return (
    <Card>
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">
        Instruments ({instruments.length})
      </h3>

      <div className="space-y-2">
        {instruments.map(inst => {
          const count = studentCountMap[inst.id] || 0;
          const isEditing = editId === inst.id;

          return (
            <div key={inst.id} className="flex items-center gap-2 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-card)]">
              {isEditing ? (
                <>
                  <input className={inputClass + ' flex-1'} value={editName} onChange={e => setEditName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveEdit(inst.id)} autoFocus />
                  <button onClick={() => handleSaveEdit(inst.id)} className="text-[var(--accent-green)] text-sm font-semibold">Save</button>
                  <button onClick={() => setEditId(null)} className="text-[var(--text-muted)] text-sm">Cancel</button>
                </>
              ) : (
                <>
                  <span className="flex-1 font-medium text-[var(--text-primary)]">{inst.name}</span>
                  <span className="text-xs text-[var(--text-muted)] px-2 py-1 rounded bg-[var(--bg-card)]">{count} students</span>
                  <button onClick={() => { setEditId(inst.id); setEditName(inst.name); }} className="text-[var(--accent-blue)] text-sm font-semibold min-h-[44px] px-2">Edit</button>
                  <button onClick={() => onDelete(inst.id)} disabled={count > 0} className="text-[var(--accent-red)] text-sm font-semibold min-h-[44px] px-2 disabled:opacity-30" title={count > 0 ? 'Remove students first' : 'Delete instrument'}>Delete</button>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex gap-2 mt-4">
        <input className={inputClass + ' flex-1'} value={newName} onChange={e => setNewName(e.target.value)} placeholder="New instrument name" onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <Button onClick={handleAdd} disabled={!newName.trim()}>Add</Button>
      </div>
    </Card>
  );
}
