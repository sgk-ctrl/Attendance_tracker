import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import { MONTHS_SHORT } from '../lib/constants';
import Header from '../components/layout/Header';
import Spinner from '../components/layout/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StudentRow from '../components/attendance/StudentRow';

function formatSessionDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

export default function SessionEdit() {
  const { bandId, sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();

  const [session, setSession] = useState(null);
  const [instruments, setInstruments] = useState([]);
  const [studentsByInst, setStudentsByInst] = useState({});
  // presentMap: { attendanceId -> present }
  const [presentMap, setPresentMap] = useState({});
  // studentAttMap: { studentId -> attendanceId } for existing records
  const [studentAttMap, setStudentAttMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Guard: redirect non-admins
  useEffect(() => {
    if (!user?.email) return;
    supabase.from('allowed_users').select('role').eq('email', user.email).maybeSingle()
      .then(({ data }) => {
        if (data?.role !== 'admin') navigate(`/band/${bandId}`);
      });
  }, [user?.email, bandId, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [sessRes, instRes, studRes, attRes] = await Promise.all([
        supabase.from('sessions').select('*').eq('id', sessionId).single(),
        supabase.from('instruments').select('*').eq('band_id', bandId).order('display_order'),
        supabase.from('students').select('*').eq('active', true).eq('band_id', bandId).order('last_name').order('first_name'),
        supabase.from('attendance').select('*').eq('session_id', sessionId),
      ]);
      if (sessRes.error) throw sessRes.error;
      if (instRes.error) throw instRes.error;
      if (studRes.error) throw studRes.error;
      if (attRes.error) throw attRes.error;

      setSession(sessRes.data);
      setInstruments(instRes.data || []);

      const attData = attRes.data || [];
      const studData = studRes.data || [];

      // Map studentId -> attendance record
      const attByStudent = {};
      attData.forEach(a => { attByStudent[a.student_id] = a; });

      // Group students by instrument
      const grouped = {};
      (instRes.data || []).forEach(inst => {
        const studs = studData.filter(s => s.instrument_id === inst.id);
        if (studs.length > 0) grouped[inst.id] = studs;
      });
      setStudentsByInst(grouped);

      // Build present state — default to false if no record
      const pm = {};
      const sam = {};
      studData.forEach(s => {
        const att = attByStudent[s.id];
        if (att) {
          pm[att.id] = att.present;
          sam[s.id] = att.id;
        }
        // Students with no attendance record will be inserted on save
      });
      setPresentMap(pm);
      setStudentAttMap(sam);
    } catch (e) {
      toast('Failed to load session: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [sessionId, bandId, toast]);

  useEffect(() => { load(); }, [load]);

  const getPresent = (student) => {
    const attId = studentAttMap[student.id];
    return attId != null ? (presentMap[attId] ?? false) : false;
  };

  const toggleStudent = (student) => {
    const attId = studentAttMap[student.id];
    if (attId != null) {
      setPresentMap(prev => ({ ...prev, [attId]: !prev[attId] }));
    } else {
      // Mark as a new pending toggle (no DB record yet)
      const tempKey = `new_${student.id}`;
      setPresentMap(prev => ({ ...prev, [tempKey]: !prev[tempKey] }));
      setStudentAttMap(prev => ({ ...prev, [student.id]: tempKey }));
    }
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const allStudents = Object.values(studentsByInst).flat();
      const updates = [];
      const inserts = [];

      allStudents.forEach(s => {
        const attId = studentAttMap[s.id];
        const present = attId != null ? (presentMap[attId] ?? false) : false;
        if (attId && !String(attId).startsWith('new_')) {
          updates.push({ id: attId, present });
        } else {
          inserts.push({ session_id: parseInt(sessionId), student_id: s.id, present });
        }
      });

      await Promise.all([
        ...updates.map(u => supabase.from('attendance').update({ present: u.present }).eq('id', u.id)),
        inserts.length > 0
          ? supabase.from('attendance').insert(inserts)
          : Promise.resolve(),
      ]);

      toast('Attendance saved', 'success');
      setDirty(false);
      await load();
    } catch (e) {
      toast('Save failed: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (dirty && !window.confirm('You have unsaved changes. Leave anyway?')) return;
    navigate(`/band/${bandId}/admin/sessions`);
  };

  const totalPresent = Object.values(studentsByInst).flat().filter(s => getPresent(s)).length;
  const totalStudents = Object.values(studentsByInst).flat().length;

  return (
    <div>
      <Header
        title={session ? formatSessionDate(session.session_date) : 'Edit Session'}
        subtitle={session ? `${session.session_time || ''} · Term ${session.term || '?'} ${session.year || ''}` : 'Loading…'}
        showBack
        onBack={handleBack}
      />
      <Spinner show={loading} text="Loading session…" />

      <main className="p-5 max-w-[600px] mx-auto animate-fadeIn">
        {!loading && (
          <>
            {/* Present count banner */}
            <div className="bg-[var(--accent-blue-bg)] border border-[var(--accent-blue-border)] rounded-xl p-4 mb-4 text-center">
              <span className="text-2xl font-bold text-[var(--accent-blue-light)]">{totalPresent}</span>
              <span className="text-[var(--text-muted)] text-sm"> / {totalStudents} present</span>
            </div>

            {instruments.map(inst => {
              const studs = studentsByInst[inst.id];
              if (!studs?.length) return null;
              return (
                <Card key={inst.id} className="mb-3">
                  <div className="font-bold text-[var(--text-secondary)] text-sm mb-2">
                    {inst.name} · {studs.filter(s => getPresent(s)).length}/{studs.length}
                  </div>
                  <div className="space-y-1">
                    {studs.map(s => (
                      <StudentRow
                        key={s.id}
                        student={s}
                        checked={getPresent(s)}
                        onToggle={() => toggleStudent(s)}
                      />
                    ))}
                  </div>
                </Card>
              );
            })}

            <Button onClick={handleSave} disabled={saving} className="mt-2">
              {saving ? 'Saving…' : 'Save Changes'}
            </Button>
          </>
        )}
      </main>
    </div>
  );
}
