import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { fetchAllRows } from '../lib/fetchAll';
import Header from '../components/layout/Header';
import Spinner from '../components/layout/Spinner';
import Card from '../components/ui/Card';
import PctBar from '../components/ui/PctBar';

export default function Dashboard() {
  const navigate = useNavigate();
  const [bands, setBands] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: bandsData } = await supabase
          .from('bands')
          .select('*')
          .eq('active', true)
          .order('name');

        if (!bandsData || bandsData.length === 0) {
          setBands([]);
          setLoading(false);
          return;
        }

        setBands(bandsData);

        const bandStats = {};
        for (const band of bandsData) {
          const { data: sessions } = await supabase
            .from('sessions')
            .select('id')
            .eq('band_id', band.id);

          const sessionCount = sessions?.length || 0;

          if (sessionCount === 0) {
            bandStats[band.id] = { sessionCount: 0, avgRate: 0 };
            continue;
          }

          const sessionIds = sessions.map(s => s.id);
          const { data: students } = await supabase
            .from('students')
            .select('id')
            .eq('band_id', band.id)
            .eq('active', true);

          const studentCount = students?.length || 0;

          // Paged — PostgREST truncates at 1000 rows silently, which would
          // quietly deflate this number from mid-term onwards.
          const attData = await fetchAllRows(() =>
            supabase.from('attendance').select('present').in('session_id', sessionIds).order('id'));

          // The denominator is the marks actually recorded, NOT
          // activeStudents x sessions. That cross-product mixed two
          // independently filtered sets: the numerator counted every present
          // row ever (including students since deactivated) while the
          // denominator counted only currently-active ones — so deactivating a
          // child pushed the rate ABOVE 100%. Every attendance row is one
          // student expected at one session, which is exactly "possible".
          const presentCount = attData.filter(a => a.present).length;
          const possible = attData.length;
          const avgRate = possible > 0
            ? Math.min(100, Math.max(0, Math.round(presentCount / possible * 100)))
            : 0;

          bandStats[band.id] = { sessionCount, avgRate, studentCount };
        }

        setStats(bandStats);
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div>
      <Header
        title="Dashboard"
        subtitle="Attendance Overview"
        showBack
        onBack={() => navigate('/')}
      />
      <Spinner show={loading} text="Loading dashboard..." />

      <main className="p-5 max-w-[600px] mx-auto animate-fadeIn">
        {bands.map(band => {
          const s = stats[band.id] || {};
          return (
            <Card key={band.id}>
              <div
                className="cursor-pointer"
                onClick={() => navigate(`/band/${band.id}`)}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-base font-bold" style={{ color: band.color || 'var(--text-primary)' }}>
                    {band.name}
                  </h3>
                  {band.short_name && (
                    <span className="text-xs text-[var(--text-muted)]">{band.short_name}</span>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold text-[var(--accent-blue-light)]">{s.sessionCount || 0}</div>
                    <div className="text-xs text-[var(--text-muted)]">Sessions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-[var(--accent-blue-light)]">{s.studentCount || 0}</div>
                    <div className="text-xs text-[var(--text-muted)]">Students</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">
                      <PctBar pct={s.avgRate || 0} />
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">Avg Rate</div>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </main>
    </div>
  );
}
