import PctBar from '../ui/PctBar';

export default function InstrumentReport({ instRows, totalSessions }) {
  return (
    <div>
      <div className="font-bold text-[var(--gray-700)] my-5 text-[15px]">
        By Instrument ({totalSessions} sessions)
      </div>
      <div className="overflow-x-auto rounded-lg shadow-[var(--shadow)] -webkit-overflow-scrolling-touch">
        <table className="report-table">
          <thead>
            <tr>
              <th>Instrument</th>
              <th>Attendance</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {instRows.map(r => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td>{r.attended}/{r.possible}</td>
                <td><PctBar pct={r.pct} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
