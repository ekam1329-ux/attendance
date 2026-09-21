/**
 * Utility functions for time and duration calculations
 */

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;

  const trimmed = timeStr.trim();

  // Check for 12-hour format e.g. "09:32 AM" or "05:14 PM"
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (match12) {
    let hours = parseInt(match12[1], 10);
    const minutes = parseInt(match12[2], 10);
    const period = match12[4].toUpperCase();

    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  }

  // Check for 24-hour format e.g. "09:32" or "09:32:00"
  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (match24) {
    const hours = parseInt(match24[1], 10);
    const minutes = parseInt(match24[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}

function calculateDurationMinutes(inTimeStr, outTimeStr) {
  const inMin = parseTimeToMinutes(inTimeStr);
  const outMin = parseTimeToMinutes(outTimeStr);

  if (inMin === null || outMin === null) {
    return 0;
  }

  let diff = outMin - inMin;
  // Handle overnight shift (e.g. In at 22:00, Out at 04:00)
  if (diff < 0) {
    diff += 24 * 60;
  }

  return Math.max(0, diff);
}

function formatMinutesToDuration(minutes) {
  if (!minutes || minutes <= 0) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

function normalizeTime(timeStr) {
  if (!timeStr) return '';
  const trimmed = timeStr.trim();
  // Return consistent 24-hour HH:MM format if valid
  const min = parseTimeToMinutes(trimmed);
  if (min === null) return trimmed;
  const h = Math.floor(min / 60).toString().padStart(2, '0');
  const m = (min % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
}

module.exports = {
  parseTimeToMinutes,
  calculateDurationMinutes,
  formatMinutesToDuration,
  normalizeTime
};
