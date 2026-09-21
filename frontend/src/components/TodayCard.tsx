import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, CheckCircle2, Edit3, Calendar } from 'lucide-react';
import { AttendanceRecord } from '../types';
import {
  formatFullDateDisplay,
  formatTimeDisplay,
  formatDuration,
  getTodayDateString,
  getCurrentTimeString
} from '../utils/dateUtils';

interface TodayCardProps {
  todayRecord: AttendanceRecord | null;
  onMarkIn: (inTime: string, notes?: string) => Promise<void>;
  onMarkOut: (outTime: string, notes?: string) => Promise<void>;
  onEditToday: (record: AttendanceRecord) => void;
  isLoading?: boolean;
}

export const TodayCard: React.FC<TodayCardProps> = ({
  todayRecord,
  onMarkIn,
  onMarkOut,
  onEditToday,
  isLoading
}) => {
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  const [notes, setNotes] = useState<string>('');
  const [inTimeInput, setInTimeInput] = useState<string>('');
  const [outTimeInput, setOutTimeInput] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Update default inputs when current time changes if not already set
  const currentHHMM = getCurrentTimeString(currentTime);
  const todayStr = getTodayDateString(currentTime);
  const formattedTodayDate = formatFullDateDisplay(todayStr);

  const formattedLiveClock = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const isMarkedIn = Boolean(todayRecord && todayRecord.in_time);
  const isMarkedOut = Boolean(todayRecord && todayRecord.out_time);
  const isCompleted = isMarkedIn && isMarkedOut;

  const handleMarkInClick = async () => {
    setIsSubmitting(true);
    try {
      const timeToUse = inTimeInput || currentHHMM;
      await onMarkIn(timeToUse, notes);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkOutClick = async () => {
    setIsSubmitting(true);
    try {
      const timeToUse = outTimeInput || currentHHMM;
      await onMarkOut(timeToUse, notes || undefined);
      setNotes('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-md)',
        padding: '1.75rem',
        marginBottom: '2rem'
      }}
    >
      {/* Header with Date & Live Time */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingBottom: '1.25rem',
          borderBottom: '1px solid var(--divider)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-subtle)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Calendar size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Mark Attendance</h2>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {formattedTodayDate}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-full)',
            fontFamily: 'var(--font-mono)',
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--text-primary)'
          }}
        >
          <span className="live-clock-dot" />
          <Clock size={18} />
          <span>{formattedLiveClock}</span>
        </div>
      </div>

      {/* Attendance Timing Controls & Status */}
      <div style={{ paddingTop: '1.5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem'
          }}
        >
          {/* Box 1: In Time */}
          <div
            style={{
              background: isMarkedIn ? 'var(--status-present-bg)' : 'var(--bg-tertiary)',
              border: `1px solid ${isMarkedIn ? 'var(--status-present-border)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Step 1: Arrival (In Time)
            </div>

            {isMarkedIn ? (
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--status-present-text)' }}>
                  {formatTimeDisplay(todayRecord!.in_time)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--status-present-text)', marginTop: '0.25rem' }}>
                  ✓ Marked In
                </div>
              </div>
            ) : (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <input
                    type="time"
                    className="input-control"
                    style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', width: '130px' }}
                    defaultValue={currentHHMM}
                    onChange={(e) => setInTimeInput(e.target.value)}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Time</span>
                </div>
                <button
                  type="button"
                  id="btn-mark-in"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem', background: '#10b981' }}
                  onClick={handleMarkInClick}
                  disabled={isSubmitting || isLoading}
                >
                  <LogIn size={18} />
                  <span>{isSubmitting ? 'Marking In...' : 'Mark In (Present)'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Box 2: Out Time */}
          <div
            style={{
              background: isCompleted ? 'var(--primary-subtle)' : 'var(--bg-tertiary)',
              border: `1px solid ${isCompleted ? 'var(--primary-border)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem'
            }}
          >
            <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
              Step 2: Departure (Out Time)
            </div>

            {isCompleted ? (
              <div>
                <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                  {formatTimeDisplay(todayRecord!.out_time)}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--primary)', marginTop: '0.25rem' }}>
                  ✓ Marked Out
                </div>
              </div>
            ) : isMarkedIn ? (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <input
                    type="time"
                    className="input-control"
                    style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', width: '130px' }}
                    defaultValue={currentHHMM}
                    onChange={(e) => setOutTimeInput(e.target.value)}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Current Time</span>
                </div>
                <button
                  type="button"
                  id="btn-mark-out"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '0.75rem', fontSize: '0.95rem' }}
                  onClick={handleMarkOutClick}
                  disabled={isSubmitting || isLoading}
                >
                  <LogOut size={18} />
                  <span>{isSubmitting ? 'Marking Out...' : 'Mark Out'}</span>
                </button>
              </div>
            ) : (
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', paddingTop: '0.75rem' }}>
                Please Mark In upon arrival first.
              </div>
            )}
          </div>

          {/* Box 3: Total Duration & Status */}
          <div
            style={{
              background: 'var(--bg-tertiary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                Today's Summary
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Status:</span>
                <span className={`status-badge status-${todayRecord?.status || 'Present'}`}>
                  {todayRecord ? todayRecord.status : 'Not Marked'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Duration:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.3rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {isCompleted
                    ? formatDuration(todayRecord!.duration_minutes)
                    : isMarkedIn
                    ? 'In Progress...'
                    : '—'}
                </span>
              </div>
            </div>

            {todayRecord && (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: '0.75rem', padding: '0.45rem 0.75rem', fontSize: '0.8rem', alignSelf: 'flex-start' }}
                onClick={() => onEditToday(todayRecord)}
              >
                <Edit3 size={14} />
                <span>Edit Today's Times</span>
              </button>
            )}
          </div>
        </div>

        {/* Optional Notes Input if not completed */}
        {!isCompleted && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="text"
              className="input-control"
              style={{ flex: 1 }}
              placeholder="Optional notes for today (e.g. Lab experiment, thesis chapter 3, literature survey...)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        )}

        {/* Notes display if completed */}
        {isCompleted && todayRecord?.notes && (
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', padding: '0.65rem 1rem', borderRadius: 'var(--radius-sm)' }}>
            <strong>Notes:</strong> {todayRecord.notes}
          </div>
        )}
      </div>
    </section>
  );
};
