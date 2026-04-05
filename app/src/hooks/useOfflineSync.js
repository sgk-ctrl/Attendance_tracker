import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getPendingAttendanceKeys } from '../lib/utils';

export function useOfflineSync() {
  const [pendingKeys, setPendingKeys] = useState([]);
  const [syncing, setSyncing] = useState(false);

  const checkPending = useCallback(() => {
    const keys = getPendingAttendanceKeys();
    setPendingKeys(keys);
    return keys;
  }, []);

  useEffect(() => {
    checkPending();
  }, [checkPending]);

  const getPendingInfo = useCallback(() => {
    if (pendingKeys.length === 0) return null;
    try {
      const data = JSON.parse(localStorage.getItem(pendingKeys[0]));
      return data;
    } catch {
      return null;
    }
  }, [pendingKeys]);

  const retrySync = useCallback(async () => {
    const keys = getPendingAttendanceKeys();
    if (keys.length === 0) {
      setPendingKeys([]);
      return true;
    }

    setSyncing(true);
    let allSynced = true;

    try {
      for (const key of keys) {
        try {
          const data = JSON.parse(localStorage.getItem(key));
          if (!data || !data.payload) {
            localStorage.removeItem(key);
            continue;
          }

          let session;
          const { data: existing, error: findErr } = await supabase
            .from('sessions')
            .select('*')
            .eq('session_date', data.date)
            .eq('session_type', data.sessionType)
            .maybeSingle();
          if (findErr) throw findErr;

          if (existing) {
            session = existing;
          } else {
            const { data: created, error: createErr } = await supabase
              .from('sessions')
              .insert({
                session_date: data.date,
                session_type: data.sessionType,
                term: data.term,
                year: data.year,
              })
              .select()
              .single();
            if (createErr) throw createErr;
            session = created;
          }

          const records = data.payload.map(r => ({ ...r, session_id: session.id }));
          // Check existing, update or insert
          const { data: existing } = await supabase
            .from('attendance')
            .select('student_id')
            .eq('session_id', session.id);
          const existingIds = new Set((existing || []).map(e => e.student_id));
          const toInsert = records.filter(r => !existingIds.has(r.student_id));
          for (const rec of records.filter(r => existingIds.has(r.student_id))) {
            await supabase.from('attendance').update({ present: rec.present })
              .eq('session_id', rec.session_id).eq('student_id', rec.student_id);
          }
          if (toInsert.length > 0) {
            const { error } = await supabase.from('attendance').insert(toInsert);
            if (error) throw error;
          }

          localStorage.removeItem(key);
        } catch (e) {
          console.error('Sync failed for', key, e);
          allSynced = false;
        }
      }
    } finally {
      setSyncing(false);
      checkPending();
    }

    return allSynced;
  }, [checkPending]);

  return { pendingKeys, syncing, checkPending, getPendingInfo, retrySync };
}
