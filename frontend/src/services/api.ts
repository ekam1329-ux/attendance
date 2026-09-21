import { AttendanceRecord, AttendanceStats, FilterOptions, User } from '../types';
import { getTodayDateString, calculateDurationMinutes } from '../utils/dateUtils';

const CONFIGURED_API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

// If running on a hosted domain (e.g. GitHub Pages) without an external API URL, use pure local storage
const isHostedWithoutBackend =
  typeof window !== 'undefined' &&
  !CONFIGURED_API_BASE &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1';

const API_BASE = CONFIGURED_API_BASE;
const STORAGE_KEY = 'phd_attendance_records_store_v2';
const TOKEN_KEY = 'phd_attendance_token';

let isBackendAvailable = !isHostedWithoutBackend;

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setAuthToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

// -------------------------------------------------------------
// Persistent Local Data Store (Always works on GitHub Pages & Offline)
// -------------------------------------------------------------
function getStoredRecords(): AttendanceRecord[] {
  const data = localStorage.getItem(STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }

  // Initial seed with today's record
  const today = getTodayDateString();
  const initialRecords: AttendanceRecord[] = [
    {
      id: 'att_seed_' + Date.now(),
      date: today,
      status: 'Present',
      in_time: '09:32',
      out_time: '17:14',
      duration_minutes: 462,
      notes: 'Lab experiments & research record'
    }
  ];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRecords));
  return initialRecords;
}

function saveStoredRecords(records: AttendanceRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function computeStats(records: AttendanceRecord[], month: string): AttendanceStats {
  const overall = {
    totalRecords: records.length,
    presentDays: records.filter(r => r.status === 'Present').length,
    absentDays: records.filter(r => r.status === 'Absent').length,
    leaveDays: records.filter(r => r.status === 'Leave').length,
    holidayDays: records.filter(r => r.status === 'Holiday').length,
    totalDurationMinutes: records.reduce((sum, r) => sum + (r.duration_minutes || 0), 0),
    avgDurationMinutes: 0,
    avgDurationFormatted: '0h 0m'
  };

  if (overall.presentDays > 0) {
    overall.avgDurationMinutes = Math.round(overall.totalDurationMinutes / overall.presentDays);
    const h = Math.floor(overall.avgDurationMinutes / 60);
    const m = overall.avgDurationMinutes % 60;
    overall.avgDurationFormatted = `${h}h ${m}m`;
  }

  const monthRecords = records.filter(r => r.date.startsWith(month));
  const monthPresent = monthRecords.filter(r => r.status === 'Present').length;
  const monthDuration = monthRecords.reduce((sum, r) => sum + (r.duration_minutes || 0), 0);
  const monthAvgMin = monthPresent > 0 ? Math.round(monthDuration / monthPresent) : 0;
  const mh = Math.floor(monthAvgMin / 60);
  const mm = monthAvgMin % 60;

  const currentMonth = {
    month,
    totalRecords: monthRecords.length,
    present: monthPresent,
    absent: monthRecords.filter(r => r.status === 'Absent').length,
    leave: monthRecords.filter(r => r.status === 'Leave').length,
    holiday: monthRecords.filter(r => r.status === 'Holiday').length,
    avgDurationMinutes: monthAvgMin,
    avgDurationFormatted: `${mh}h ${mm}m`
  };

  return { overall, currentMonth };
}

// -------------------------------------------------------------
// Network Fetch with Automatic Local Fallback
// -------------------------------------------------------------
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (isHostedWithoutBackend) {
    throw new Error('OFFLINE_MODE');
  }

  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    throw new Error(`API_ERROR_${res.status}`);
  }

  return await res.json();
}

