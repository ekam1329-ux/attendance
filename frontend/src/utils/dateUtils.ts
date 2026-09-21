/**
 * Date and time formatting utilities
 */

export function getTodayDateString(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getCurrentTimeString(date = new Date()): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function getDayName(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = String(d).padStart(2, '0');
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  return `${day} ${month} ${y}`;
}

export function formatFullDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const day = d;
  const month = date.toLocaleDateString('en-US', { month: 'long' });
  return `${weekday}, ${day} ${month} ${y}`;
}

export function formatTimeDisplay(timeStr: string | null): string {
  if (!timeStr) return '—';
  const trimmed = timeStr.trim();

  // Already 12-hour format e.g. "09:32 AM"
  if (/am|pm/i.test(trimmed)) return trimmed;

  const parts = trimmed.split(':');
  if (parts.length >= 2) {
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1].padStart(2, '0');
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${String(hours).padStart(2, '0')}:${minutes} ${period}`;
  }
  return trimmed;
}

export function parseTimeToMinutes(timeStr: string | null): number | null {
  if (!timeStr) return null;
  const trimmed = timeStr.trim();

  // Check 12-hour format e.g. "09:32 AM"
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[4].toUpperCase();
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  // Check 24-hour format e.g. "09:32"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}

export function calculateDurationMinutes(inTime: string | null, outTime: string | null): number {
  const inMin = parseTimeToMinutes(inTime);
  const outMin = parseTimeToMinutes(outTime);

  if (inMin === null || outMin === null) return 0;

  let diff = outMin - inMin;
  // Overnight shift support
  if (diff < 0) {
    diff += 24 * 60;
  }
  return Math.max(0, diff);
}

export function formatDuration(minutes: number): string {
  if (!minutes || minutes <= 0) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function getMonthYearDisplay(yearMonthStr: string): string {
  if (!yearMonthStr) return '';
  const [y, m] = yearMonthStr.split('-').map(Number);
  const date = new Date(y, m - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function getWeekdaysCountInMonth(year: number, monthZeroIndexed: number): number {
  const daysInMonth = new Date(year, monthZeroIndexed + 1, 0).getDate();
  let count = 0;
  for (let d = 1; d <= daysInMonth; d++) {
    const dayOfWeek = new Date(year, monthZeroIndexed, d).getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      count++;
    }
  }
  return count;
}
