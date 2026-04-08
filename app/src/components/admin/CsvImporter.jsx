import { useState, useRef } from 'react';
import { useStudentImport } from '../../hooks/useStudentImport';
import Card from '../ui/Card';
import Button from '../ui/Button';

export default function CsvImporter({ bandId, instruments, onImportComplete }) {
  const { parseCSV, importStudents, importing, result } = useStudentImport(bandId);
  const [preview, setPreview] = useState(null);
  const [parseError, setParseError] = useState(null);
  const fileRef = useRef(null);

  const instNames = new Set((instruments || []).map(i => i.name.toLowerCase()));

  const handleFile = async (file) => {
    setParseError(null);
    setPreview(null);
    try {
      const rows = await parseCSV(file);
      setPreview(rows);
    } catch (e) {
      setParseError(e.message);
    }
  };

  const handleImport = async () => {
    if (!preview) return;
    try {
      await importStudents(preview, instruments);
      onImportComplete();
    } catch (e) {
      // result state handles error display
    }
  };

  const rowStatus = (row) => {
    if (!row.firstName || !row.lastName) return 'invalid';
    if (!row.instrument) return 'invalid';
    return instNames.has(row.instrument.toLowerCase()) ? 'existing' : 'new';
  };

  const statusColors = { existing: 'text-[var(--accent-green)]', new: 'text-[var(--accent-blue)]', invalid: 'text-[var(--accent-red)]' };
  const statusLabels = { existing: '✓', new: '+ New', invalid: '✗' };

  return (
    <Card>
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">Import Students from CSV</h3>
      <p className="text-sm text-[var(--text-muted)] mb-4">
        CSV should have columns: <strong>First Name</strong>, <strong>Last Name</strong>, <strong>Year</strong>, <strong>Instrument</strong>
      </p>

      {/* Upload area */}
      <div
        className="border-2 border-dashed border-[var(--border-card)] rounded-xl p-8 text-center cursor-pointer hover:border-[var(--accent-blue)] transition-colors"
        onClick={() => fileRef.current?.click()}
      >
        <div className="text-3xl mb-2">📁</div>
        <div className="text-sm text-[var(--text-secondary)]">Click to select a CSV file</div>
        <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </div>

      {parseError && (
        <div className="mt-3 p-3 rounded-lg bg-[var(--accent-red-bg)] border border-[var(--accent-red-border)] text-sm text-[var(--accent-red)]">{parseError}</div>
      )}

      {/* Preview */}
      {preview && !result && (
        <div className="mt-4">
          <div className="text-sm font-semibold text-[var(--text-secondary)] mb-2">Preview ({preview.length} students)</div>
          <div className="max-h-[300px] overflow-y-auto rounded-lg border border-[var(--border-card)]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[var(--bg-secondary)] text-[var(--text-muted)]">
                  <th className="p-2 text-left">Name</th>
                  <th className="p-2 text-left">Year</th>
                  <th className="p-2 text-left">Instrument</th>
                  <th className="p-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => {
                  const status = rowStatus(row);
                  return (
                    <tr key={i} className="border-t border-[var(--border-card)]">
                      <td className="p-2 text-[var(--text-primary)]">{row.firstName} {row.lastName}</td>
                      <td className="p-2 text-[var(--text-muted)]">{row.year || '-'}</td>
                      <td className="p-2 text-[var(--text-primary)]">{row.instrument || '-'}</td>
                      <td className={`p-2 text-center font-semibold ${statusColors[status]}`}>{statusLabels[status]}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Button onClick={handleImport} disabled={importing} className="mt-3">
            {importing ? 'Importing...' : `Import ${preview.length} Students`}
          </Button>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="mt-4 p-4 rounded-lg border border-[var(--border-card)] bg-[var(--bg-secondary)]">
          {result.error ? (
            <div className="text-[var(--accent-red)]">Error: {result.error}</div>
          ) : (
            <div className="space-y-1 text-sm">
              <div className="text-[var(--accent-green)] font-semibold">✓ {result.imported} students imported</div>
              {result.instrumentsCreated?.length > 0 && (
                <div className="text-[var(--accent-blue)]">+ Created instruments: {result.instrumentsCreated.join(', ')}</div>
              )}
              {result.skipped > 0 && (
                <div className="text-[var(--accent-orange)]">⚠ {result.skipped} rows skipped (missing instrument)</div>
              )}
            </div>
          )}
          <Button onClick={() => { setPreview(null); setParseError(null); if (fileRef.current) fileRef.current.value = ''; }} variant="secondary" className="mt-3">
            Import More
          </Button>
        </div>
      )}
    </Card>
  );
}
