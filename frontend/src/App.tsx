import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Table as TableIcon,
  Plus,
  Download,
  CheckCircle2,
  Clock,
  CalendarDays
} from 'lucide-react';
import { AttendanceRecord, AttendanceStats, FilterOptions, User } from './types';
import { api } from './services/api';
import { getTodayDateString, getMonthYearDisplay } from './utils/dateUtils';
import { Navbar } from './components/Navbar';
import { TodayCard } from './components/TodayCard';
import { AttendanceTable } from './components/AttendanceTable';
import { CalendarView } from './components/CalendarView';
import { AttendanceModal } from './components/AttendanceModal';
import { ConfirmDialog } from './components/ConfirmDialog';
import { ExportModal } from './components/ExportModal';
import { LoginModal } from './components/LoginModal';
import { ToastContainer, ToastMessage } from './components/Toast';

export const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('phd_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('phd_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'));
  };

  // Data states
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [todayRecord, setTodayRecord] = useState<AttendanceRecord | null>(null);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Tab & Filter states
  const [activeTab, setActiveTab] = useState<'table' | 'calendar'>('table');
  const [filters, setFilters] = useState<FilterOptions>({
    month: getTodayDateString().slice(0, 7),
    status: 'All',
    search: '',
    startDate: '',
    endDate: '',
    sort: 'desc'
  });

  // Modal states
  const [isAttendanceModalOpen, setIsAttendanceModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<AttendanceRecord | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<string | undefined>(undefined);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = useCallback((type: 'success' | 'error' | 'info', message: string) => {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Fetch all attendance data
  const loadData = useCallback(async (showRefreshingSpinner = false) => {
    if (showRefreshingSpinner) setIsRefreshing(true);
    try {
      // Load today's record
      const today = await api.getTodayAttendance();
      setTodayRecord(today);

      // Load filtered records
      const recordList = await api.getAttendance(filters);
      setRecords(recordList);

      // Load stats
      const currentMonthStr = filters.month || getTodayDateString().slice(0, 7);
      const statData = await api.getStats(currentMonthStr);
      setStats(statData);
    } catch (err: any) {
      console.error('Failed to load attendance data:', err);
      addToast('error', err.message || 'Error fetching attendance records.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [filters, addToast]);

  useEffect(() => {
    api.getCurrentUser().then(setUser);
    loadData();
  }, [loadData]);

  // Quick Mark In Handler
  const handleMarkIn = async (inTime: string, notes?: string) => {
    try {
      const record = await api.markIn(inTime, notes);
      setTodayRecord(record);
      addToast('success', `Marked In at ${inTime}. Status: Present.`);
      loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to mark in.');
      throw err;
    }
  };

  // Quick Mark Out Handler
  const handleMarkOut = async (outTime: string, notes?: string) => {
    try {
      const record = await api.markOut(outTime, notes);
      setTodayRecord(record);
      addToast('success', `Marked Out at ${outTime}. Total duration recorded.`);
      loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to mark out.');
      throw err;
    }
  };

  // Save Record (Add or Edit)
  const handleSaveRecord = async (data: Partial<AttendanceRecord>) => {
    try {
      if (recordToEdit) {
        await api.updateAttendance(recordToEdit.id, data);
        addToast('success', `Attendance for ${data.date} updated successfully.`);
      } else {
        await api.createAttendance(data);
        addToast('success', `Attendance for ${data.date} added successfully.`);
      }
      loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save record.');
      throw err;
    }
  };

  // Delete Record Handler
  const handleDeleteRecord = async () => {
    if (!recordToDelete) return;
    try {
      await api.deleteAttendance(recordToDelete.id);
      addToast('info', `Attendance record for ${recordToDelete.date} deleted.`);
      setIsDeleteDialogOpen(false);
      setRecordToDelete(null);
      loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete record.');
    }
  };

  // Login Handler
  const handleLogin = async (u: string, p: string) => {
    const loggedInUser = await api.login(u, p);
    setUser(loggedInUser);
    addToast('success', `Welcome, ${loggedInUser.fullName || loggedInUser.username}`);
    loadData();
    return loggedInUser;
  };

  const handleLogout = () => {
    api.logout();
    setUser(null);
    addToast('info', 'Logged out.');
    loadData();
  };

  // Modal triggers
  const handleOpenAddModal = (dateStr?: string) => {
    setRecordToEdit(null);
    setModalInitialDate(dateStr);
    setIsAttendanceModalOpen(true);
  };

  const handleOpenEditModal = (record: AttendanceRecord) => {
    setRecordToEdit(record);
    setIsAttendanceModalOpen(true);
  };

  const handlePromptDelete = (record: AttendanceRecord) => {
    setRecordToDelete(record);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="app-layout">
      {/* Navbar */}
      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        user={user}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onRefresh={() => loadData(true)}
        isRefreshing={isRefreshing}
      />

      <main className="main-content">
        {/* 1. TOP SECTION: MARK TODAY'S ATTENDANCE WITH DATE AND TIME */}
        <TodayCard
          todayRecord={todayRecord}
          onMarkIn={handleMarkIn}
          onMarkOut={handleMarkOut}
          onEditToday={handleOpenEditModal}
          isLoading={isLoading}
        />

        {/* 2. COMPACT SUMMARY BAR */}
        {stats && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1.25rem',
              marginBottom: '1.75rem',
              fontSize: '0.875rem'
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CheckCircle2 size={16} style={{ color: 'var(--status-present-accent)' }} />
                <span>
                  Total Present: <strong style={{ color: 'var(--status-present-accent)' }}>{stats.overall.presentDays}</strong> days
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <CalendarDays size={16} style={{ color: 'var(--primary)' }} />
                <span>
                  This Month ({getMonthYearDisplay(filters.month)}): <strong>{stats.currentMonth.present}</strong> present
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Clock size={16} style={{ color: 'var(--text-secondary)' }} />
                <span>
                  Avg Daily Hours: <strong>{stats.overall.avgDurationFormatted || '0h 0m'}</strong>
                </span>
              </div>
            </div>

            {/* Quick Tab switcher for View */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setActiveTab('table')}
              >
                <TableIcon size={14} />
                <span>Table</span>
              </button>

              <button
                type="button"
                className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setActiveTab('calendar')}
              >
                <CalendarIcon size={14} />
                <span>Calendar</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. SECTION DIRECTLY BELOW: ATTENDANCE HISTORY */}
        <div style={{ marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Attendance History</h2>
          </div>

          {activeTab === 'table' ? (
            <AttendanceTable
              records={records}
              filters={filters}
              onFilterChange={setFilters}
              onEdit={handleOpenEditModal}
              onDelete={handlePromptDelete}
              onAddNew={() => handleOpenAddModal()}
              onOpenExport={() => setIsExportModalOpen(true)}
              isLoading={isLoading}
            />
          ) : (
            <CalendarView
              records={records}
              currentMonthStr={filters.month || getTodayDateString().slice(0, 7)}
              onMonthChange={(newMonth) => setFilters({ ...filters, month: newMonth })}
              onEditRecord={handleOpenEditModal}
              onAddForDate={(d) => handleOpenAddModal(d)}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div>
            <strong>PhD Attendance Record</strong> &bull; Personal Attendance Remembrance System
          </div>
        </div>
      </footer>

      {/* Modals & Dialogs */}
      <AttendanceModal
        isOpen={isAttendanceModalOpen}
        onClose={() => setIsAttendanceModalOpen(false)}
        recordToEdit={recordToEdit}
        initialDate={modalInitialDate}
        onSave={handleSaveRecord}
      />

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        title="Delete Attendance Record"
        message={`Are you sure you want to delete the record for ${recordToDelete?.date}? This action cannot be undone.`}
        confirmLabel="Delete Record"
        onConfirm={handleDeleteRecord}
        onCancel={() => {
          setIsDeleteDialogOpen(false);
          setRecordToDelete(null);
        }}
      />

      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        records={records}
      />

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLogin={handleLogin}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
