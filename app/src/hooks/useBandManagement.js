import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export function useBandManagement(bandId) {
  const [band, setBand] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    if (!bandId) return;
    setLoading(true);
    try {
      const [bandRes, instRes, studRes] = await Promise.all([
        supabase.from('bands').select('*').eq('id', bandId).single(),
        supabase.from('instruments').select('*').eq('band_id', bandId).order('display_order'),
        supabase.from('students').select('*').eq('band_id', bandId).order('last_name').order('first_name'),
      ]);
      if (bandRes.error) throw bandRes.error;
      setBand(bandRes.data);
      setInstruments(instRes.data || []);
      setStudents(studRes.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [bandId]);

  useEffect(() => { reload(); }, [reload]);

  const updateBand = useCallback(async (fields) => {
    const { error } = await supabase.from('bands').update(fields).eq('id', bandId);
    if (error) throw error;
    await reload();
  }, [bandId, reload]);

  const addInstrument = useCallback(async (name, displayOrder) => {
    const { error } = await supabase.from('instruments').insert({ name, display_order: displayOrder, band_id: bandId });
    if (error) throw error;
    await reload();
  }, [bandId, reload]);

  const updateInstrument = useCallback(async (id, fields) => {
    const { error } = await supabase.from('instruments').update(fields).eq('id', id);
    if (error) throw error;
    await reload();
  }, [reload]);

  const deleteInstrument = useCallback(async (id) => {
    const hasStudents = students.some(s => s.instrument_id === id);
    if (hasStudents) throw new Error('Cannot delete instrument with assigned students');
    const { error } = await supabase.from('instruments').delete().eq('id', id);
    if (error) throw error;
    await reload();
  }, [students, reload]);

  const addStudent = useCallback(async (firstName, lastName, instrumentId, grade) => {
    const { error } = await supabase.from('students').insert({
      first_name: firstName, last_name: lastName, instrument_id: instrumentId,
      grade, band_id: bandId, active: true,
    });
    if (error) throw error;
    await reload();
  }, [bandId, reload]);

  const updateStudent = useCallback(async (id, fields) => {
    const { error } = await supabase.from('students').update(fields).eq('id', id);
    if (error) throw error;
    await reload();
  }, [reload]);

  const toggleStudentActive = useCallback(async (id, active) => {
    const { error } = await supabase.from('students').update({ active }).eq('id', id);
    if (error) throw error;
    await reload();
  }, [reload]);

  return {
    band, instruments, students, loading, error, reload,
    updateBand, addInstrument, updateInstrument, deleteInstrument,
    addStudent, updateStudent, toggleStudentActive,
  };
}
