import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBands } from '../hooks/useBands';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import Header from '../components/layout/Header';
import Spinner from '../components/layout/Spinner';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';

export default function BandSelector() {
  const { bands, loading, error } = useBands();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newShort, setNewShort] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    supabase.from('allowed_users').select('role').eq('email', user.email).maybeSingle()
      .then(({ data }) => setIsAdmin(data?.role === 'admin'));
  }, [user?.email]);

  const handleCreateBand = async () => {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const { error: err } = await supabase.from('bands').insert({ name: newName.trim(), short_name: newShort.trim() || null, active: true });
      if (err) throw err;
      toast('Band created! Set up instruments and students in Setup.', 'success');
      setNewName(''); setNewShort(''); setShowAddForm(false);
      window.location.reload();
    } catch (e) {
      toast(e.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const inputClass = 'w-full px-4 py-3 rounded-lg bg-[var(--surface-input,var(--bg-secondary))] border border-[var(--border-card)] text-[var(--text-primary)] text-base';

  return (
    <div>
      <Header title="HNPS Band" subtitle="Select your band" />
      <Spinner show={loading} text="Loading bands..." />

      <main className="p-5 max-w-[600px] mx-auto animate-fadeIn">
        {error && (
          <div className="text-center text-[var(--accent-red)] p-3 mb-4 bg-[var(--accent-red-bg)] border border-[var(--accent-red-border)] rounded-lg text-sm">
            {error}
          </div>
        )}

        {!loading && bands.length === 0 && (
          <EmptyState icon="🎵">
            No active bands found.<br />Please contact the administrator.
          </EmptyState>
        )}

        <div className="grid grid-cols-1 gap-3">
          {bands.map(band => (
            <div
              key={band.id}
              className="relative bg-[var(--bg-card)] rounded-[16px] p-5 shadow-[var(--shadow)] border border-[var(--border-card)] backdrop-blur-[10px] cursor-pointer active:scale-[0.98] transition-transform duration-200 hover:border-[var(--accent-blue-border)] hover:shadow-[var(--shadow-glow)]"
              style={{ borderLeft: `4px solid ${band.color || 'var(--accent-blue)'}` }}
              onClick={() => navigate(`/band/${band.id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg text-[var(--text-primary)]">{band.name}</div>
                  {band.short_name && (
                    <div className="text-xs text-[var(--text-muted)] mt-0.5">{band.short_name}</div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-2xl font-bold text-[var(--accent-blue-light)]">{band.studentCount}</div>
                    <div className="text-xs text-[var(--text-muted)]">students</div>
                  </div>
                  {isAdmin && (
                    <button
                      className="text-[var(--text-muted)] hover:text-[var(--accent-blue)] min-w-[44px] min-h-[44px] flex items-center justify-center"
                      onClick={(e) => { e.stopPropagation(); navigate(`/band/${band.id}/setup`); }}
                      title="Band Setup"
                    >⚙</button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Admin: Add Band */}
          {isAdmin && !showAddForm && (
            <div
              className="rounded-[16px] p-5 border-2 border-dashed border-[var(--border-card)] cursor-pointer text-center hover:border-[var(--accent-blue)] transition-colors"
              onClick={() => setShowAddForm(true)}
            >
              <div className="text-2xl mb-1">+</div>
              <div className="text-sm font-semibold text-[var(--text-muted)]">Add Band</div>
            </div>
          )}

          {isAdmin && showAddForm && (
            <div className="bg-[var(--bg-card)] rounded-[16px] p-5 border border-[var(--border-card)]">
              <div className="text-sm font-bold text-[var(--text-primary)] mb-3">Create New Band</div>
              <div className="space-y-2 mb-3">
                <input className={inputClass} value={newName} onChange={e => setNewName(e.target.value)} placeholder="Band name (e.g. Wind Ensemble)" />
                <input className={inputClass} value={newShort} onChange={e => setNewShort(e.target.value)} placeholder="Short name (e.g. WE)" />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleCreateBand} disabled={!newName.trim() || creating}>{creating ? 'Creating...' : 'Create'}</Button>
                <button onClick={() => setShowAddForm(false)} className="text-sm text-[var(--text-muted)] px-4 min-h-[44px]">Cancel</button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <button
            className="text-sm text-[var(--accent-blue-light)] font-semibold underline cursor-pointer bg-transparent border-none min-h-[44px] py-3"
            onClick={() => navigate('/dashboard')}
          >
            View Dashboard
          </button>
        </div>

        <div className="mt-4 text-center">
          <a href="privacy.html" target="_blank" className="text-sm text-[var(--text-muted)] underline min-h-[44px] py-3 inline-flex items-center">Privacy Policy</a>
        </div>
      </main>
    </div>
  );
}
