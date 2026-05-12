import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { MONTHS_SHORT } from '../lib/constants';
import Header from '../components/layout/Header';
import Spinner from '../components/layout/Spinner';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

function formatSessionDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export default function AdminSessions() {
  const { bandId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bandName, setBandName] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [deleting, setDeleting] = useState(false);

  // Guard: redirect non-admins
  useEffect(() => {
    if (!user?.email) return;
    supabase.from('allowed_users').select('role').eq('email', user.email).maybeSingle()
      .then(({ data }) => {
        if (data?.role !== 'admin') navigate(`/band/${bandId}`);
      });
  }, [user?.email, bandId, navigate]);

  const loadSessions = useCallback(async () => {
    setLoading(true);
    try {
      const [bandRes, sessRes] = await Promise.all([
        supabase.from('bands').select('name').eq('id', bandId).single(),
        supabase.from('sessions').select('*').eq('band_id', bandId).order('session_date', { ascending: false }),
      ]);
      if (bandRes.error) throw bandRes.error;
      if (sessRes.error) throw sessRes.error;

      setBandName(bandRes.data?.name || '');
      const sessData = sessRes.data || [];

      if (sessData.length === 0) { setSessions([]); setLoading(false); return; }

      // Fetch present counts per session
      const ids = sessData.map(s => s.id);
      const { data: attData } = await supabase
        .from('attendance')
        .select('session_id, present')
        .in('session_id', ids)
        .eq('present', true);

      const counts = {};
      (attData || []).forEach(a => { counts[a.session_id] = (counts[a.session_id] || 0) + 1; });

      setSessions(sessData.map(s => ({ ...s, presentCount: counts[s.id] || 0 })));
    } catch (e) {
      toast('Failed to load sessions: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [bandId, toast]);

  useEffect(() => { loadSessions(); }, [loadSessions]);

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === sessions.length) setSelected(new Set());
    else setSelected(new Set(sessions.map(s => s.id)));
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} session${selected.size > 1 ? 's' : ''}? This cannot be undone.`)) return;
    setDeleting(true);
    try {
      const ids = [...selected];
      await supabase.from('attendance').delete().in('session_id', ids);
      await supabase.from('sessions').delete().in('id', ids);
      toast(`Deleted ${ids.length} session${ids.length > 1 ? 's' : ''}`, 'success');
      setSelected(new Set());
      await loadSessions();
    } catch (e) {
      toast('Delete failed: ' + e.message, 'error');
    } finally {
      setDeleting(false);
    }
  };

  const handleRerunWizard = (sess) => {
    navigate(`/band/${bandId}/attendance`, {
      state: {
        sessionDate: sess.session_date,
        sessionTime: sess.session_time,
        sessionType: sess.session_type,
        term: sess.term,
        year: sess.year,
        editMode: true,
      },
    });
  };

  return (
    <div>
      <Header
        title={bandName || 'Band'}
        subtitle="Manage Sessions"
        showBack
        onBack={() => navigate(`/band/${bandId}`)}
      />
      <Spinner show={loading} text="Loading sessions..." />

      <main className="p-5 max-w-[600px] mx-auto animate-fadeIn">
        {!loading && sessions.length === 0 && (
          <EmptyState icon="📋">No sessions recorded yet.</EmptyState>
        )}

        {sessions.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={toggleAll}
                className="text-sm text-[var(--accent-blue-light)] font-semibold underline bg-transparent border-none cursor-pointer"
              >
                {selected.size === sessions.length ? 'Deselect all' : 'Select all'}
              </button>
              {selected.size > 0 && (
                <button
                  onClick={handleDeleteSelected}
                  disabled={deleting}
                  className="py-2 px-4 rounded-xl text-sm font-semibold border border-[var(--accent-red)] text-[var(--accent-red)] bg-transparent hover:bg-[var(--accent-red-bg)] transition-all disabled:opacity-50 min-h-[44px]"
                >
                  {deleting ? 'Deleting…' : `Delete ${selected.size} selected`}
                </button>
              )}
            </div>

            <div className="space-y-2">
              {sessions.map(sess => (
                <div
                  key={sess.id}
                  className={`bg-[var(--bg-card)] rounded-[14px] p-4 border transition-all ${
                    selected.has(sess.id)
                      ? 'border-[var(--accent-blue)] shadow-[var(--shadow-glow)]'
                      : 'border-[var(--border-card)]'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={selected.has(sess.id)}
                      onChange={() => toggleSelect(sess.id)}
                      className="mt-1 w-4 h-4 accent-[var(--accent-blue)] cursor-pointer flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-[var(--text-primary)] text-sm">
                        {formatSessionDate(sess.session_date)}
                      </div>
                      <div className="text-xs text-[var(--text-muted)] mt-0.5">
                        {sess.session_time || sess.session_type}
                        {sess.term ? ` · Term ${sess.term}` : ''}
                        {sess.year ? `, ${sess.year}` : ''}
                        {' · '}
                        <span className="text-[var(--accent-blue-light)] font-semibold">{sess.presentCount} present</span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => navigate(`/band/${bandId}/sessions/${sess.id}/edit`)}
                          className="text-xs text-[var(--accent-blue-light)] font-semibold underline bg-transparent border-none cursor-pointer py-1 min-h-[36px]"
                        >
                          Direct edit
                        </button>
                        <span className="text-xs text-[var(--text-muted)] py-1">·</span>
                        <button
                          onClick={() => handleRerunWizard(sess)}
                          className="text-xs text-[var(--accent-blue-light)] font-semibold underline bg-transparent border-none cursor-pointer py-1 min-h-[36px]"
                        >
                          Re-run wizard
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
