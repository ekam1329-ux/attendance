import { AttendanceRecord, AttendanceStats, FilterOptions, User } from '../types';
import { getTodayDateString, calculateDurationMinutes } from '../utils/dateUtils';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

// Storage key for local auth token
const TOKEN_KEY = 'phd_attendance_token';
const OFFLINE_STORAGE_KEY = 'phd_attendance_offline_records_v1';

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

let isBackendAvailable = true;

export function getBackendStatus(): boolean {
  return isBackendAvailable;
}

// Initial seed data for offline preview mode if needed
function getOfflineRecords(): AttendanceRecord[] {
  const data = localStorage.getItem(OFFLINE_STORAGE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }

  // Initial sample records for a PhD researcher
  const samples: AttendanceRecord[] = [
    {
      id: 'att_demo_1',
      date: '2026-09-21',
      status: 'Present',
      in_time: '09:32',
      out_time: '17:14',
      duration_minutes: 462,
      notes: 'Lab experiments & literature review for thesis chapter 3'
    },
    {
      id: 'att_demo_2',
      date: '2026-09-18',
      status: 'Present',
      in_time: '09:15',
      out_time: '18:00',
      duration_minutes: 525,
      notes: 'Supervisor meeting and data analysis'
    },
    {
      id: 'att_demo_3',
      date: '2026-09-17',
      status: 'Present',
      in_time: '09:40',
      out_time: '16:50',
      duration_minutes: 430,
      notes: 'Paper revisions and experimental simulation'
    },
    {
      id: 'att_demo_4',
      date: '2026-09-16',
      status: 'Leave',
      in_time: null,
      out_time: null,
      duration_minutes: 0,
      notes: 'Medical leave approved'
    },
    {
      id: 'att_demo_5',
      date: '2026-09-15',
      status: 'Present',
      in_time: '09:05',
      out_time: '17:35',
      duration_minutes: 510,
      notes: 'Lab equipment calibration'
    },
    {
      id: 'att_demo_6',
      date: '2026-09-10',
      status: 'Holiday',
      in_time: null,
      out_time: null,
      duration_minutes: 0,
      notes: 'University foundation day'
    }
  ];
  localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(samples));
  return samples;
}

function saveOfflineRecords(records: AttendanceRecord[]) {
  localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(records));
}

