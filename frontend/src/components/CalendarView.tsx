import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Edit3, X, Clock } from 'lucide-react';
import { AttendanceRecord } from '../types';
import {
  formatDateDisplay,
  formatFullDateDisplay,
  formatTimeDisplay,
  formatDuration,
  getTodayDateString
} from '../utils/dateUtils';

interface CalendarViewProps {
  records: AttendanceRecord[];
  currentMonthStr: string; // YYYY-MM
  onMonthChange: (newMonthStr: string) => void;
  onEditRecord: (record: AttendanceRecord) => void;
  onAddForDate: (dateStr: string) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  records,
  currentMonthStr,
  onMonthChange,
  onEditRecord,
  onAddForDate
}) => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const [year, month] = currentMonthStr.split('-').map(Number);
  const todayStr = getTodayDateString();

  // Navigation handlers
  const handlePrevMonth = () => {
    let newM = month - 1;
    let newY = year;
    if (newM < 1) {
      newM = 12;
      newY -= 1;
    }
    onMonthChange(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  const handleNextMonth = () => {
    let newM = month + 1;
    let newY = year;
    if (newM > 12) {
      newM = 1;
      newY += 1;
    }
    onMonthChange(`${newY}-${String(newM).padStart(2, '0')}`);
  };

  // Calendar Grid Calculation
  // First day of month (0 = Sun, 1 = Mon, ..., 6 = Sat)
  const firstDayObj = new Date(year, month - 1, 1);
  let firstDayOfWeek = firstDayObj.getDay(); // 0 is Sun
  // Convert so Monday is 0, Sunday is 6
  let startingCol = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const daysInMonth = new Date(year, month, 0).getDate();
  const daysInPrevMonth = new Date(year, month - 1, 0).getDate();

  // Build grid items (42 cells: 6 weeks)
  const calendarCells: Array<{
    dateStr: string;
    dayNumber: number;
    isCurrentMonth: boolean;
    isToday: boolean;
    record?: AttendanceRecord;
  }> = [];

  // Previous month trailing days
  for (let i = startingCol - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const dateStr = `${prevYear}-${String(prevMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr
    });
  }

  // Current month days
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const record = records.find(r => r.date === dateStr);
    calendarCells.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayStr,
      record
    });
  }

  // Next month leading days to complete the 35 or 42 grid
  const remainingCells = 35 - calendarCells.length;
  const totalNeeded = remainingCells < 0 ? 42 - calendarCells.length : remainingCells;
  for (let d = 1; d <= totalNeeded; d++) {
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;
    const dateStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      isToday: dateStr === todayStr
    });
  }

  const selectedRecord = selectedDate ? records.find(r => r.date === selectedDate) : null;
  const monthName = firstDayObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div className="calendar-card">
      <div className="calendar-header">
        <h2 className="calendar-month-title">{monthName}</h2>

        <div className="calendar-nav-buttons">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={handlePrevMonth}
            style={{ padding: '0.45rem 0.75rem' }}
          >
            <ChevronLeft size={16} />
            <span>Prev</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => onMonthChange(getTodayDateString().slice(0, 7))}
            style={{ padding: '0.45rem 0.75rem' }}
          >
            <span>Current Month</span>
          </button>

          <button
            type="button"
            className="btn btn-secondary"
            onClick={handleNextMonth}
            style={{ padding: '0.45rem 0.75rem' }}
          >
            <span>Next</span>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Weekday headers: Mon - Sun */}
      <div className="calendar-grid" style={{ marginBottom: '0.5rem' }}>
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="calendar-day-header">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {calendarCells.map((cell) => {
          return (
            <div
              key={cell.dateStr}
              className={`calendar-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${cell.isToday ? 'today' : ''}`}
              onClick={() => setSelectedDate(cell.dateStr)}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="calendar-cell-date">{cell.dayNumber}</span>
                {cell.isToday && (
                  <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 700 }}>
                    TODAY
                  </span>
                )}
              </div>

              {cell.record && (
                <div>
                  <div className={`calendar-cell-badge status-${cell.record.status}`}>
                    {cell.record.status}
                  </div>
                  {cell.record.duration_minutes > 0 && (
                    <div className="calendar-cell-duration">
                      {formatDuration(cell.record.duration_minutes)}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Date Detail Popover / Card */}
      {selectedDate && (
        <div
          style={{
            marginTop: '1.5rem',
            padding: '1.25rem',
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-strong)',
            position: 'relative'
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedDate(null)}
            style={{
              position: 'absolute',
              top: '0.75rem',
              right: '0.75rem',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)'
            }}
          >
            <X size={18} />
          </button>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '0.75rem' }}>
            {formatFullDateDisplay(selectedDate)}
          </h3>

          {selectedRecord ? (
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Status</div>
                  <span className={`status-badge status-${selectedRecord.status}`} style={{ marginTop: '0.2rem' }}>
                    {selectedRecord.status}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>In Time</div>
                  <div className="time-mono" style={{ fontWeight: 600 }}>{formatTimeDisplay(selectedRecord.in_time)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Out Time</div>
                  <div className="time-mono" style={{ fontWeight: 600 }}>{formatTimeDisplay(selectedRecord.out_time)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Duration</div>
                  <div className="time-mono" style={{ fontWeight: 600, color: 'var(--primary)' }}>
                    {formatDuration(selectedRecord.duration_minutes)}
                  </div>
                </div>
              </div>

              {selectedRecord.notes && (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                  <strong>Notes:</strong> {selectedRecord.notes}
                </div>
              )}

              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => onEditRecord(selectedRecord)}
              >
                <Edit3 size={15} />
                <span>Edit Record</span>
              </button>
            </div>
          ) : (
            <div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                No attendance recorded for this date.
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => onAddForDate(selectedDate)}
              >
                <Plus size={15} />
                <span>Log Attendance for {formatDateDisplay(selectedDate)}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
