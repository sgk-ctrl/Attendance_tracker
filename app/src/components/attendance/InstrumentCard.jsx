import Stepper from './Stepper';
import { haptic } from '../../lib/utils';

export default function InstrumentCard({ instrument, expected, value, onValueChange }) {
  const val = value ?? '';
  // One status vocabulary: an outline ring (pending), a filled tick (match), a
  // dash (all-absent), a filled dot (mismatch \u2014 needs a look). Previously this
  // mixed a geometric circle, a checkmark, an em-dash and a \u26A0 emoji \u2014 four
  // visual grammars, one of them an emoji. Colour + shape still pair for
  // greyscale legibility; only the glyph set is unified.
  let borderClass = 'instrument-card';
  let indicatorClass = 'match-indicator pending';
  let indicatorContent = '\u25CB'; // \u25CB outline ring \u2014 not yet counted

  if (val !== '') {
    if (val == expected) {
      borderClass = 'instrument-card entered-match';
      indicatorClass = 'match-indicator match';
      indicatorContent = '\u2713'; // \u2713 tick \u2014 full section
    } else if (val == 0) {
      borderClass = 'instrument-card entered-zero';
      indicatorClass = 'match-indicator zero';
      indicatorContent = '\u2013'; // \u2013 dash \u2014 none present
    } else {
      borderClass = 'instrument-card entered-mismatch';
      indicatorClass = 'match-indicator mismatch';
      indicatorContent = '\u25C9'; // \u25C9 fisheye \u2014 partial, needs a look
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

  // No backdrop-blur: the app background is opaque, so it blurred nothing —
  // pure cost. A tally row is a quiet surface, so it sits flatter (subtler
  // shadow) than the summary hero, giving the flow real hierarchy instead of
  // one glass recipe on every card.
  return (
    <div className={`${borderClass} bg-[var(--bg-card-solid)] rounded-[14px] p-4 mb-3 shadow-[var(--shadow-sm)] border border-[var(--border-subtle)] flex items-center justify-between gap-3`}>
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
