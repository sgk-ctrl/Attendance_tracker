import { useState, useCallback, useEffect, useRef } from 'react';
import { saveAttendance } from '../lib/attendance';
import { getPendingAttendanceKeys } from '../lib/utils';

export function useOfflineSync() {
  const [pendingKeys, setPendingKeys] = useState([]);
  const [syncing, setSyncing] = useState(false);
  // Holds the latest retrySync so the online/visibility listeners (registered
  // once, before retrySync is defined) never call a stale closure.
  const retrySyncRef = useRef(null);
  const syncingRef = useRef(false);

  const checkPending = useCallback(() => {
    const keys = getPendingAttendanceKeys();
    setPendingKeys(keys);
    return keys;
  }, []);

  useEffect(() => {
    checkPending();
  }, [checkPending]);

  // Retry automatically when the network comes back or the volunteer returns to
  // the tab. The RUNBOOK and the pending banner both told volunteers this
  // already happened; nothing actually listened, so a pending roll call sat
  // there until someone found the manual retry button.
  useEffect(() => {
    const onOnline = () => { retrySyncRef.current?.(); };
    const onVisible = () => { if (!document.hidden) retrySyncRef.current?.(); };
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

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
    // Auto-triggers (online, visibilitychange) can overlap a manual retry;
    // without this guard two passes race on the same pending keys.
    if (syncingRef.current) return false;

    const keys = getPendingAttendanceKeys();
    if (keys.length === 0) {
      setPendingKeys([]);
      return true;
    }

    syncingRef.current = true;
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

          // Same write path as a live submit (lib/attendance.js). This used to
          // be a divergent copy that omitted session_time, creating sessions
          // the app could never find and silently duplicating rehearsals.
          await saveAttendance({
            bandId: data.bandId,
            dateStr: data.date,
            sessionTime: data.sessionTime || '',
            sessionType: data.sessionType,
            term: data.term,
            year: data.year,
            recordedBy: data.recordedBy || '',
            records: data.payload,
          });

          localStorage.removeItem(key);
        } catch (e) {
          console.error('Sync failed for', key, e);
          allSynced = false;
        }
      }
    } finally {
      syncingRef.current = false;
      setSyncing(false);
      checkPending();
    }

    return allSynced;
  }, [checkPending]);

  retrySyncRef.current = retrySync;

  return { pendingKeys, syncing, checkPending, getPendingInfo, retrySync };
}
