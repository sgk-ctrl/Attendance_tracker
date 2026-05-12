import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useAdminBands } from '../hooks/useAdminBands';
import Header from '../components/layout/Header';
import Spinner from '../components/layout/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

const PRESET_COLORS = ['#2b6cb0', '#e53e3e', '#38a169', '#d69e2e', '#805ad5', '#dd6b20'];

const TABS = [
  { id: 'bands', label: 'Bands' },
  { id: 'students', label: 'Students' },
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const { bands, loading, createBand, parseCSV, importStudents } = useAdminBands();

  const [activeTab, setActiveTab] = useState('bands');

  // Band creation
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [bandForm, setBandForm] = useState({ name: '', short_name: '', color: '#2b6cb0' });
  const [saving, setSaving] = useState(false);

  // Student import
  const [selectedBandId, setSelectedBandId] = useState('');
  const [csvText, setCsvText] = useState('');
  const [parsedRows, setParsedRows] = useState(null);
  const [parseErrors, setParseErrors] = useState([]);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef(null);

  const handleCreateBand = async () => {
    if (!bandForm.name.trim()) { toast('Band name is required', 'error'); return; }
    setSaving(true);
    try {
      const band = await createBand(bandForm);
      toast(`Band "${band.name}" created`, 'success');
      setBandForm({ name: '', short_name: '', color: '#2b6cb0' });
      setShowCreateForm(false);
      // Pre-select new band in Students tab
      setSelectedBandId(String(band.id));
      setActiveTab('students');
    } catch (e) {
      toast('Failed to create band: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      setCsvText(text);
      const { rows, errors } = parseCSV(text);
      setParsedRows(rows);
      setParseErrors(errors);
    };
    reader.readAsText(file);
  };

  const handleParsePaste = () => {
    if (!csvText.trim()) { toast('Paste CSV text first', 'error'); return; }
    const { rows, errors } = parseCSV(csvText);
    setParsedRows(rows);
    setParseErrors(errors);
  };

  const handleImport = async () => {
    if (!selectedBandId) { toast('Select a band first', 'error'); return; }
    if (!parsedRows?.length) { toast('No rows to import', 'error'); return; }
    setImporting(true);
    try {
      const count = await importStudents(selectedBandId, parsedRows);
      toast(`Imported ${count} students`, 'success');
      setCsvText('');
      setParsedRows(null);
      setParseErrors([]);
      if (fileRef.current) fileRef.current.value = '';
    } catch (e) {
      toast('Import failed: ' + e.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <Header title="Admin Panel" subtitle="Band & Student Management" showBack onBack={() => navigate('/')} />
      <Spinner show={loading} text="Loading..." />

      <main className="p-5 max-w-[600px] mx-auto animate-fadeIn">
        {/* Tabs */}
        <div className="flex gap-1 bg-[var(--bg-secondary)] rounded-xl p-1 mb-5">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === t.id
                  ? 'bg-[var(--accent-blue)] text-white shadow-[var(--shadow-glow)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Bands Tab */}
        {activeTab === 'bands' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">All Bands</h3>
              <button
                className="bg-[var(--accent-blue)] text-white border-none rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                {showCreateForm ? 'Cancel' : '+ New Band'}
              </button>
            </div>

            {showCreateForm && (
              <Card>
                <h4 className="font-bold text-[var(--text-primary)] mb-3">Create Band</h4>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Band name (e.g. HNPS Senior Band) *"
                    value={bandForm.name}
                    onChange={e => setBandForm(p => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[var(--accent-blue-border)] rounded-lg text-sm bg-[var(--surface-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                  />
                  <input
                    type="text"
                    placeholder="Short name (e.g. Senior Band)"
                    value={bandForm.short_name}
                    onChange={e => setBandForm(p => ({ ...p, short_name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[var(--accent-blue-border)] rounded-lg text-sm bg-[var(--surface-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                  />
                  <div>
                    <div className="text-xs text-[var(--text-muted)] mb-1.5">Band colour</div>
                    <div className="flex gap-2 flex-wrap">
                      {PRESET_COLORS.map(c => (
                        <button
                          key={c}
                          onClick={() => setBandForm(p => ({ ...p, color: c }))}
                          style={{ backgroundColor: c }}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${bandForm.color === c ? 'border-white scale-110' : 'border-transparent'}`}
                          aria-label={c}
                        />
                      ))}
                      <input
                        type="color"
                        value={bandForm.color}
                        onChange={e => setBandForm(p => ({ ...p, color: e.target.value }))}
                        className="w-8 h-8 rounded-full cursor-pointer border-0 p-0 bg-transparent"
                        title="Custom colour"
                      />
                    </div>
                  </div>
                  <Button onClick={handleCreateBand} disabled={saving}>
                    {saving ? 'Creating...' : 'Create Band'}
                  </Button>
                </div>
              </Card>
            )}

            {!loading && bands.map(band => (
              <div
                key={band.id}
                className="bg-[var(--bg-card)] rounded-[16px] p-4 mb-3 border border-[var(--border-card)] flex items-center justify-between"
                style={{ borderLeft: `4px solid ${band.color || 'var(--accent-blue)'}` }}
              >
                <div>
                  <div className="font-bold text-[var(--text-primary)]">{band.name}</div>
                  {band.short_name && <div className="text-xs text-[var(--text-muted)]">{band.short_name}</div>}
                  <div className="text-xs text-[var(--text-muted)] mt-0.5">
                    {band.studentCount} student{band.studentCount !== 1 ? 's' : ''} · {band.active ? 'Active' : 'Inactive'}
                  </div>
                </div>
                <button
                  className="text-sm text-[var(--accent-blue-light)] font-semibold underline bg-transparent border-none cursor-pointer"
                  onClick={() => { setSelectedBandId(String(band.id)); setActiveTab('students'); }}
                >
                  Manage students
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div>
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-4">Import Students via CSV</h3>

            <Card>
              <div className="mb-3">
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Band</label>
                <select
                  value={selectedBandId}
                  onChange={e => setSelectedBandId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-[var(--accent-blue-border)] rounded-lg text-sm bg-[var(--surface-input)] text-[var(--text-primary)]"
                >
                  <option value="">Select band…</option>
                  {bands.map(b => (
                    <option key={b.id} value={String(b.id)}>
                      {b.name} ({b.studentCount} students)
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-xs text-[var(--text-muted)] mb-3 bg-[var(--bg-secondary)] rounded-lg p-3">
                <div className="font-semibold mb-1">CSV format</div>
                <code className="text-[var(--accent-blue-light)]">first_name,last_name,instrument,grade</code>
                <div className="mt-1">Header row is optional. Grade/year column is optional.</div>
                <div className="mt-1">Example: <code>Alice,Smith,Flute,Year 4</code></div>
              </div>

              <div className="mb-3">
                <label className="block text-xs font-semibold text-[var(--text-muted)] mb-1">Upload CSV file</label>
                <input
                  ref={fileRef}
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-[var(--text-secondary)] file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-[var(--accent-blue-bg-strong)] file:text-[var(--accent-blue-light)] hover:file:bg-[var(--accent-blue-bg)]"
                />
              </div>

              <div className="text-xs text-[var(--text-muted)] text-center my-2">— or paste CSV text below —</div>

              <textarea
                placeholder="Paste CSV here…"
                value={csvText}
                onChange={e => setCsvText(e.target.value)}
                rows={5}
                className="w-full px-3 py-2.5 border border-[var(--accent-blue-border)] rounded-lg text-sm bg-[var(--surface-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)] font-mono"
              />

              {csvText && !parsedRows && (
                <Button variant="secondary" className="mt-2" onClick={handleParsePaste}>
                  Preview Import
                </Button>
              )}
            </Card>

            {parseErrors.length > 0 && (
              <div className="bg-[var(--accent-orange-bg)] border border-[var(--accent-orange-border)] rounded-lg p-3 mb-3 text-sm">
                <div className="font-semibold text-[var(--accent-orange)] mb-1">Parse warnings</div>
                {parseErrors.map((e, i) => <div key={i} className="text-[var(--text-secondary)]">{e}</div>)}
              </div>
            )}

            {parsedRows && parsedRows.length > 0 && (
              <Card>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-bold text-[var(--text-primary)]">Preview — {parsedRows.length} students</h4>
                  <button
                    className="text-xs text-[var(--text-muted)] underline bg-transparent border-none cursor-pointer"
                    onClick={() => { setParsedRows(null); setParseErrors([]); }}
                  >
                    Clear
                  </button>
                </div>
                <div className="overflow-x-auto rounded-lg border border-[var(--border-card)] mb-4">
                  <table className="report-table w-full">
                    <thead>
                      <tr>
                        <th>First name</th>
                        <th>Last name</th>
                        <th>Instrument</th>
                        <th>Grade</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsedRows.slice(0, 10).map((r, i) => (
                        <tr key={i}>
                          <td>{r.first_name}</td>
                          <td>{r.last_name}</td>
                          <td>{r.instrument}</td>
                          <td>{r.grade || '—'}</td>
                        </tr>
                      ))}
                      {parsedRows.length > 10 && (
                        <tr>
                          <td colSpan={4} className="text-center text-[var(--text-muted)] text-xs py-2">
                            …and {parsedRows.length - 10} more
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <Button onClick={handleImport} disabled={importing || !selectedBandId}>
                  {importing ? 'Importing…' : `Import ${parsedRows.length} Students`}
                </Button>
                {!selectedBandId && (
                  <p className="text-xs text-[var(--accent-orange)] mt-2">Select a band above before importing.</p>
                )}
              </Card>
            )}

            {parsedRows && parsedRows.length === 0 && (
              <div className="text-center p-5 text-[var(--text-muted)] text-sm">
                No valid rows found in CSV. Check the format.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
