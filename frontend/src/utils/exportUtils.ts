import { AttendanceRecord } from '../types';
import { formatDateDisplay, formatTimeDisplay, formatDuration, getDayName } from './dateUtils';

export function exportToCSV(records: AttendanceRecord[], filenamePrefix = 'phd_attendance_records') {
  const headers = ['Date', 'Day', 'Status', 'In Time', 'Out Time', 'Duration', 'Notes'];

  const rows = records.map(r => {
    const dateFormatted = formatDateDisplay(r.date);
    const day = getDayName(r.date);
    const status = r.status;
    const inTime = formatTimeDisplay(r.in_time);
    const outTime = formatTimeDisplay(r.out_time);
    const duration = formatDuration(r.duration_minutes);
    // Escape quotes and commas in notes
    const notes = `"${(r.notes || '').replace(/"/g, '""')}"`;

    return [dateFormatted, day, status, inTime, outTime, duration, notes].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportToJSON(records: AttendanceRecord[], filenamePrefix = 'phd_attendance_records') {
  const exportData = {
    exportDate: new Date().toISOString(),
    system: 'PhD Attendance Record - Personal Manual Tracker',
    disclaimer: 'Personal remembrance records only. NOT an official biometric university attendance certification.',
    recordCount: records.length,
    records: records.map(r => ({
      date: r.date,
      formattedDate: formatDateDisplay(r.date),
      day: getDayName(r.date),
      status: r.status,
      inTime: formatTimeDisplay(r.in_time),
      outTime: formatTimeDisplay(r.out_time),
      durationMinutes: r.duration_minutes,
      durationFormatted: formatDuration(r.duration_minutes),
      notes: r.notes || ''
    }))
  };

  const jsonString = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportData, null, 2));
  const link = document.createElement('a');
  link.setAttribute('href', jsonString);
  link.setAttribute('download', `${filenamePrefix}_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
