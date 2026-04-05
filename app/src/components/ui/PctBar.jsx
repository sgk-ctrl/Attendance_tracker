import { pctClass, pctColor } from '../../lib/utils';

export default function PctBar({ pct }) {
  return (
    <span>
      <span className={pctClass(pct) === 'pct-good' ? 'text-[var(--green-600)]' : pctClass(pct) === 'pct-warn' ? 'text-[var(--orange-500)]' : 'text-[var(--red-600)]'}>
        {pct}%
      </span>
      <span className="pct-bar">
        <span
          className={`pct-bar-fill ${pctClass(pct) === 'pct-good' ? 'bg-[var(--green-500)]' : pctClass(pct) === 'pct-warn' ? 'bg-[var(--orange-500)]' : 'bg-[var(--red-500)]'}`}
          style={{ width: `${pct}%` }}
        />
      </span>
    </span>
  );
}
