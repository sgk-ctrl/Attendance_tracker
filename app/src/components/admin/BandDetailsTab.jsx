import { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export default function BandDetailsTab({ band, onSave, saving }) {
  const [name, setName] = useState('');
  const [shortName, setShortName] = useState('');
  const [color, setColor] = useState('#2b6cb0');
  const [practiceDay, setPracticeDay] = useState('');
  const [practiceTime, setPracticeTime] = useState('');

  useEffect(() => {
    if (band) {
      setName(band.name || '');
      setShortName(band.short_name || '');
      setColor(band.color || '#2b6cb0');
      setPracticeDay(band.practice_day || '');
      setPracticeTime(band.practice_time || '');
    }
  }, [band]);

  const handleSave = () => {
    onSave({ name, short_name: shortName, color, practice_day: practiceDay || null, practice_time: practiceTime || null });
  };

  const inputClass = 'w-full px-4 py-3 rounded-lg bg-[var(--surface-input,var(--bg-secondary))] border border-[var(--border-card)] text-[var(--text-primary)] text-base';
  const labelClass = 'block text-sm font-semibold text-[var(--text-secondary)] mb-1';

  return (
    <Card>
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-4">Band Details</h3>

      <div className="space-y-4">
        <div>
          <label className={labelClass}>Band Name</label>
          <input className={inputClass} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Wind Ensemble" />
        </div>

        <div>
          <label className={labelClass}>Short Name</label>
          <input className={inputClass} value={shortName} onChange={e => setShortName(e.target.value)} placeholder="e.g. WE" />
        </div>

        <div>
          <label className={labelClass}>Theme Color</label>
          <div className="flex items-center gap-3">
            <input type="color" value={color} onChange={e => setColor(e.target.value)} className="w-12 h-12 rounded-lg cursor-pointer border-0" />
            <input className={inputClass + ' flex-1'} value={color} onChange={e => setColor(e.target.value)} placeholder="#2b6cb0" />
          </div>
        </div>

        <div>
          <label className={labelClass}>Practice Day</label>
          <select className={inputClass} value={practiceDay} onChange={e => setPracticeDay(e.target.value)}>
            <option value="">No default</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>

        <div>
          <label className={labelClass}>Practice Time</label>
          <input className={inputClass} value={practiceTime} onChange={e => setPracticeTime(e.target.value)} placeholder="e.g. 3:10 PM" />
        </div>
      </div>

      <Button onClick={handleSave} disabled={saving || !name.trim()} className="mt-6">
        {saving ? 'Saving...' : 'Save Changes'}
      </Button>
    </Card>
  );
}
