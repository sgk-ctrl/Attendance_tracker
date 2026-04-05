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
          <div className="text-center text-[var(--red-600)] p-3 mb-4 bg-[var(--red-100)] rounded-lg text-sm">
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
              className="bg-white rounded-xl p-5 shadow-[var(--shadow)] cursor-pointer active:scale-[0.98] transition-transform duration-200"
              style={{ borderLeft: `4px solid ${band.color || 'var(--blue-600)'}` }}
              onClick={() => navigate(`/band/${band.id}`)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-lg text-[var(--gray-900)]">{band.name}</div>
                  {band.short_name && (
                    <div className="text-xs text-[var(--gray-600)] mt-0.5">{band.short_name}</div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-[var(--blue-700)]">{band.studentCount}</div>
                  <div className="text-xs text-[var(--gray-600)]">students</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 text-center">
          <button
            className="text-sm text-[var(--blue-600)] font-semibold underline cursor-pointer bg-transparent border-none"
            onClick={() => navigate('/dashboard')}
          >
            View Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