// -------------------------------------------------------------
// Public Attendance API
// -------------------------------------------------------------
export const api = {
  async checkHealth(): Promise<boolean> {
    if (isHostedWithoutBackend) {
      isBackendAvailable = false;
      return false;
    }
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      isBackendAvailable = res.ok;
      return res.ok;
    } catch {
      isBackendAvailable = false;
      return false;
    }
  },

  async getTodayAttendance(date = getTodayDateString()): Promise<AttendanceRecord | null> {
    if (isBackendAvailable && !isHostedWithoutBackend) {
      try {
        const data = await fetchApi<{ record: AttendanceRecord | null }>(`/api/attendance/today?date=${date}`);
        return data.record;
      } catch (err) {
        isBackendAvailable = false;
      }
    }

    // Always fallback to persistent local storage
    const records = getStoredRecords();
    return records.find(r => r.date === date) || null;
  },

  async getAttendance(filters?: Partial<FilterOptions>): Promise<AttendanceRecord[]> {
    if (isBackendAvailable && !isHostedWithoutBackend) {
      try {
        const params = new URLSearchParams();
        if (filters?.month) params.append('month', filters.month);
        if (filters?.status) params.append('status', filters.status);
        if (filters?.search) params.append('search', filters.search);
        if (filters?.startDate) params.append('startDate', filters.startDate);
        if (filters?.endDate) params.append('endDate', filters.endDate);
        if (filters?.sort) params.append('sort', filters.sort);

        const qs = params.toString() ? `?${params.toString()}` : '';
        const data = await fetchApi<{ records: AttendanceRecord[] }>(`/api/attendance${qs}`);
        return data.records;
      } catch (err) {
        isBackendAvailable = false;
      }
    }

    // Always fallback to persistent local storage
    let records = [...getStoredRecords()];
    if (filters?.month) {
      records = records.filter(r => r.date.startsWith(filters.month!));
    }
    if (filters?.status && filters.status !== 'All') {
      records = records.filter(r => r.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      records = records.filter(
        r => (r.notes || '').toLowerCase().includes(q) || r.status.toLowerCase().includes(q)
      );
    }
    if (filters?.startDate) {
      records = records.filter(r => r.date >= filters.startDate!);
    }
    if (filters?.endDate) {
      records = records.filter(r => r.date <= filters.endDate!);
    }
    records.sort((a, b) => {
      return filters?.sort === 'asc'
        ? a.date.localeCompare(b.date)
        : b.date.localeCompare(a.date);
    });
    return records;
  },

  async getStats(month: string): Promise<AttendanceStats> {
    if (isBackendAvailable && !isHostedWithoutBackend) {
      try {
        return await fetchApi<AttendanceStats>(`/api/attendance/stats?month=${month}`);
      } catch (err) {
        isBackendAvailable = false;
      }
    }

    // Always fallback to persistent local storage
    return computeStats(getStoredRecords(), month);
  },

  async markIn(inTime: string, notes?: string, date = getTodayDateString()): Promise<AttendanceRecord> {
    if (isBackendAvailable && !isHostedWithoutBackend) {
      try {
        const data = await fetchApi<{ message: string; record: AttendanceRecord }>('/api/attendance/mark-in', {
          method: 'POST',
          body: JSON.stringify({ in_time: inTime, notes, date })
        });
        return data.record;
      } catch (err) {
        isBackendAvailable = false;
      }
    }

    // Always fallback to persistent local storage
    const records = getStoredRecords();
    const idx = records.findIndex(r => r.date === date);

    if (idx !== -1) {
      // Update existing record
      const existing = records[idx];
      const duration = existing.out_time ? calculateDurationMinutes(inTime, existing.out_time) : 0;
      const updated: AttendanceRecord = {
        ...existing,
        status: 'Present',
        in_time: inTime,
        duration_minutes: duration,
        notes: notes !== undefined && notes !== '' ? notes : existing.notes
      };
      records[idx] = updated;
      saveStoredRecords(records);
      return updated;
    }

    // Create new record
    const newRecord: AttendanceRecord = {
      id: 'att_' + Date.now(),
      date,
      status: 'Present',
      in_time: inTime,
      out_time: null,
      duration_minutes: 0,
      notes: notes || ''
    };

    records.unshift(newRecord);
    saveStoredRecords(records);
    return newRecord;
  },

  async markOut(outTime: string, notes?: string, date = getTodayDateString()): Promise<AttendanceRecord> {
    if (isBackendAvailable && !isHostedWithoutBackend) {
      try {
        const data = await fetchApi<{ message: string; record: AttendanceRecord }>('/api/attendance/mark-out', {
          method: 'POST',
          body: JSON.stringify({ out_time: outTime, notes, date })
        });
        return data.record;
      } catch (err) {
        isBackendAvailable = false;
      }
    }

    // Always fallback to persistent local storage
    const records = getStoredRecords();
    const idx = records.findIndex(r => r.date === date);

    if (idx !== -1) {
      // Update existing record
      const existing = records[idx];
      const inTimeToUse = existing.in_time || '09:00';
      const duration = calculateDurationMinutes(inTimeToUse, outTime);
      const updatedRecord: AttendanceRecord = {
        ...existing,
        in_time: inTimeToUse,
        out_time: outTime,
        duration_minutes: duration,
        notes: notes !== undefined && notes !== '' ? notes : existing.notes
      };

      records[idx] = updatedRecord;
      saveStoredRecords(records);
      return updatedRecord;
    }

    // If no record exists yet, create one with in_time set to 09:00 or current
    const defaultInTime = '09:00';
    const duration = calculateDurationMinutes(defaultInTime, outTime);
    const newRecord: AttendanceRecord = {
      id: 'att_' + Date.now(),
      date,
      status: 'Present',
      in_time: defaultInTime,
      out_time: outTime,
      duration_minutes: duration,
      notes: notes || ''
    };

    records.unshift(newRecord);
    saveStoredRecords(records);
    return newRecord;
  },

  async createAttendance(data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    if (isBackendAvailable && !isHostedWithoutBackend) {
      try {
        const res = await fetchApi<{ message: string; record: AttendanceRecord }>('/api/attendance', {
          method: 'POST',
          body: JSON.stringify(data)
        });
        return res.record;
      } catch (err) {
        isBackendAvailable = false;
      }
    }

    // Always fallback to persistent local storage
    const records = getStoredRecords();
    if (records.some(r => r.date === data.date)) {
      throw new Error(`A record already exists for date ${data.date}`);
    }

    const duration = calculateDurationMinutes(data.in_time || null, data.out_time || null);
    const newRec: AttendanceRecord = {
      id: 'att_' + Date.now(),
      date: data.date!,
      status: data.status || 'Present',
      in_time: data.in_time || null,
      out_time: data.out_time || null,
      duration_minutes: duration,
      notes: data.notes || ''
    };

    records.unshift(newRec);
    saveStoredRecords(records);
    return newRec;
  },

  async updateAttendance(id: string, data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    if (isBackendAvailable && !isHostedWithoutBackend) {
      try {
        const res = await fetchApi<{ message: string; record: AttendanceRecord }>(`/api/attendance/${id}`, {
          method: 'PUT',
          body: JSON.stringify(data)
        });
        return res.record;
      } catch (err) {
        isBackendAvailable = false;
      }
    }

    // Always fallback to persistent local storage
    const records = getStoredRecords();
    const idx = records.findIndex(r => r.id === id);
    if (idx === -1) throw new Error('Record not found');

    if (data.date && data.date !== records[idx].date && records.some(r => r.date === data.date && r.id !== id)) {
      throw new Error(`Another record already exists for ${data.date}`);
    }

    const normIn = data.in_time !== undefined ? data.in_time : records[idx].in_time;
    const normOut = data.out_time !== undefined ? data.out_time : records[idx].out_time;
    const duration = calculateDurationMinutes(normIn, normOut);

    const updated: AttendanceRecord = {
      ...records[idx],
      ...data,
      duration_minutes: duration
    };

    records[idx] = updated;
    saveStoredRecords(records);
    return updated;
  },

  async deleteAttendance(id: string): Promise<void> {
    if (isBackendAvailable && !isHostedWithoutBackend) {
      try {
        await fetchApi<{ message: string }>(`/api/attendance/${id}`, { method: 'DELETE' });
        return;
      } catch (err) {
        isBackendAvailable = false;
      }
    }

    // Always fallback to persistent local storage
    let records = getStoredRecords();
    records = records.filter(r => r.id !== id);
    saveStoredRecords(records);
  },

  async login(username: string, password: string): Promise<User> {
    const localUser: User = {
      id: 'scholar_' + Date.now(),
      username: username || 'researcher',
      fullName: 'PhD Scholar'
    };
    setAuthToken('token_' + Date.now());
    return localUser;
  },

  async getCurrentUser(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) return null;
    return {
      id: 'scholar_active',
      username: 'researcher',
      fullName: 'PhD Scholar'
    };
  },

  logout() {
    setAuthToken(null);
  }
};
