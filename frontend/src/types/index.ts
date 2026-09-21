export type AttendanceStatus = 'Present' | 'Absent' | 'Leave' | 'Holiday';

export interface AttendanceRecord {
  id: string;
  user_id?: string;
  date: string; // YYYY-MM-DD
  status: AttendanceStatus;
  in_time: string | null; // HH:MM or HH:MM:SS or 12h
  out_time: string | null;
  duration_minutes: number;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AttendanceStats {
  overall: {
    totalRecords: number;
    presentDays: number;
    absentDays: number;
    leaveDays: number;
    holidayDays: number;
    totalDurationMinutes: number;
    avgDurationMinutes: number;
    avgDurationFormatted: string;
  };
  currentMonth: {
    month: string;
    totalRecords: number;
    present: number;
    absent: number;
    leave: number;
    holiday: number;
    avgDurationMinutes: number;
    avgDurationFormatted: string;
  };
}

export interface User {
  id: string;
  username: string;
  fullName: string;
}

export interface FilterOptions {
  month: string;
  status: string;
  search: string;
  startDate: string;
  endDate: string;
  sort: 'desc' | 'asc';
}
