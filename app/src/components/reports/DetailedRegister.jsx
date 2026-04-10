import { MONTHS_SHORT, DAYS_SHORT } from '../../lib/constants';
import { pctClass } from '../../lib/utils';

export default function DetailedRegister({ sortedSessions, registerByInst, attMap, totalSessions }) {
  return (
    <div>
      <div className="font-bold text-[var(--text-secondary)] my-5 text-[15px]">
        Attendance Register
      </div>

      {/* MOBILE SUMMARY VIEW — grouped by instrument, one row per student, percentage-first.
          Shown on phones where the dense P/A table is illegible. */}
      <div className="md:hidden">
        <p className="text-xs text-[var(--text-muted)] mb-3 leading-relaxed">
          Showing {totalSessions} session{totalSessions === 1 ? '' : 's'}. For the full P/A register, use Export below.
        </p>
        <div className="space-y-4">
          {registerByInst.map(({ inst, studs }) => (
            <MobileInstrumentGroup
              key={inst.id}
              inst={inst}
              studs={studs}
              sortedSessions={sortedSessions}
              attMap={attMap}
              totalSessions={totalSessions}
            />
          ))}
        </div>
      </div>

      {/* DESKTOP TABLE VIEW — full P/A register. Hidden on mobile. */}
      <div className="hidden md:block overflow-x-auto rounded-lg shadow-[var(--shadow)] border border-[var(--border-card)] -webkit-overflow-scrolling-touch">
        <table className="report-table register-table">
          <thead>
            <tr>
              <th style={{ position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 2 }}>Student</th>
              {sortedSessions.map(sess => {
                const d = new Date(sess.session_date + 'T00:00:00');
                const day = d.getDate();
                const mon = MONTHS_SHORT[d.getMonth()];
                const dayName = DAYS_SHORT[d.getDay()];
                const timeLabel = sess.session_time || (sess.session_type === 'afternoon' ? 'PM' : 'AM');
                return (
                  <th key={sess.id} className="session-col">
                    <div>{day}</div>
                    <div>{mon}</div>
                    <div className="session-type-label">{timeLabel}</div>
                  </th>
                );
              })}
              <th>Total</th>
              <th>%</th>
            </tr>
          </thead>
          <tbody>
            {registerByInst.map(({ inst, studs }) => (
              <RegisterInstrumentGroup
                key={inst.id}
                inst={inst}
                studs={studs}
                sortedSessions={sortedSessions}
                attMap={attMap}
                totalSessions={totalSessions}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MobileInstrumentGroup({ inst, studs, sortedSessions, attMap, totalSessions }) {
  return (
    <div className="rounded-lg border border-[var(--border-card)] overflow-hidden shadow-[var(--shadow)]">
      <div className="bg-[var(--accent-blue-bg-strong)] px-4 py-2.5 font-bold text-[var(--accent-blue-light)] text-sm flex justify-between items-center">
        <span>{inst.name}</span>
        <span className="text-xs font-medium opacity-80">{studs.length} student{studs.length === 1 ? '' : 's'}</span>
      </div>
      <div className="bg-[var(--bg-card)]">
        {studs.map(s => {
          let attended = 0;
          sortedSessions.forEach(sess => {
            if (attMap[`${s.id}_${sess.id}`] === true) attended++;
          });
          const pct = totalSessions > 0 ? Math.round(attended / totalSessions * 100) : 0;
          const cls = pctClass(pct);
          const barColor =
            cls === 'pct-good' ? 'var(--accent-green)' :
            cls === 'pct-warn' ? 'var(--accent-orange)' :
            'var(--accent-red)';
          const textColor =
            cls === 'pct-good' ? 'text-[var(--accent-green)]' :
            cls === 'pct-warn' ? 'text-[var(--accent-orange)]' :
            'text-[var(--accent-red)]';
          return (
            <div
              key={s.id}
              className="flex items-center justify-between gap-3 px-4 py-3 border-t border-[var(--border-subtle)] first:border-t-0"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm text-[var(--text-primary)] font-medium truncate">
                  {s.first_name} {s.last_name}
                </div>
                <div className="mt-1 h-1.5 bg-[var(--surface-elevated)] rounded-full overflow-hidden" aria-hidden="true">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: barColor }}
                  />
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className={`text-base font-bold ${textColor}`}>{pct}%</div>
                <div className="text-[11px] text-[var(--text-muted)]">{attended}/{totalSessions}</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function RegisterInstrumentGroup({ inst, studs, sortedSessions, attMap, totalSessions }) {
  return (
    <>
      <tr className="inst-group-row">
        <td
          colSpan={sortedSessions.length + 3}
          style={{ position: 'sticky', left: 0, background: 'var(--accent-blue-bg-strong)', fontWeight: 700, color: 'var(--accent-blue-light)' }}
        >
          {inst.name} ({studs.length})
        </td>
      </tr>
      {studs.map(s => {
        let attended = 0;
        return (
          <tr key={s.id}>
            <td style={{ position: 'sticky', left: 0, background: 'var(--bg-secondary)', zIndex: 1, whiteSpace: 'nowrap', color: 'var(--text-primary)' }}>
              {s.first_name} {s.last_name}
            </td>
            {sortedSessions.map(sess => {
              const key = `${s.id}_${sess.id}`;
              const present = attMap[key];
              if (present === true) {
                attended++;
                return <td key={sess.id} className="att-present">P</td>;
              } else if (present === false) {
                return <td key={sess.id} className="att-absent">A</td>;
              }
              return <td key={sess.id} className="att-none">-</td>;
            })}
            <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{attended}/{totalSessions}</td>
            <td
              style={{ fontWeight: 600 }}
              className={
                pctClass(totalSessions > 0 ? Math.round(attended / totalSessions * 100) : 0) === 'pct-good'
                  ? 'text-[var(--accent-green)]'
                  : pctClass(totalSessions > 0 ? Math.round(attended / totalSessions * 100) : 0) === 'pct-warn'
                    ? 'text-[var(--accent-orange)]'
                    : 'text-[var(--accent-red)]'
              }
            >
              {totalSessions > 0 ? Math.round(attended / totalSessions * 100) : 0}%
            </td>
          </tr>
        );
      })}
    </>
  );
}
