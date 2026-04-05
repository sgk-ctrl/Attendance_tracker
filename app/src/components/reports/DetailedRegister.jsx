import { MONTHS_SHORT, DAYS_SHORT } from '../../lib/constants';
import { pctClass } from '../../lib/utils';

export default function DetailedRegister({ sortedSessions, registerByInst, attMap, totalSessions }) {
  return (
    <div>
      <div className="font-bold text-[var(--text-secondary)] my-5 text-[15px]">
        Detailed Attendance Register
      </div>
      <div className="overflow-x-auto rounded-lg shadow-[var(--shadow)] border border-[var(--border-card)] -webkit-overflow-scrolling-touch">
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
