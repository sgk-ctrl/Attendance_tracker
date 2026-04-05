import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBandData } from '../hooks/useBandData';
import { useReports } from '../hooks/useReports';
import { useEvents } from '../hooks/useEvents';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useToast } from '../context/ToastContext';
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

  // Volunteer name tracking
  const [volunteerName, setVolunteerName] = useState(() => localStorage.getItem('volunteer_name') || '');
  const [volunteerInput, setVolunteerInput] = useState('');
  const [editingName, setEditingName] = useState(false);

  const defaultTime = defaultTimeForDay(sessionDate.getDay());
  const [timeState, setTimeState] = useState({
    hour: defaultTime.hour,
    minute: defaultTime.minute,
    ampm: defaultTime.ampm,
  });

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

  // Handle date change
  const handleDateChange = (d) => {
    setSessionDate(d);
    setTerm(calcTerm(d));
    setYear(d.getFullYear());
    const dt = defaultTimeForDay(d.getDay());
    setTimeState({ hour: dt.hour, minute: dt.minute, ampm: dt.ampm });
  };

  // Handle time change
  const handleTimeChange = ({ hour, minute, ampm }) => {
    setTimeState({ hour, minute, ampm });
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

            {/* Volunteer Name Card */}
            {!volunteerName && !editingName ? (
              <Card>
                <div className="text-center">
                  <div className="text-base font-bold text-[var(--text-primary)] mb-2">Welcome! What's your name?</div>
                  <div className="text-sm text-[var(--text-secondary)] mb-3">This helps us track who recorded attendance.</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={volunteerInput}
                      onChange={(e) => setVolunteerInput(e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-[var(--accent-blue-border)] rounded-lg text-sm bg-[var(--surface-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                    />
                    <Button
                      onClick={() => {
                        if (volunteerInput.trim()) {
                          localStorage.setItem('volunteer_name', volunteerInput.trim());
                          setVolunteerName(volunteerInput.trim());
                          setVolunteerInput('');
                        }
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </div>
              </Card>
            ) : volunteerName && !editingName ? (
              <div className="text-sm text-[var(--text-secondary)] mb-3 flex items-center justify-center gap-2">
                Recording as: <span className="font-semibold text-[var(--text-primary)]">{volunteerName}</span>
                <button
                  className="text-[var(--accent-blue-light)] text-xs underline bg-transparent border-none cursor-pointer"
                  onClick={() => { setEditingName(true); setVolunteerInput(volunteerName); }}
                >
                  change
                </button>
              </div>
            ) : editingName ? (
              <Card>
                <div className="text-center">
                  <div className="text-sm text-[var(--text-secondary)] mb-2">Update your name</div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Your name"
                      value={volunteerInput}
                      onChange={(e) => setVolunteerInput(e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-[var(--accent-blue-border)] rounded-lg text-sm bg-[var(--surface-input)] text-[var(--text-primary)] placeholder-[var(--text-muted)]"
                    />
                    <Button
                      onClick={() => {
                        if (volunteerInput.trim()) {
                          localStorage.setItem('volunteer_name', volunteerInput.trim());
                          setVolunteerName(volunteerInput.trim());
                          setVolunteerInput('');
                          setEditingName(false);
                        }
                      }}
                    >
                      Save
                    </Button>
                    <button
                      className="text-[var(--text-muted)] text-sm bg-transparent border-none cursor-pointer px-2"
                      onClick={() => { setEditingName(false); setVolunteerInput(''); }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </Card>
            ) : null}

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
              <>
                <Button
                  onClick={handleEdit}
                  className="mt-5"
                >
                  View / Edit Existing
                </Button>
              </>
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
