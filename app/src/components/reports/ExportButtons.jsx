import { DAYS_MED, MONTHS_SHORT } from '../../lib/constants';
import Button from '../ui/Button';

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportButtons({ reportData, onExport }) {
  if (!reportData || reportData.empty) return null;

  const handleSummaryCSV = () => {
    let csv = 'Student Name,Instrument,Sessions Attended,Total Sessions,Attendance %\n';
    reportData.studentRows.forEach(r => {
      csv += `"${r.name}","${r.instrument}",${r.attended},${r.total},${r.pct}%\n`;
    });
    downloadCSV(csv, `hnps-attendance-${reportData.year}${reportData.term ? '-term' + reportData.term : ''}.csv`);
    onExport?.('Summary CSV downloaded');
  };

  const handleDetailedCSV = () => {
    let csv = '"Student Name","Instrument"';
    reportData.sortedSessions.forEach(sess => {
      const dt = new Date(sess.session_date + 'T00:00:00');
      const dayName = DAYS_MED[dt.getDay()];
      const day = dt.getDate();
      const mon = MONTHS_SHORT[dt.getMonth()];
      const timeLabel = sess.session_time || sess.session_type;
      csv += `,"${dayName} ${day} ${mon} (${timeLabel})"`;
    });
    csv += ',"Sessions Attended","Total Sessions","Attendance %"\n';

    reportData.registerByInst.forEach(({ inst, studs }) => {
      studs.forEach(s => {
        let attended = 0;
        csv += `"${s.first_name} ${s.last_name}","${reportData.instMap[s.instrument_id] || inst.name}"`;
        reportData.sortedSessions.forEach(sess => {
          const key = `${s.id}_${sess.id}`;
          const present = reportData.attMap[key];
          if (present === true) { csv += ',P'; attended++; }
          else if (present === false) { csv += ',A'; }
          else { csv += ',-'; }
        });
        const pct = reportData.totalSessions > 0 ? Math.round(attended / reportData.totalSessions * 100) : 0;
        csv += `,${attended},${reportData.totalSessions},${pct}%\n`;
      });
    });

    downloadCSV(csv, `hnps-detailed-attendance-${reportData.year}${reportData.term ? '-term' + reportData.term : ''}.csv`);
    onExport?.('Detailed CSV downloaded');
  };

  return (
    <div className="mt-4 flex gap-2 flex-wrap">
      <Button variant="secondary" className="flex-1 min-w-[140px]" onClick={handleSummaryCSV}>
        Export Summary CSV
      </Button>
      <Button className="flex-1 min-w-[140px]" onClick={handleDetailedCSV}>
        Export Detailed CSV
      </Button>
    </div>
  );
}
