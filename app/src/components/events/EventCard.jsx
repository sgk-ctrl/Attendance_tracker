import { useNavigate } from 'react-router-dom';
import { MONTHS_SHORT, DAYS_SHORT } from '../../lib/constants';

export default function EventCard({ event, bandId }) {
  const navigate = useNavigate();
  const d = new Date(event.event_date + 'T00:00:00');
  const day = d.getDate();
  const mon = MONTHS_SHORT[d.getMonth()];
  const dayName = DAYS_SHORT[d.getDay()];

  return (
    <div
      className="bg-[var(--bg-card)] rounded-[16px] p-4 mb-3 shadow-[var(--shadow)] border border-[var(--border-card)] backdrop-blur-[10px] cursor-pointer active:bg-[var(--accent-blue-bg)] transition-colors duration-200"
      onClick={() => navigate(`/band/${bandId}/events/${event.id}`)}
    >
      <div className="flex items-center gap-3">
        <div className="bg-[var(--accent-blue-bg-strong)] border border-[var(--border-card)] rounded-lg w-14 h-14 flex flex-col items-center justify-center flex-shrink-0">
          <div className="text-xs font-semibold text-[var(--accent-blue-light)]">{mon}</div>
          <div className="text-lg font-bold text-[var(--text-primary)]">{day}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[15px] text-[var(--text-primary)]">{event.name}</div>
          <div className="text-xs text-[var(--text-muted)] mt-0.5">
            {dayName} {event.event_time && `at ${event.event_time}`}
            {event.venue && ` - ${event.venue}`}
          </div>
          {event.event_type && (
            <span className="inline-block mt-1 bg-[var(--accent-blue-bg-strong)] text-[var(--accent-blue-light)] px-2 py-0.5 rounded-full text-[11px] font-semibold">
              {event.event_type}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
