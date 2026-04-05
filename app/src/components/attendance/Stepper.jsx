import { haptic } from '../../lib/utils';

export default function Stepper({ value, max, onChange, ariaLabel }) {
  const handleStep = (delta) => {
    haptic();
    let val = parseInt(value);
    if (isNaN(val)) val = 0;
    val = Math.max(0, Math.min(max, val + delta));
    onChange(val);
  };

  const handleInput = (e) => {
    const raw = e.target.value;
    if (raw === '') {
      onChange('');
      return;
    }
    let val = parseInt(raw);
    if (isNaN(val)) return;
    val = Math.max(0, Math.min(max, val));
    onChange(val);
  };

  return (
    <div className="stepper">
      <button
        onClick={() => handleStep(-1)}
        aria-label={`Decrease ${ariaLabel} count`}
      >
        {'\u2212'}
      </button>
      <input
        type="number"
        className="stepper-value"
        value={value}
        min="0"
        max={max}
        inputMode="numeric"
        onChange={handleInput}
        aria-label={`${ariaLabel} student count`}
      />
      <button
        onClick={() => handleStep(1)}
        aria-label={`Increase ${ariaLabel} count`}
      >
        {'\u002B'}
      </button>
    </div>
  );
}
