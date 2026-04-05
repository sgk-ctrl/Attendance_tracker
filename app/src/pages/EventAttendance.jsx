import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useBandData } from '../hooks/useBandData';
import { useEventAttendance } from '../hooks/useEvents';
import { useToast } from '../context/ToastContext';
import { supabase } from '../lib/supabase';
import Header from '../components/layout/Header';
import Spinner from '../components/layout/Spinner';
import StudentCheckList from '../components/events/StudentCheckList';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

export default function EventAttendance() {
  const { bandId, eventId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { band, students, loading: dataLoading } = useBandData(bandId);
  const { attendance, toggleStudent, loading: attLoading, submitting, submitAttendance } = useEventAttendance(eventId);
  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);

  useEffect(() => {
    async function loadEvent() {
      try {
        const { data, error } = await supabase
          .from('band_events')
          .select('*')
          .eq('id', eventId)
          .single();
        if (error) throw error;
        setEvent(data);
      } catch (e) {
        toast('Failed to load event: ' + e.message, 'error');
      } finally {
        setEventLoading(false);
      }
    }
    loadEvent();
  }, [eventId, toast]);

  const handleSubmit = async () => {
    try {
      await submitAttendance(students);
      toast('Event attendance saved!', 'success');
      navigate(`/band/${bandId}`);
    } catch (e) {
      toast('Failed to save: ' + e.message, 'error');
    }
  };

  const loading = dataLoading || attLoading || eventLoading;

  return (
    <div>
      <Header
        title={event?.name || 'Event'}
        subtitle={band?.name || 'Loading...'}
        showBack
        onBack={() => navigate(`/band/${bandId}`)}
      />
      <Spinner show={loading} text="Loading..." />

      <main className="p-5 max-w-[600px] mx-auto animate-fadeIn">
        {!loading && students.length === 0 ? (
          <EmptyState icon="👤">
            No students found for this band.
          </EmptyState>
        ) : !loading ? (
          <>
            {event && (
              <div className="mb-4 text-center">
                <div className="text-sm text-[var(--gray-600)]">
                  {event.event_date} {event.event_time && `at ${event.event_time}`}
                  {event.venue && ` - ${event.venue}`}
                </div>
              </div>
            )}

            <p className="text-sm text-[var(--gray-600)] mb-4">
              Tap students to mark them present.
            </p>

            <StudentCheckList
              students={students}
              attendance={attendance}
              onToggle={toggleStudent}
            />

            <div className="mt-5">
              <Button
                variant="success"
                onClick={handleSubmit}
                disabled={submitting}
              >
                {submitting ? 'Saving...' : 'Submit Attendance'}
              </Button>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
