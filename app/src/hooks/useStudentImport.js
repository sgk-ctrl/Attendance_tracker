import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import { supabase } from '../lib/supabase';

function normalizeHeader(h) {
  return h.toLowerCase().replace(/[_\s]+/g, '').trim();
}

function mapHeaders(headers) {
  const map = {};
  headers.forEach((h, i) => {
    const n = normalizeHeader(h);
    if (['firstname', 'first'].includes(n)) map.firstName = i;
    else if (['lastname', 'last', 'surname'].includes(n)) map.lastName = i;
    else if (['year', 'grade', 'class'].includes(n)) map.year = i;
    else if (['instrument', 'section'].includes(n)) map.instrument = i;
  });
  return map;
}

export function useStudentImport(bandId) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);

  const parseCSV = useCallback((file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: false,
        skipEmptyLines: true,
        complete: (results) => {
          if (!results.data || results.data.length < 2) {
            reject(new Error('CSV must have a header row and at least one data row'));
            return;
          }
          const headers = results.data[0];
          const map = mapHeaders(headers);
          if (map.firstName === undefined || map.lastName === undefined) {
            reject(new Error('CSV must have first name and last name columns'));
            return;
          }
          const rows = results.data.slice(1).map(row => ({
            firstName: (row[map.firstName] || '').trim(),
            lastName: (row[map.lastName] || '').trim(),
            year: map.year !== undefined ? (row[map.year] || '').trim() : '',
            instrument: map.instrument !== undefined ? (row[map.instrument] || '').trim() : '',
          })).filter(r => r.firstName && r.lastName);
          resolve(rows);
        },
        error: (err) => reject(err),
      });
    });
  }, []);

  const importStudents = useCallback(async (rows, existingInstruments) => {
    setImporting(true);
    setResult(null);
    try {
      const instrumentMap = {};
      existingInstruments.forEach(i => { instrumentMap[i.name.toLowerCase()] = i.id; });
      const created = [];
      let maxOrder = existingInstruments.reduce((m, i) => Math.max(m, i.display_order || 0), 0);

      // Create missing instruments
      const uniqueInstruments = [...new Set(rows.map(r => r.instrument).filter(Boolean))];
      for (const name of uniqueInstruments) {
        if (!instrumentMap[name.toLowerCase()]) {
          maxOrder++;
          const { data, error } = await supabase.from('instruments')
            .insert({ name, display_order: maxOrder, band_id: bandId })
            .select().single();
          if (error) throw error;
          instrumentMap[name.toLowerCase()] = data.id;
          created.push(name);
        }
      }

      // Insert students
      const records = rows.filter(r => r.instrument && instrumentMap[r.instrument.toLowerCase()]).map(r => ({
        first_name: r.firstName, last_name: r.lastName,
        instrument_id: instrumentMap[r.instrument.toLowerCase()],
        grade: r.year || null, band_id: bandId, active: true,
      }));
      const skipped = rows.filter(r => !r.instrument || !instrumentMap[r.instrument.toLowerCase()]);

      if (records.length > 0) {
        const { error } = await supabase.from('students').insert(records);
        if (error) throw error;
      }

      const res = { imported: records.length, instrumentsCreated: created, skipped: skipped.length };
      setResult(res);
      return res;
    } catch (e) {
      setResult({ error: e.message });
      throw e;
    } finally {
      setImporting(false);
    }
  }, [bandId]);

  return { parseCSV, importStudents, importing, result };
}
