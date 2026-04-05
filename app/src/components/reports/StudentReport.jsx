import PctBar from '../ui/PctBar';

export default function StudentReport({ studentRows }) {
  return (
    <div>
      <div className="font-bold text-[var(--text-secondary)] my-5 text-[15px]">
        By Student
      </div>
      <div className="overflow-x-auto rounded-lg shadow-[var(--shadow)] border border-[var(--border-card)] -webkit-overflow-scrolling-touch">
        <table className="report-table">
          <thead>
            <tr>
              <th>Student</th>
              <th>Instrument</th>
              <th>Attended</th>
              <th>Rate</th>
            </tr>
          </thead>
          <tbody>
            {studentRows.map(r => (
              <tr key={r.id}>
                <td>{r.name}</td>
                <td className="text-xs">{r.instrument}</td>
                <td>{r.attended}/{r.total}</td>
                <td><PctBar pct={r.pct} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
