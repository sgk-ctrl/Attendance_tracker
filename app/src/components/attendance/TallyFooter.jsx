import Button from '../ui/Button';

export default function TallyFooter({ enteredCount, totalInstruments, tallyTotal, totalStudents, onNext, disabled }) {
  // Note: the button is intentionally NOT native-disabled so taps still fire onNext().
  // onNext() shows a toast and scrolls to the first unfilled instrument, giving the
  // volunteer clear feedback instead of a silent no-op.
  return (
    <div className="sticky bottom-0 bg-[var(--bg-secondary)] border-t border-[var(--border-subtle)] py-4 px-5 -mx-5 shadow-[0_-4px_12px_rgba(0,0,0,0.3)]">
      <div className="text-center text-[13px] text-[var(--text-muted)] mb-2" aria-live="polite">
        {enteredCount} of {totalInstruments} entered
      </div>
      <div className="text-center text-lg font-bold mb-3 text-[var(--text-primary)]" aria-live="polite">
        Accounted: <span className="text-[var(--accent-blue-light)]">{tallyTotal}</span> / {totalStudents}
      </div>
      <Button
        onClick={onNext}
        aria-disabled={disabled}
        className={disabled ? 'opacity-60' : ''}
      >
        Next
      </Button>
    </div>
  );
}
