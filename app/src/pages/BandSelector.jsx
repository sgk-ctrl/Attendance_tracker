import { useNavigate } from 'react-router-dom';
import { useBands } from '../hooks/useBands';
import Header from '../components/layout/Header';
import Spinner from '../components/layout/Spinner';
import EmptyState from '../components/ui/EmptyState';

export default function BandSelector() {
  const { bands, loading, error } = useBands();
  const navigate = useNavigate();

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
              className="bg-[var(--bg-card)] rounded-[16px] p-5 shadow-[var(--shadow)] border border-[var(--border-card)] backdrop-blur-[10px] cursor-pointer active:scale-[0.98] transition-transform duration-200 hover:border-[var(--accent-blue-border)] hover:shadow-[var(--shadow-glow)]"
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
                <div className="text-right">
                  <div className="text-2xl font-bold text-[var(--accent-blue-light)]">{band.studentCount}</div>
                  <div className="text-xs text-[var(--text-muted)]">students</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            className="text-sm text-[var(--accent-blue-light)] font-semibold underline cursor-pointer bg-transparent border-none"
            onClick={() => navigate('/dashboard')}
          >
            View Dashboard
          </button>
        </div>

        <div className="mt-4 text-center">
          <a href="privacy.html" target="_blank" className="text-sm text-[var(--text-muted)] underline">Privacy Policy</a>
        </div>
      </main>
    </div>
  );
}
