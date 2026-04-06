import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useBandData } from '../hooks/useBandData';
import { useAttendanceFlow } from '../hooks/useAttendanceFlow';
import { useNavGuard } from '../hooks/useNavGuard';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import Header from '../components/layout/Header';
import ProgressIndicator from '../components/layout/ProgressIndicator';
import Spinner from '../components/layout/Spinner';
import InstrumentCard from '../components/attendance/InstrumentCard';
import TallyFooter from '../components/attendance/TallyFooter';
import ResolveSection from '../components/attendance/ResolveSection';
import SummaryHero from '../components/attendance/SummaryHero';
import BreakdownList from '../components/attendance/BreakdownList';
import AbsentList from '../components/attendance/AbsentList';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

export default function AttendanceFlow() {
  const { bandId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { user } = useAuth();
  const { band, instruments, students, loading: dataLoading, error: dataError } = useBandData(bandId);

  const {
    sessionDate: sessionDateStr,
    sessionTime = '3:10 PM',
    sessionType = 'afternoon',
    term = 1,
    year = new Date().getFullYear(),
    editMode = false,
  } = location.state || {};

  const sessionDate = useMemo(() => {
    if (!sessionDateStr) return new Date();
    const parts = sessionDateStr.split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  }, [sessionDateStr]);

  const flow = useAttendanceFlow({
    instruments,
    students,
    sessionDate,
    sessionTime,
    sessionType,
    term,
    year,
    bandId,
  });

  const [spinnerText, setSpinnerText] = useState('');
  const [showSpinner, setShowSpinner] = useState(false);

  // Nav guard
  const blocker = useNavGuard(flow.hasDataEntered);

  // Show blocker dialog
  useEffect(() => {
    if (blocker.state === 'blocked') {
      const proceed = window.confirm('You have unsaved attendance data. Go back and lose changes?');
      if (proceed) {
        blocker.proceed();
      } else {
        blocker.reset();
      }
    }
  }, [blocker]);

  // Init attendance flow
  useEffect(() => {
    if (!dataLoading && instruments.length > 0 && students.length > 0) {
      setShowSpinner(true);
      setSpinnerText('Preparing session...');
      flow.startAttendance(editMode)
        .then(() => {
          setShowSpinner(false);
        })
        .catch(e => {
          toast('Error: ' + e.message, 'error');
          setShowSpinner(false);
        });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataLoading, instruments.length, students.length]);

  // Compute tally stats
  const visibleInstruments = instruments.filter(inst => {
    return students.filter(s => s.instrument_id === inst.id).length > 0;
  });

  let enteredCount = 0;
  let tallyTotal = 0;
  instruments.forEach(inst => {
    if (flow.tallies[inst.id] !== undefined) {
      enteredCount++;
      tallyTotal += flow.tallies[inst.id];
    }
  });

  const allFilled = enteredCount >= instruments.length;

  // Handle next from tally
  const handleNext = useCallback(() => {
    if (!allFilled) {
      // Scroll to first unfilled
      const unfilled = visibleInstruments.find(inst => flow.tallies[inst.id] === undefined);
      if (unfilled) {
        const el = document.getElementById(`card-${unfilled.id}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }
    flow.goToResolve();
    window.scrollTo(0, 0);
  }, [allFilled, flow, visibleInstruments]);

  // Handle submit
  const handleSubmit = async () => {
    setShowSpinner(true);
    setSpinnerText('Saving attendance...');
    try {
      const result = await flow.submitAttendance();
      if (result.warning) {
        toast(result.warning, 'error');
      }
      toast('Attendance saved successfully!', 'success');
      window.scrollTo(0, 0);
    } catch (e) {
      toast('Failed to save. Data saved locally for retry.', 'error');
    } finally {
      setShowSpinner(false);
    }
  };

  // Unresolved count for resolve step
  const unresolvedCount = flow.getUnresolvedCount();

  // Handle back
  const handleBack = () => {
    if (flow.step === 1) {
      if (flow.hasDataEntered) {
        if (!window.confirm('You have unsaved attendance data. Go back and lose changes?')) return;
      }
      navigate(`/band/${bandId}`);
    } else if (flow.step === 2) {
      flow.setStep(1);
      window.scrollTo(0, 0);
    } else if (flow.step === 3) {
      navigate(`/band/${bandId}`);
    }
  };

  // Summary data
  const summaryData = flow.step === 3 ? flow.getSummaryData() : null;

  const formattedDate = sessionDate ? `${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][sessionDate.getDay()]} ${sessionDate.getDate()} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][sessionDate.getMonth()]}` : '';
  const recorderName = user?.email?.split('@')[0] || '';
  const subtitle = `${formattedDate}${sessionTime ? ` · ${sessionTime}` : ''}${recorderName ? ` · ${recorderName}` : ''}`;

  if (dataLoading) {
    return (
      <div>
        <Header title={band?.name || 'Loading...'} subtitle={subtitle} showBack onBack={handleBack} />
        <Spinner show text="Loading instruments and students..." />
      </div>
    );
  }

  if (dataError && instruments.length === 0) {
    return (
      <div>
        <Header title={band?.name || 'Band'} subtitle={subtitle} showBack onBack={handleBack} />
        <EmptyState icon="🎵">
          Failed to load data: {dataError}<br />Please check your connection.
        </EmptyState>
      </div>
    );
  }

  return (
    <div>
      <Header title={band?.name || 'Band'} subtitle={subtitle} showBack onBack={handleBack} />
      <ProgressIndicator currentStep={flow.step} />
      <Spinner show={showSpinner} text={spinnerText} />

      <main className="p-5 max-w-[600px] mx-auto animate-fadeIn">
        {/* Step 1: Tally */}
        {flow.step === 1 && (
          <div>
            {instruments.length === 0 ? (
              <EmptyState icon="🎵">
                No instruments found in the database.<br />Please contact the administrator.
              </EmptyState>
            ) : students.length === 0 ? (
              <EmptyState icon="👤">
                No active students found in the database.<br />Please contact the administrator.
              </EmptyState>
            ) : (
              <>
                <div className="rounded-xl p-4 mb-4 border border-[var(--accent-blue-border)] bg-[var(--accent-blue-glow)]">
                  <p className="text-sm font-semibold text-[var(--accent-blue-light)] mb-1">
                    How this works
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Count the students in each instrument section and enter the number below.
                    You must enter a count for <strong className="text-[var(--text-primary)]">every instrument</strong> before
                    you can proceed. Use <strong className="text-[var(--text-primary)]">All</strong> if everyone is present,
                    or <strong className="text-[var(--text-primary)]">None</strong> if the section is empty.
                  </p>
                </div>

                {!allFilled && enteredCount > 0 && (
                  <div className="rounded-lg px-4 py-2 mb-3 text-sm text-[var(--accent-orange)] bg-[var(--accent-orange-bg)] border border-[var(--accent-orange-border)]">
                    {instruments.length - enteredCount} instrument(s) still need a count
                  </div>
                )}

                {allFilled && (
                  <div className="rounded-lg px-4 py-2 mb-3 text-sm text-[var(--accent-green)] bg-[var(--accent-green-bg)] border border-[var(--accent-green-border)]">
                    ✓ All instruments entered — {tallyTotal} of {flow.totalStudents} students accounted for. Tap Next to continue.
                  </div>
                )}

                <div>
                  {visibleInstruments.map(inst => {
                    const expected = students.filter(s => s.instrument_id === inst.id).length;
                    return (
                      <div key={inst.id} id={`card-${inst.id}`}>
                        <InstrumentCard
                          instrument={inst}
                          expected={expected}
                          value={flow.tallies[inst.id]}
                          onValueChange={(val) => flow.setTally(inst.id, val)}
                        />
                      </div>
                    );
                  })}
                </div>
                <TallyFooter
                  enteredCount={Math.min(enteredCount, instruments.length)}
                  totalInstruments={instruments.length}
                  tallyTotal={tallyTotal}
                  totalStudents={flow.totalStudents}
                  onNext={handleNext}
                  disabled={!allFilled}
                />
              </>
            )}
          </div>
        )}

        {/* Step 2: Resolve */}
        {flow.step === 2 && (
          <div>
            <div className="text-center text-sm text-[var(--text-secondary)] mb-4 font-medium" aria-live="polite">
              {flow.mismatchInstruments.length === 0
                ? 'All sections resolved automatically.'
                : `${flow.mismatchInstruments.length} section(s) need manual resolution`}
            </div>

            {flow.autoResolvedInfo && (
              <div className="bg-[var(--accent-green-bg)] border border-[var(--accent-green-border)] rounded-lg p-3 px-4 mb-3 text-sm text-[var(--accent-green)] flex items-center gap-2">
                &#10003; Auto-resolved: {flow.autoResolvedInfo}
              </div>
            )}

            {flow.mismatchInstruments.map(({ inst, studs, count }) => (
              <ResolveSection
                key={inst.id}
                instrument={inst}
                students={studs}
                targetCount={count}
                attendance={flow.attendance}
                onToggle={flow.toggleStudent}
                onSelectAll={() => flow.setInstrumentAttendance(inst.id, true)}
                onDeselectAll={() => flow.setInstrumentAttendance(inst.id, false)}
              />
            ))}

            <div className="mt-5">
              <div
                className={`text-center text-sm font-semibold mb-3 p-2 px-3 rounded-lg ${
                  unresolvedCount > 0
                    ? 'text-[var(--accent-orange)] bg-[var(--accent-orange-bg)]'
                    : 'text-[var(--accent-green)] bg-[var(--accent-green-bg)]'
                }`}
              >
                {unresolvedCount > 0
                  ? `${unresolvedCount} section(s) still need resolution`
                  : 'All sections resolved'}
              </div>
              <Button
                variant="success"
                disabled={unresolvedCount > 0 || flow.submitting}
                onClick={handleSubmit}
              >
                {flow.submitting ? 'Saving...' : 'Submit Attendance'}
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {flow.step === 3 && summaryData && (
          <div>
            <SummaryHero
              presentCount={summaryData.presentCount}
              totalStudents={summaryData.totalStudents}
              recordedBy={user?.email || ''}
            />
            <BreakdownList breakdown={summaryData.breakdown} />
            <AbsentList breakdown={summaryData.breakdown} />
            <div className="flex gap-3 mt-4">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => { flow.setStep(1); window.scrollTo(0, 0); }}
              >
                Edit Counts
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => { flow.goToResolve(); window.scrollTo(0, 0); }}
              >
                Edit Students
              </Button>
              <Button
                className="flex-1"
                onClick={() => {
                  flow.setHasDataEntered(false);
                  navigate(`/band/${bandId}`);
                }}
              >
                Done
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
