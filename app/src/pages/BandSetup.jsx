import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBandManagement } from '../hooks/useBandManagement';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import Header from '../components/layout/Header';
import TabBar from '../components/layout/TabBar';
import Spinner from '../components/layout/Spinner';
import EmptyState from '../components/ui/EmptyState';
import BandDetailsTab from '../components/admin/BandDetailsTab';
import InstrumentsTab from '../components/admin/InstrumentsTab';
import StudentsTab from '../components/admin/StudentsTab';
import CsvImporter from '../components/admin/CsvImporter';

const TABS = [
  { id: 'details', label: 'Details' },
  { id: 'instruments', label: 'Instruments' },
  { id: 'students', label: 'Students' },
  { id: 'import', label: 'Import' },
];

export default function BandSetup() {
  const { bandId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const mgmt = useBandManagement(bandId);
  const [activeTab, setActiveTab] = useState('details');
  const [saving, setSaving] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // Admin gate
  useEffect(() => {
    if (!user?.email) return;
    supabase.from('allowed_users').select('role').eq('email', user.email).maybeSingle()
      .then(({ data }) => {
        setIsAdmin(data?.role === 'admin');
        setAuthChecked(true);
        if (data?.role !== 'admin') navigate(`/band/${bandId}`);
      });
  }, [user?.email, bandId, navigate]);

  const wrap = async (fn, successMsg) => {
    try { await fn(); toast(successMsg, 'success'); }
    catch (e) { toast(e.message || 'Operation failed', 'error'); }
  };

  const handleSaveBand = async (fields) => {
    setSaving(true);
    await wrap(() => mgmt.updateBand(fields), 'Band details saved');
    setSaving(false);
  };

  if (!authChecked || mgmt.loading) return <div><Header title="Setup" showBack onBack={() => navigate(`/band/${bandId}`)} /><Spinner show text="Loading..." /></div>;
  if (!isAdmin) return null;
  if (mgmt.error) return <div><Header title="Setup" showBack onBack={() => navigate(`/band/${bandId}`)} /><EmptyState icon="⚠️">{mgmt.error}</EmptyState></div>;

  return (
    <div>
      <Header title={mgmt.band?.name || 'Band Setup'} subtitle="Setup" showBack onBack={() => navigate(`/band/${bandId}`)} />
      <main className="p-5 max-w-[600px] mx-auto">
        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        <div className="mt-4">
          {activeTab === 'details' && (
            <BandDetailsTab band={mgmt.band} onSave={handleSaveBand} saving={saving} />
          )}

          {activeTab === 'instruments' && (
            <InstrumentsTab
              instruments={mgmt.instruments}
              students={mgmt.students}
              onAdd={(name, order) => wrap(() => mgmt.addInstrument(name, order), `${name} added`)}
              onUpdate={(id, fields) => wrap(() => mgmt.updateInstrument(id, fields), 'Instrument updated')}
              onDelete={(id) => wrap(() => mgmt.deleteInstrument(id), 'Instrument deleted')}
            />
          )}

          {activeTab === 'students' && (
            <StudentsTab
              students={mgmt.students}
              instruments={mgmt.instruments}
              onAdd={(f, l, i, g) => wrap(() => mgmt.addStudent(f, l, i, g), 'Student added')}
              onUpdate={(id, fields) => wrap(() => mgmt.updateStudent(id, fields), 'Student updated')}
              onToggleActive={(id, active) => wrap(() => mgmt.toggleStudentActive(id, active), active ? 'Student activated' : 'Student deactivated')}
            />
          )}

          {activeTab === 'import' && (
            <CsvImporter bandId={bandId} instruments={mgmt.instruments} onImportComplete={() => { mgmt.reload(); toast('Import complete', 'success'); }} />
          )}
        </div>
      </main>
    </div>
  );
}
