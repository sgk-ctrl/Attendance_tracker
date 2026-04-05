import { pctClass, pctColor } from '../../lib/utils';

export default function PctBar({ pct }) {
  return (
    <span>
      <span className={pctClass(pct) === 'pct-good' ? 'text-[var(--accent-green)]' : pctClass(pct) === 'pct-warn' ? 'text-[var(--accent-orange)]' : 'text-[var(--accent-red)]'}>
        {pct}%
      </span>
      <span className="pct-bar">
        <span
          className={`pct-bar-fill ${pctClass(pct) === 'pct-good' ? 'bg-[var(--accent-green)]' : pctClass(pct) === 'pct-warn' ? 'bg-[var(--accent-orange)]' : 'bg-[var(--accent-red)]'}`}
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  );
}
