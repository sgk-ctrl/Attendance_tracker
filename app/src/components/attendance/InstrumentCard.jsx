import Stepper from './Stepper';
import { haptic } from '../../lib/utils';

export default function InstrumentCard({ instrument, expected, value, onValueChange }) {
  const val = value ?? '';
  let borderClass = 'instrument-card';
  let indicatorClass = 'match-indicator pending';
  let indicatorContent = '\u25CB';

  if (val !== '') {
    if (val == expected) {
      borderClass = 'instrument-card entered-match';
      indicatorClass = 'match-indicator match';
      indicatorContent = '\u2713';
    } else if (val == 0) {
      borderClass = 'instrument-card entered-zero';
      indicatorClass = 'match-indicator zero';
      indicatorContent = '\u2014';
    } else {
      borderClass = 'instrument-card entered-mismatch';
      indicatorClass = 'match-indicator mismatch';
      indicatorContent = '\u26A0';
    }
  }

  const handleAll = () => {
    haptic();
    onValueChange(expected);
  };

  const handleNone = () => {
    haptic();
    onValueChange(0);
  };

  return (
    <div className={`${borderClass} bg-[var(--bg-card)] rounded-[16px] p-4 mb-3 shadow-[var(--shadow)] border border-[var(--border-card)] backdrop-blur-[10px] flex items-center justify-between gap-3`}>
      <div className="flex-1 min-w-0">
        <div className="text-base font-bold text-[var(--text-primary)]">{instrument.name}</div>
        <div className="text-[13px] text-[var(--text-secondary)] mt-0.5">Expected: {expected}</div>
        <div className="flex gap-1.5 mt-1.5">
          <button
            className="px-2.5 py-1 rounded-[14px] text-xs font-semibold border cursor-pointer transition-all duration-200 bg-[var(--accent-green-bg)] text-[var(--accent-green)] border-[var(--accent-green-border)] active:bg-[var(--accent-green)] active:text-white"
            onClick={handleAll}
          >
            All ({expected})
          </button>
          <button
            className="px-2.5 py-1 rounded-[14px] text-xs font-semibold border cursor-pointer transition-all duration-200 bg-[var(--surface-elevated)] text-[var(--text-secondary)] border-[var(--border-subtle)] active:bg-[var(--text-muted)] active:text-white"
            onClick={handleNone}
          >
            None
          </button>
        </div>
      </div>
      <Stepper
        value={val}
        max={expected}
        onChange={onValueChange}
        ariaLabel={instrument.name}
      />
      <div className={indicatorClass}>{indicatorContent}</div>
    </div>
  );
}
