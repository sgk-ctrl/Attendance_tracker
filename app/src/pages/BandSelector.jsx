import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useBands } from '../hooks/useBands';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import Header from '../components/layout/Header';
import Spinner from '../components/layout/Spinner';
import EmptyState from '../components/ui/EmptyState';

export default function BandSelector() {
  const { bands, loading, error } = useBands();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    if (!user?.email) return;
    supabase.from('allowed_users').select('role').eq('email', user.email).maybeSingle()
      .then(({ data }) => setIsAdmin(data?.role === 'admin'));
  }, [user?.email]);

  return (
    <div>
      <Header title="Bandroll" subtitle="Select your band" />
      <Spinner show={loading} text="Loading bands..." />

      <main className="p-5 max-w-[600px] mx-auto animate-fadeIn">
        {error && (
          <div
            className="text-center p-3 mb-4 rounded-[14px] text-sm"
            style={{
              color: 'var(--accent-red)',
              background: 'var(--accent-red-bg)',
              border: '1px solid var(--accent-red-border)',
            }}
          >
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
            <button
              key={band.id}
              type="button"
              className="w-full text-left rounded-[20px] p-5 cursor-pointer active:scale-[0.98] transition-transform duration-200 focus:outline-none min-h-[44px] relative overflow-hidden"
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border-card)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
                borderLeft: `4px solid ${band.color || '#4f46e5'}`,
              }}
              onClick={() => navigate(`/band/${band.id}`)}
              aria-label={`${band.name}, ${band.studentCount} students`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div
                    className="font-extrabold text-lg"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)', letterSpacing: '-0.2px' }}
                  >
                    {band.name}
                  </div>
                  {band.short_name && (
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{band.short_name}</div>
                  )}
                </div>
                <div className="text-right">
                  <div
                    className="text-2xl font-extrabold"
                    style={{ fontFamily: 'var(--font-display)', color: 'var(--accent-orange-light, #fbbf24)', lineHeight: 1 }}
                  >
                    {band.studentCount}
                  </div>
                  <div className="text-xs" style={{ color: 'var(--text-muted)' }}>students</div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            className="text-sm font-semibold underline cursor-pointer bg-transparent border-none min-h-[44px] py-3"
            style={{ color: 'var(--accent-blue-light)', fontFamily: 'var(--font-display)' }}
            onClick={() => navigate('/dashboard')}
          >
            View Dashboard
          </button>
        </div>

        {isAdmin && (
          <div className="mt-2 text-center">
            <button
              className="text-sm font-semibold underline cursor-pointer bg-transparent border-none min-h-[44px] py-3"
              style={{ color: 'var(--accent-blue-light)', fontFamily: 'var(--font-display)' }}
              onClick={() => navigate('/admin')}
            >
              Admin Panel
            </button>
          </div>
        )}

        <div className="mt-4 text-center">
          <a
            href="privacy.html"
            target="_blank"
            className="text-sm underline min-h-[44px] py-3 inline-flex items-center"
            style={{ color: 'var(--text-muted)' }}
          >
            Privacy Policy
          </a>
        </div>
      </main>
    </div>
  );
}
