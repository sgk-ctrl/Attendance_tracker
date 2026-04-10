import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBandData } from '../hooks/useBandData';
import { useReports } from '../hooks/useReports';
import { useEvents } from '../hooks/useEvents';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { calcTerm, defaultTimeForDay, buildSessionTime, sessionTypeFromTime, dateToISO } from '../lib/utils';
import { supabase } from '../lib/supabase';
import Header from '../components/layout/Header';
import TabBar from '../components/layout/TabBar';
import Spinner from '../components/layout/Spinner';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import WarningBanner from '../components/ui/WarningBanner';
import DatePickerComp from '../components/attendance/DatePicker';
import TimePicker from '../components/attendance/TimePicker';
import TermBadgeEditor from '../components/attendance/TermBadge';
import ReportFilters from '../components/reports/ReportFilters';
import DetailedRegister from '../components/reports/DetailedRegister';
import ExportButtons from '../components/reports/ExportButtons';
import EventCard from '../components/events/EventCard';
import EmptyState from '../components/ui/EmptyState';

const TABS = [
  { id: 'attendance', label: 'Attendance' },
  { id: 'reports', label: 'Reports' },
  { id: 'events', label: 'Events' },
];

export default function BandHome() {
  const { bandId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const { band, loading: bandLoading } = useBandData(bandId);
  const { reportData, loading: reportLoading, error: reportError, loadReport } = useReports(bandId);
  const { events, loading: eventsLoading, createEvent } = useEvents(bandId);
  const { pendingKeys, syncing, retrySync, getPendingInfo } = useOfflineSync();

  const [activeTab, setActiveTab] = useState('attendance');
  const [sessionDate, setSessionDate] = useState(() => new Date());
  const [term, setTerm] = useState(() => calcTerm(new Date()));
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [existingSession, setExistingSession] = useState(null);
  const [checkingSession, setCheckingSession] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Check if user is admin
  useEffect(() => {
    if (!user?.email) return;
    supabase.from('allowed_users').select('role').eq('email', user.email).maybeSingle()
      .then(({ data }) => setIsAdmin(data?.role === 'admin'));
  }, [user?.email]);

  // Reset session (admin only)
  const handleResetSession = useCallback(async () => {
    if (!existingSession || !isAdmin) return;
    if (!window.confirm(`Delete attendance for this session? This cannot be undone.`)) return;
    setResetting(true);
    try {
      await supabase.from('attendance').delete().eq('session_id', existingSession.id);
      await supabase.from('sessions').delete().eq('id', existingSession.id);
      setExistingSession(null);
      toast('Session deleted', 'success');
    } catch (e) {
      toast('Failed to delete session: ' + (e.message || 'Unknown error'), 'error');
    } finally {
      setResetting(false);
    }
  }, [existingSession, isAdmin, toast]);

  // Session time memory — remembers the last-used time per band + day-of-week.
  // Volunteers with a fixed weekly schedule never need to re-select the time.
  const rememberedTimeKey = (band, day) => `hnps_last_time_${band}_${day}`;
  const getInitialTime = (band, date) => {
    const day = date.getDay();
    try {
      const saved = localStorage.getItem(rememberedTimeKey(band, day));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.hour && parsed.minute && parsed.ampm) return parsed;
      }
    } catch { /* ignore */ }
    const dt = defaultTimeForDay(day);
    return { hour: dt.hour, minute: dt.minute, ampm: dt.ampm };
  };

  const [timeState, setTimeState] = useState(() => getInitialTime(bandId, sessionDate));

  const sessionTime = buildSessionTime(timeState.hour, timeState.minute, timeState.ampm);
  const sessionType = sessionTypeFromTime(timeState.hour, timeState.ampm);

  // Report filters
  const [reportYear, setReportYear] = useState(2026);
  const [reportTerm, setReportTerm] = useState('');

  // Check existing session
  const checkExisting = useCallback(async () => {
    setCheckingSession(true);
    try {
      const dateStr = dateToISO(sessionDate);
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('session_date', dateStr)
        .eq('session_time', sessionTime)
        .eq('band_id', bandId)
        .maybeSingle();
      if (error) throw error;
      setExistingSession(data || null);
    } catch (e) {
      console.error('checkExisting error:', e);
    } finally {
      setCheckingSession(false);
    }
  }, [sessionDate, sessionTime, bandId]);

  useEffect(() => {
    checkExisting();
  }, [checkExisting]);

  // Handle date change — uses remembered time for the new day if one exists
  const handleDateChange = (d) => {
    setSessionDate(d);
    setTerm(calcTerm(d));
    setYear(d.getFullYear());
    setTimeState(getInitialTime(bandId, d));
  };

  // Handle time change — persists the selection so future sessions on the
  // same weekday default to this time for this band
  const handleTimeChange = ({ hour, minute, ampm }) => {
    setTimeState({ hour, minute, ampm });
    try {
      localStorage.setItem(
        rememberedTimeKey(bandId, sessionDate.getDay()),
        JSON.stringify({ hour, minute, ampm })
      );
    } catch { /* ignore */ }
  };

  // Tab change - auto-load reports
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'reports') {
      loadReport(reportYear, reportTerm);
    }
  };

  // Start attendance
  const handleStart = () => {
    navigate(`/band/${bandId}/attendance`, {
      state: { sessionDate: dateToISO(sessionDate), sessionTime, sessionType, term, year, editMode: false },
    });
  };

  // Edit existing
  const handleEdit = () => {
    navigate(`/band/${bandId}/attendance`, {
      state: { sessionDate: dateToISO(sessionDate), sessionTime, sessionType, term, year, editMode: true },
    });
  };

  // Retry pending sync
  const handleRetrySync = async () => {
    const result = await retrySync();
    if (result) {
      toast('Pending attendance synced!', 'success');
      checkExisting();
    } else {
      toast('Some records failed to sync. Will retry later.', 'error');
    }
  };

  // Add event
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [newEvent, setNewEvent] = useState({ name: '', event_type: '', event_date: '', event_time: '', venue: '', notes: '' });

  const handleCreateEvent = async () => {
    if (!newEvent.name || !newEvent.event_date) {
      toast('Please fill in event name and date.', 'error');
      return;
    }
    try {
      await createEvent(newEvent);
      toast('Event created!', 'success');
      setShowAddEvent(false);
      setNewEvent({ name: '', event_type: '', event_date: '', event_time: '', venue: '', notes: '' });
    } catch (e) {
      toast('Failed to create event: ' + e.message, 'error');
    }
  };

  const pendingInfo = getPendingInfo();

  return (
    <div>
      <Header
        title={band?.name || 'Loading...'}
        subtitle="Attendance"
        showBack
        onBack={() => navigate('/')}
      />
      <Spinner show={bandLoading} text="Loading band data..." />

      <main className="p-5 max-w-[600px] mx-auto animate-fadeIn">
        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <div>
            {/* Pending sync banner */}
            {pendingKeys.length > 0 && pendingInfo && (
              <div
                className="bg-[var(--accent-orange-bg)] border border-[var(--accent-orange-border)] rounded-lg p-3.5 px-4 mb-4 flex items-center gap-2.5 text-sm text-[var(--text-primary)] cursor-pointer"
                onClick={handleRetrySync}
              >
                <span className="text-lg flex-shrink-0">&#128260;</span>
                <div>
                  {syncing
                    ? 'Syncing...'
                    : `You have unsaved attendance from ${pendingInfo.date}. Tap to sync.`}
                </div>
              </div>
            )}

            {/* Recording-as indicator */}
            {user && (
              <div className="text-sm text-[var(--text-secondary)] mb-3 flex items-center justify-center gap-1">
                Recording as: <span className="font-semibold text-[var(--text-primary)]">{user.email}</span>
              </div>
            )}

            <Card>
              <DatePickerComp date={sessionDate} onChange={handleDateChange} />
              <TimePicker
                hour={timeState.hour}
                minute={timeState.minute}
                ampm={timeState.ampm}
                onChange={handleTimeChange}
              />
              <TermBadgeEditor term={term} year={year} onTermChange={setTerm} />
            </Card>

            {existingSession && (
              <WarningBanner>
                <strong>Attendance already recorded for this session.</strong>
                <div className="mt-1 text-[13px]">You can view and edit the existing records.</div>
              </WarningBanner>
            )}

            {existingSession ? (
              <div className="mt-5 flex flex-col gap-3">
                <Button onClick={handleEdit}>
                  View / Edit Existing
                </Button>
                {isAdmin && (
                  <details className="mt-6 pt-4 border-t border-dashed border-[var(--border-subtle)]">
                    <summary className="text-xs text-[var(--text-muted)] cursor-pointer min-h-[44px] py-3 flex items-center gap-2 select-none">
                      <span aria-hidden="true">&#9888;</span>
                      Danger zone (admin only)
                    </summary>
                    <button
                      onClick={handleResetSession}
                      disabled={resetting}
                      className="w-full mt-2 py-3 px-4 rounded-xl text-sm font-semibold border border-[var(--accent-red)] text-[var(--accent-red)] bg-transparent hover:bg-[var(--accent-red-bg)] transition-all disabled:opacity-50 min-h-[44px]"
                    >
                      {resetting ? 'Deleting...' : 'Reset This Session'}
                    </button>
                    <p className="text-[11px] text-[var(--text-muted)] mt-2 leading-relaxed">
                      Permanently deletes this session's attendance records. Cannot be undone.
                    </p>
                  </details>
                )}
              </div>
            ) : (
              <Button
                onClick={handleStart}
                className="mt-5"
              >
                Start Attendance
              </Button>
            )}
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <Card>
            <h3 className="mb-3 text-base font-bold text-[var(--text-primary)]">Attendance Reports</h3>
            <ReportFilters
              year={reportYear}
              term={reportTerm}
              onYearChange={setReportYear}
              onTermChange={setReportTerm}
              onGenerate={() => loadReport(reportYear, reportTerm)}
            />

            <Spinner show={reportLoading} text="Loading report..." />

            {reportError && (
              <div className="text-[var(--accent-red)] p-3 text-sm">
                Error loading report: {reportError}
              </div>
            )}

            {reportData && reportData.empty && (
              <div className="text-center p-5 text-[var(--text-muted)]">
                No sessions found for this period.
              </div>
            )}

            {reportData && !reportData.empty && (
              <>
                <DetailedRegister
                  sortedSessions={reportData.sortedSessions}
                  registerByInst={reportData.registerByInst}
                  attMap={reportData.attMap}
                  totalSessions={reportData.totalSessions}
                />
                <ExportButtons
                  reportData={reportData}
                  onExport={(msg) => toast(msg, 'success')}
                  detailedOnly
                />
              </>
            )}
          </Card>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--text-primary)]">Events</h3>
              <button
                className="bg-[var(--accent-blue)] text-white border-none rounded-lg px-4 py-2 text-sm font-semibold cursor-pointer shadow-[var(--shadow-glow)]"
                onClick={() => setShowAddEvent(!showAddEvent)}
              >
                {showAddEvent ? 'Cancel' : '+ Add Event'}
              </button>
            </div>

            {showAddEvent && (
              <Card>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Event name *"
                    value={newEvent.name}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[var(--accent-blue-border)] rounded-lg text-sm bg-[var(--surface-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                  />
                  <input
                    type="text"
                    placeholder="Event type (e.g. Concert, Rehearsal)"
                    value={newEvent.event_type}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, event_type: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[var(--accent-blue-border)] rounded-lg text-sm bg-[var(--surface-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                  />
                  <input
                    type="date"
                    value={newEvent.event_date}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, event_date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[var(--accent-blue-border)] rounded-lg text-sm bg-[var(--surface-input)] text-[var(--text-primary)]"
                  />
                  <input
                    type="time"
                    value={newEvent.event_time}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, event_time: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[var(--accent-blue-border)] rounded-lg text-sm bg-[var(--surface-input)] text-[var(--text-primary)]"
                  />
                  <input
                    type="text"
                    placeholder="Venue"
                    value={newEvent.venue}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, venue: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[var(--accent-blue-border)] rounded-lg text-sm bg-[var(--surface-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                  />
                  <textarea
                    placeholder="Notes"
                    value={newEvent.notes}
                    onChange={(e) => setNewEvent(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-[var(--accent-blue-border)] rounded-lg text-sm bg-[var(--surface-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                    rows={2}
                  />
                  <Button onClick={handleCreateEvent}>Create Event</Button>
                </div>
              </Card>
            )}

            <Spinner show={eventsLoading} text="Loading events..." />

            {!eventsLoading && events.length === 0 && (
              <EmptyState icon="📅">
                No events found.<br />Add an event to get started.
              </EmptyState>
            )}

            {events.map(event => (
              <EventCard key={event.id} event={event} bandId={bandId} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
