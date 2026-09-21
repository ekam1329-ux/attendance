import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, CheckCircle2, Edit3, Calendar, RotateCcw } from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '../types';
import {
  formatFullDateDisplay,
  formatTimeDisplay,
  formatDuration,
  getTodayDateString,
  getCurrentTimeString,
  calculateDurationMinutes
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
  const [inTimeInput, setInTimeInput] = useState<string>('');
  const [outTimeInput, setOutTimeInput] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const currentHHMM = getCurrentTimeString(currentTime);
  const todayStr = getTodayDateString(currentTime);
  const formattedTodayDate = formatFullDateDisplay(todayStr);

  const formattedLiveClock = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Keep inputs synced when todayRecord changes
  useEffect(() => {
    if (todayRecord) {
      if (todayRecord.in_time) setInTimeInput(todayRecord.in_time);
      if (todayRecord.out_time) setOutTimeInput(todayRecord.out_time);
      if (todayRecord.notes) setNotes(todayRecord.notes);
    } else {
      if (!inTimeInput) setInTimeInput(currentHHMM);
      if (!outTimeInput) setOutTimeInput(currentHHMM);
    }
  }, [todayRecord]);

  const activeInTime = todayRecord?.in_time || inTimeInput || currentHHMM;
  const activeOutTime = todayRecord?.out_time || outTimeInput || currentHHMM;

  const calculatedMin = calculateDurationMinutes(
    todayRecord?.in_time || inTimeInput || null,
    todayRecord?.out_time || outTimeInput || null
  );

  const isMarkedIn = Boolean(todayRecord && todayRecord.in_time);
  const isMarkedOut = Boolean(todayRecord && todayRecord.out_time);

  // MARK IN CLICK
  const handleMarkInClick = async () => {
    setIsSubmitting(true);
    try {
      const timeToUse = inTimeInput || currentHHMM;
      await onMarkIn(timeToUse, notes);
    } finally {
      setIsSubmitting(false);
    }
  };

  // MARK OUT CLICK
  const handleMarkOutClick = async () => {
    setIsSubmitting(true);
    try {
      const outTimeToUse = outTimeInput || currentHHMM;
      await onMarkOut(outTimeToUse, notes);
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

      {/* Side-by-Side Mark In & Mark Out Options */}
      <div style={{ paddingTop: '1.5rem' }}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem'
          }}
        >
          {/* OPTION 1: MARK ATTENDANCE IN */}
          <div
            style={{
              background: isMarkedIn ? 'var(--status-present-bg)' : 'var(--bg-tertiary)',
              border: `2px solid ${isMarkedIn ? 'var(--status-present-border)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                  Option: Mark In (Arrival)
                </span>
                {isMarkedIn && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-present-accent)', background: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    ✓ MARKED IN
                  </span>
                )}
              </div>

              {isMarkedIn ? (
                <div style={{ margin: '0.5rem 0' }}>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--status-present-text)' }}>
                    {formatTimeDisplay(todayRecord!.in_time)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--status-present-text)' }}>
                    Arrival time recorded for today
                  </div>
                </div>
              ) : (
                <div style={{ margin: '0.75rem 0' }}>
                  <label htmlFor="in-time-input" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Select In-Time:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      id="in-time-input"
                      type="time"
                      className="input-control"
                      style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)', padding: '0.5rem 0.75rem', flex: 1 }}
                      value={inTimeInput || currentHHMM}
                      onChange={(e) => setInTimeInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => setInTimeInput(currentHHMM)}
                      title="Set to Current Time"
                    >
                      Now
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                id="btn-mark-in"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  fontSize: '1rem',
                  background: isMarkedIn ? 'var(--bg-secondary)' : '#10b981',
                  color: isMarkedIn ? 'var(--text-primary)' : 'white',
                  border: isMarkedIn ? '1px solid var(--border-strong)' : 'none'
                }}
                onClick={handleMarkInClick}
                disabled={isSubmitting || isLoading}
              >
                <LogIn size={18} />
                <span>{isSubmitting ? 'Saving...' : isMarkedIn ? 'Change In-Time' : 'Mark In'}</span>
              </button>
            </div>
          </div>

          {/* OPTION 2: MARK ATTENDANCE OUT */}
          <div
            style={{
              background: isMarkedOut ? 'var(--primary-subtle)' : 'var(--bg-tertiary)',
              border: `2px solid ${isMarkedOut ? 'var(--primary-border)' : 'var(--border-subtle)'}`,
              borderRadius: 'var(--radius-md)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-secondary)', letterSpacing: '0.04em' }}>
                  Option: Mark Out (Departure)
                </span>
                {isMarkedOut && (
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', background: 'white', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                    ✓ MARKED OUT
                  </span>
                )}
              </div>

              {isMarkedOut ? (
                <div style={{ margin: '0.5rem 0' }}>
                  <div style={{ fontSize: '1.85rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>
                    {formatTimeDisplay(todayRecord!.out_time)}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Departure recorded &bull; Duration: <strong>{formatDuration(todayRecord!.duration_minutes)}</strong>
                  </div>
                </div>
              ) : (
                <div style={{ margin: '0.75rem 0' }}>
                  <label htmlFor="out-time-input" style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    Select Out-Time:
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <input
                      id="out-time-input"
                      type="time"
                      className="input-control"
                      style={{ fontSize: '1.1rem', fontFamily: 'var(--font-mono)', padding: '0.5rem 0.75rem', flex: 1 }}
                      value={outTimeInput || currentHHMM}
                      onChange={(e) => setOutTimeInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ padding: '0.5rem 0.75rem', fontSize: '0.8rem' }}
                      onClick={() => setOutTimeInput(currentHHMM)}
                      title="Set to Current Time"
                    >
                      Now
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '0.75rem' }}>
              <button
                type="button"
                id="btn-mark-out"
                className="btn btn-primary"
                style={{
                  width: '100%',
                  padding: '0.8rem',
                  fontSize: '1rem',
                  background: isMarkedOut ? 'var(--bg-secondary)' : '#2563eb',
                  color: isMarkedOut ? 'var(--text-primary)' : 'white',
                  border: isMarkedOut ? '1px solid var(--border-strong)' : 'none'
                }}
                onClick={handleMarkOutClick}
                disabled={isSubmitting || isLoading}
              >
                <LogOut size={18} />
                <span>{isSubmitting ? 'Saving...' : isMarkedOut ? 'Change Out-Time' : 'Mark Out'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Optional Research Notes */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <input
            type="text"
            className="input-control"
            style={{ flex: 1, padding: '0.65rem 0.85rem' }}
            placeholder="Add research activity / notes for today (e.g. Lab experiments, paper writing, supervisor meeting...)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          {todayRecord && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => onEditToday(todayRecord)}
              title="Edit full record details"
            >
              <Edit3 size={16} />
              <span>Edit Details</span>
            </button>
          )}
        </div>
      </div>
    </section>
  );
};
