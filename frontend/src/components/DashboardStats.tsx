import React from 'react';
import { CheckCircle2, XCircle, Coffee, Clock, CalendarDays, BarChart3 } from 'lucide-react';
import { AttendanceStats } from '../types';
import { getMonthYearDisplay, getWeekdaysCountInMonth } from '../utils/dateUtils';

interface DashboardStatsProps {
  stats: AttendanceStats | null;
  currentMonthStr: string; // YYYY-MM
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats, currentMonthStr }) => {
  if (!stats) return null;

  const { overall, currentMonth } = stats;

  // Calculate working days in current month to estimate personal attendance rate
  const [year, month] = currentMonthStr.split('-').map(Number);
  const workingDaysInMonth = getWeekdaysCountInMonth(year, month - 1);
  const monthPercentage = workingDaysInMonth > 0
    ? Math.min(100, Math.round((currentMonth.present / workingDaysInMonth) * 100))
    : 0;

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div className="stats-grid">
        {/* Total Present Days */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Total Present</span>
            <div className="stat-icon" style={{ background: 'var(--status-present-bg)', color: 'var(--status-present-accent)' }}>
              <CheckCircle2 size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--status-present-accent)' }}>
            {overall.presentDays}
          </div>
          <div className="stat-subtext">
            Out of {overall.totalRecords} total logged records
          </div>
        </div>

        {/* Current Month Present */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">This Month</span>
            <div className="stat-icon" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
              <CalendarDays size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--primary)' }}>
            {currentMonth.present}
          </div>
          <div className="stat-subtext">
            {monthPercentage}% of ~{workingDaysInMonth} workdays ({getMonthYearDisplay(currentMonthStr)})
          </div>
        </div>

        {/* Average Working Hours */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Avg Daily Hours</span>
            <div className="stat-icon" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
              <Clock size={18} />
            </div>
          </div>
          <div className="stat-value">
            {overall.avgDurationFormatted || '0h 0m'}
          </div>
          <div className="stat-subtext">
            Month avg: {currentMonth.avgDurationFormatted || '0h 0m'}
          </div>
        </div>

        {/* Leaves & Absences */}
        <div className="stat-card">
          <div className="stat-header">
            <span className="stat-title">Leaves / Absences</span>
            <div className="stat-icon" style={{ background: 'var(--status-leave-bg)', color: 'var(--status-leave-accent)' }}>
              <Coffee size={18} />
            </div>
          </div>
          <div className="stat-value" style={{ color: 'var(--status-leave-accent)' }}>
            {overall.leaveDays + overall.absentDays}
          </div>
          <div className="stat-subtext">
            {overall.leaveDays} Leaves, {overall.absentDays} Absents, {overall.holidayDays} Holidays
          </div>
        </div>
      </div>

      {/* Monthly Summary Box */}
      <div
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '0.85rem 1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          fontSize: '0.85rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
          <BarChart3 size={17} style={{ color: 'var(--primary)' }} />
          <span>Monthly Summary ({getMonthYearDisplay(currentMonthStr)}):</span>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.25rem', color: 'var(--text-secondary)' }}>
          <span>Present: <strong style={{ color: 'var(--status-present-accent)' }}>{currentMonth.present}</strong></span>
          <span>Absent: <strong style={{ color: 'var(--status-absent-accent)' }}>{currentMonth.absent}</strong></span>
          <span>Leave: <strong style={{ color: 'var(--status-leave-accent)' }}>{currentMonth.leave}</strong></span>
          <span>Holiday: <strong style={{ color: 'var(--status-holiday-accent)' }}>{currentMonth.holiday}</strong></span>
          <span>Avg Duration: <strong style={{ color: 'var(--text-primary)' }}>{currentMonth.avgDurationFormatted}</strong></span>
        </div>
      </div>
    </div>
  );
};
