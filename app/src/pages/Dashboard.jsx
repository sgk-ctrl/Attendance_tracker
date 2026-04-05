import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
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

          const { data: attData } = await supabase
            .from('attendance')
            .select('present')
            .in('session_id', sessionIds);

          const presentCount = (attData || []).filter(a => a.present).length;
          const possible = studentCount * sessionCount;
          const avgRate = possible > 0 ? Math.round(presentCount / possible * 100) : 0;

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
