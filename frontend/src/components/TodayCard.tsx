import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, Edit3, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [customTime, setCustomTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Live ticking clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const todayStr = getTodayDateString(currentTime);
  const formattedTodayDate = formatFullDateDisplay(todayStr);

  const formattedLiveClock = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  const handleMarkInClick = async () => {
    setIsSubmitting(true);
    try {
      const timeToUse = customTime || getCurrentTimeString(currentTime);
      await onMarkIn(timeToUse);
      setCustomTime('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMarkOutClick = async () => {
    setIsSubmitting(true);
    try {
      const timeToUse = customTime || getCurrentTimeString(currentTime);
      await onMarkOut(timeToUse);
      setCustomTime('');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Determine state
  const isMarkedIn = Boolean(todayRecord && todayRecord.in_time);
  const isMarkedOut = Boolean(todayRecord && todayRecord.out_time);
  const isCompleted = isMarkedIn && isMarkedOut;

  return (
    <section className="today-card" aria-label="Mark Today's Attendance">
      <div className="today-header">
        <div className="today-title-group">
          <h2>Today's Attendance</h2>
          <div className="today-date-str">{formattedTodayDate}</div>
        </div>

        <div className="live-clock-badge" title="Live System Time">
          <span className="live-clock-dot" />
          <Clock size={16} />
          <span>{formattedLiveClock}</span>
        </div>
      </div>

      <div className="today-body">
        {/* STATE 1: NOT MARKED YET */}
        {!isMarkedIn && (
          <div className="state-unmarked">
            <div className="state-unmarked-icon">
              <LogIn size={26} />
            </div>
            <div className="state-unmarked-text">
              <h3>Not marked yet</h3>
              <p>
                Click <strong>Mark In</strong> when you arrive at the university or research lab.
                The current time will be automatically recorded.
              </p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label htmlFor="mark-in-time" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  In Time:
                </label>
                <input
                  id="mark-in-time"
                  type="time"
                  className="input-control"
                  style={{ width: '130px', fontFamily: 'var(--font-mono)' }}
                  defaultValue={getCurrentTimeString(currentTime)}
                  onChange={(e) => setCustomTime(e.target.value)}
                />
              </div>

              <button
                type="button"
                id="btn-mark-in"
                className="btn btn-primary btn-large"
                onClick={handleMarkInClick}
                disabled={isSubmitting || isLoading}
              >
                <LogIn size={18} />
                <span>{isSubmitting ? 'Recording...' : 'Mark In'}</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 2: MARKED IN, NOT OUT */}
        {isMarkedIn && !isMarkedOut && (
          <div>
            <div className="state-grid-info">
              <div className="info-box">
                <div className="info-box-label">Status</div>
                <div className="info-box-value" style={{ color: 'var(--status-present-accent)' }}>
                  Present
                </div>
              </div>

              <div className="info-box">
                <div className="info-box-label">In Time</div>
                <div className="info-box-value">
                  {formatTimeDisplay(todayRecord!.in_time)}
                </div>
              </div>

              <div className="info-box">
                <div className="info-box-label">Out Time</div>
                <div className="info-box-value" style={{ color: 'var(--text-muted)' }}>
                  Active (in lab)
                </div>
              </div>

              <div className="info-box">
                <div className="info-box-label">Current Duration</div>
                <div className="info-box-value" style={{ color: 'var(--primary)' }}>
                  Ongoing
                </div>
              </div>
            </div>

            {todayRecord!.notes && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                <strong>Today's Notes:</strong> {todayRecord!.notes}
              </div>
            )}

            <div className="today-actions">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <label htmlFor="mark-out-time" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Out Time:
                </label>
                <input
                  id="mark-out-time"
                  type="time"
                  className="input-control"
                  style={{ width: '130px', fontFamily: 'var(--font-mono)' }}
                  defaultValue={getCurrentTimeString(currentTime)}
                  onChange={(e) => setCustomTime(e.target.value)}
                />
              </div>

              <button
                type="button"
                id="btn-mark-out"
                className="btn btn-primary btn-large"
                onClick={handleMarkOutClick}
                disabled={isSubmitting || isLoading}
              >
                <LogOut size={18} />
                <span>{isSubmitting ? 'Recording Out...' : 'Mark Out'}</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onEditToday(todayRecord!)}
                title="Edit today's in-time or notes"
              >
                <Edit3 size={16} />
                <span>Edit Today</span>
              </button>
            </div>
          </div>
        )}

        {/* STATE 3: ATTENDANCE COMPLETED (BOTH IN & OUT MARKED) */}
        {isCompleted && (
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: 'var(--status-present-accent)',
                marginBottom: '1rem',
                fontWeight: 600,
                fontSize: '0.95rem'
              }}
            >
              <CheckCircle2 size={20} />
              <span>Attendance completed for today</span>
            </div>

            <div className="state-grid-info">
              <div className="info-box">
                <div className="info-box-label">Status</div>
                <div className="info-box-value" style={{ color: 'var(--status-present-accent)' }}>
                  {todayRecord!.status}
                </div>
              </div>

              <div className="info-box">
                <div className="info-box-label">In Time</div>
                <div className="info-box-value">
                  {formatTimeDisplay(todayRecord!.in_time)}
                </div>
              </div>

              <div className="info-box">
                <div className="info-box-label">Out Time</div>
                <div className="info-box-value">
                  {formatTimeDisplay(todayRecord!.out_time)}
                </div>
              </div>

              <div className="info-box">
                <div className="info-box-label">Total Duration</div>
                <div className="info-box-value" style={{ color: 'var(--primary)' }}>
                  {formatDuration(todayRecord!.duration_minutes)}
                </div>
              </div>
            </div>

            {todayRecord!.notes && (
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
                <strong>Today's Notes:</strong> {todayRecord!.notes}
              </div>
            )}

            <div className="today-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onEditToday(todayRecord!)}
              >
                <Edit3 size={16} />
                <span>Edit Record</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
