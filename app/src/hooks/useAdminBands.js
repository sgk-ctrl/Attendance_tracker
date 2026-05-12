import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useAdminBands() {
  const [bands, setBands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadBands = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [bandRes, studentRes] = await Promise.all([
        supabase.from('bands').select('*').order('name'),
        supabase.from('students').select('id, band_id').eq('active', true),
      ]);
      if (bandRes.error) throw bandRes.error;
      const counts = {};
      (studentRes.data || []).forEach(s => { counts[s.band_id] = (counts[s.band_id] || 0) + 1; });
      setBands((bandRes.data || []).map(b => ({ ...b, studentCount: counts[b.id] || 0 })));
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadBands(); }, [loadBands]);

  const createBand = async ({ name, short_name, color }) => {
    const { data, error } = await supabase
      .from('bands')
      .insert({ name: name.trim(), short_name: short_name?.trim() || null, color: color || '#2b6cb0', active: true })
      .select()
      .single();
    if (error) throw error;
    await loadBands();
    return data;
  };

  // Parse CSV text into row objects. Supports header row or positional columns.
  // Expected: first_name, last_name, instrument, grade (in any order if header present)
  const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
    if (lines.length === 0) return { rows: [], errors: ['Empty file'] };

    const splitLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') { inQuotes = !inQuotes; }
        else if (ch === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
        else { current += ch; }
      }
      result.push(current.trim());
      return result;
    };

    const firstCells = splitLine(lines[0]);
    const lc = firstCells.map(c => c.toLowerCase().replace(/[^a-z_]/g, ''));
    const knownHeaders = ['first_name', 'last_name', 'firstname', 'lastname', 'instrument', 'grade', 'year', 'class'];
    const hasHeader = lc.some(c => knownHeaders.includes(c));

    let colMap = { first_name: 0, last_name: 1, instrument: 2, grade: 3 };
    let startIdx = 0;

    if (hasHeader) {
      startIdx = 1;
      colMap = {};
      lc.forEach((h, i) => {
        if (h === 'first_name' || h === 'firstname') colMap.first_name = i;
        else if (h === 'last_name' || h === 'lastname') colMap.last_name = i;
        else if (h === 'instrument') colMap.instrument = i;
        else if (h === 'grade' || h === 'year' || h === 'class') colMap.grade = i;
      });
    }

    const rows = [];
    const errors = [];
    for (let i = startIdx; i < lines.length; i++) {
      const cells = splitLine(lines[i]);
      const row = {
        first_name: cells[colMap.first_name ?? 0]?.replace(/^"|"$/g, '') || '',
        last_name: cells[colMap.last_name ?? 1]?.replace(/^"|"$/g, '') || '',
        instrument: cells[colMap.instrument ?? 2]?.replace(/^"|"$/g, '') || '',
        grade: cells[colMap.grade ?? 3]?.replace(/^"|"$/g, '') || '',
      };
      if (!row.first_name && !row.last_name) continue;
      if (!row.first_name || !row.last_name) { errors.push(`Row ${i + 1}: missing first or last name`); continue; }
      if (!row.instrument) { errors.push(`Row ${i + 1}: missing instrument for ${row.first_name} ${row.last_name}`); continue; }
      rows.push(row);
    }
    return { rows, errors };
  };

  const importStudents = async (bandId, parsedRows) => {
    if (!parsedRows.length) throw new Error('No rows to import');

    // Fetch existing instruments for this band
    const { data: existingInsts, error: instErr } = await supabase
      .from('instruments')
      .select('*')
      .eq('band_id', bandId);
    if (instErr) throw instErr;

    const instByName = {};
    (existingInsts || []).forEach(i => { instByName[i.name.toLowerCase()] = i; });

    // Determine which instruments need to be created
    const uniqueInstrumentNames = [...new Set(parsedRows.map(r => r.instrument.trim()))];
    const toCreate = uniqueInstrumentNames.filter(n => !instByName[n.toLowerCase()]);

    if (toCreate.length > 0) {
      const maxOrder = Math.max(0, ...(existingInsts || []).map(i => i.display_order || 0));
      const newInsts = toCreate.sort().map((name, idx) => ({
        name,
        band_id: parseInt(bandId),
        display_order: maxOrder + idx + 1,
      }));
      const { data: created, error: createErr } = await supabase
        .from('instruments')
        .insert(newInsts)
        .select();
      if (createErr) throw createErr;
      (created || []).forEach(i => { instByName[i.name.toLowerCase()] = i; });
    }

    // Build student insert rows
    const studentRows = parsedRows.map(r => ({
      first_name: r.first_name,
      last_name: r.last_name,
      instrument_id: instByName[r.instrument.toLowerCase().trim()]?.id,
      grade: r.grade || null,
      band_id: parseInt(bandId),
      active: true,
    }));

    const missing = studentRows.filter(r => !r.instrument_id);
    if (missing.length > 0) throw new Error(`Could not resolve instrument for: ${missing.map(r => r.first_name).join(', ')}`);

    const { error: insertErr } = await supabase.from('students').insert(studentRows);
    if (insertErr) throw insertErr;

    await loadBands();
    return studentRows.length;
  };

  return { bands, loading, error, createBand, parseCSV, importStudents, reload: loadBands };
}