// Fetch helper with token and error handling
async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${endpoint}`;
  const token = getAuthToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {})
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.error || `Request failed with status ${res.status}`);
    }

    isBackendAvailable = true;
    return await res.json();
  } catch (err: any) {
    // If backend connection fails (e.g. network error / CORS / standalone GitHub Pages preview), check fallback
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      isBackendAvailable = false;
    }
    throw err;
  }
}

// -------------------------------------------------------------
// Offline fallback implementation
// -------------------------------------------------------------
function offlineGetStats(records: AttendanceRecord[], month: string): AttendanceStats {
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

  const presentCount = overall.presentDays;
  if (presentCount > 0) {
    overall.avgDurationMinutes = Math.round(overall.totalDurationMinutes / presentCount);
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
// Public Attendance API
// -------------------------------------------------------------
export const api = {
  // Check backend health
  async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      isBackendAvailable = res.ok;
      return res.ok;
    } catch {
      isBackendAvailable = false;
      return false;
    }
  },

  // GET /api/attendance/today
  async getTodayAttendance(date = getTodayDateString()): Promise<AttendanceRecord | null> {
    try {
      const data = await fetchApi<{ record: AttendanceRecord | null }>(`/api/attendance/today?date=${date}`);
      return data.record;
    } catch (err) {
      if (!isBackendAvailable) {
        const records = getOfflineRecords();
        return records.find(r => r.date === date) || null;
      }
      throw err;
    }
  },

  // GET /api/attendance
  async getAttendance(filters?: Partial<FilterOptions>): Promise<AttendanceRecord[]> {
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
      if (!isBackendAvailable) {
        let records = [...getOfflineRecords()];
        if (filters?.month) {
          records = records.filter(r => r.date.startsWith(filters.month!));
        }
        if (filters?.status && filters.status !== 'All') {
          records = records.filter(r => r.status === filters.status);
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase();
          records = records.filter(r => (r.notes || '').toLowerCase().includes(q) || r.status.toLowerCase().includes(q));
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
      }
      throw err;
    }
  },

  // GET /api/attendance/stats
  async getStats(month: string): Promise<AttendanceStats> {
    try {
      const data = await fetchApi<AttendanceStats>(`/api/attendance/stats?month=${month}`);
      return data;
    } catch (err) {
      if (!isBackendAvailable) {
        return offlineGetStats(getOfflineRecords(), month);
      }
      throw err;
    }
  },

  // POST /api/attendance/mark-in
  async markIn(inTime: string, notes?: string, date = getTodayDateString()): Promise<AttendanceRecord> {
    try {
      const data = await fetchApi<{ message: string; record: AttendanceRecord }>('/api/attendance/mark-in', {
        method: 'POST',
        body: JSON.stringify({ in_time: inTime, notes, date })
      });
      return data.record;
    } catch (err) {
      if (!isBackendAvailable) {
        const records = getOfflineRecords();
        const existing = records.find(r => r.date === date);
        if (existing) {
          throw new Error(`Attendance for ${date} has already been marked (${existing.status}, In: ${existing.in_time || 'N/A'}). Use Edit to adjust timings.`);
        }
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
        saveOfflineRecords(records);
        return newRecord;
      }
      throw err;
    }
  },

  // POST /api/attendance/mark-out
  async markOut(outTime: string, notes?: string, date = getTodayDateString()): Promise<AttendanceRecord> {
    try {
      const data = await fetchApi<{ message: string; record: AttendanceRecord }>('/api/attendance/mark-out', {
        method: 'POST',
        body: JSON.stringify({ out_time: outTime, notes, date })
      });
      return data.record;
    } catch (err) {
      if (!isBackendAvailable) {
        const records = getOfflineRecords();
        const idx = records.findIndex(r => r.date === date);
        if (idx === -1) {
          throw new Error(`Cannot Mark Out: No attendance record found for ${date}. Please click "Mark In" first.`);
        }
        const existing = records[idx];
        if (!existing.in_time) {
          throw new Error(`Cannot Mark Out: No In-Time found for ${date}. Please edit the record first.`);
        }
        if (existing.out_time) {
          throw new Error(`You have already marked out for ${date} at ${existing.out_time}. Use Edit to adjust timings.`);
        }

        const duration = calculateDurationMinutes(existing.in_time, outTime);
        const updatedRecord: AttendanceRecord = {
          ...existing,
          out_time: outTime,
          duration_minutes: duration,
          notes: notes !== undefined ? notes : existing.notes
        };
        records[idx] = updatedRecord;
        saveOfflineRecords(records);
        return updatedRecord;
      }
      throw err;
    }
  },

  // POST /api/attendance (Manual create)
  async createAttendance(data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    try {
      const res = await fetchApi<{ message: string; record: AttendanceRecord }>('/api/attendance', {
        method: 'POST',
        body: JSON.stringify(data)
      });
      return res.record;
    } catch (err) {
      if (!isBackendAvailable) {
        const records = getOfflineRecords();
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
        saveOfflineRecords(records);
        return newRec;
      }
      throw err;
    }
  },

  // PUT /api/attendance/:id (Manual update)
  async updateAttendance(id: string, data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
    try {
      const res = await fetchApi<{ message: string; record: AttendanceRecord }>(`/api/attendance/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return res.record;
    } catch (err) {
      if (!isBackendAvailable) {
        const records = getOfflineRecords();
        const idx = records.findIndex(r => r.id === id);
        if (idx === -1) throw new Error('Record not found');

        // Check if date changed and conflicts
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
        saveOfflineRecords(records);
        return updated;
      }
      throw err;
    }
  },

  // DELETE /api/attendance/:id
  async deleteAttendance(id: string): Promise<void> {
    try {
      await fetchApi<{ message: string }>(`/api/attendance/${id}`, {
        method: 'DELETE'
      });
    } catch (err) {
      if (!isBackendAvailable) {
        let records = getOfflineRecords();
        records = records.filter(r => r.id !== id);
        saveOfflineRecords(records);
        return;
      }
      throw err;
    }
  },

  // Auth: Login
  async login(username: string, password: string): Promise<User> {
    const data = await fetchApi<{ message: string; token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
    setAuthToken(data.token);
    return data.user;
  },

  // Auth: Current user
  async getCurrentUser(): Promise<User | null> {
    const token = getAuthToken();
    if (!token) return null;
    try {
      const data = await fetchApi<{ user: User }>('/api/auth/me');
      return data.user;
    } catch {
      setAuthToken(null);
      return null;
    }
  },

  logout() {
    setAuthToken(null);
  }
};
