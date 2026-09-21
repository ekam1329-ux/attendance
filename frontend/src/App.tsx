import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar as CalendarIcon,
  Table as TableIcon,
  AlertCircle,
  Database,
  CloudOff,
  Plus
} from 'lucide-react';
import { AttendanceRecord, AttendanceStats, FilterOptions, User } from './types';
import { api, getBackendStatus } from './services/api';
import { getTodayDateString } from './utils/dateUtils';
import { Navbar } from './components/Navbar';
import { TodayCard } from './components/TodayCard';
import { DashboardStats } from './components/DashboardStats';
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
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(true);
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
      // Check backend health
      const isOnline = await api.checkHealth();
      setIsBackendOnline(isOnline);

      // Load today's record
      const today = await api.getTodayAttendance();
      setTodayRecord(today);

      // Load filtered records
      const recordList = await api.getAttendance(filters);
      setRecords(recordList);

      // Load stats for current filter month
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

  // Initial user check and data load
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
        {/* Important Scope Disclaimer & Backend Status Banner */}
        <aside className="disclaimer-banner" role="note">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <AlertCircle size={18} className="disclaimer-icon" />
            <div>
              <strong>Personal Record-Keeping Only:</strong> This application is for personal attendance
              remembrance. It is <strong>NOT</strong> connected to any university biometric machine or
              fingerprint/RFID system. Actual attendance happens physically at the university.
            </div>
          </div>

          <div
            className={`connection-badge ${isBackendOnline ? 'connected' : 'offline'}`}
            title={
              isBackendOnline
                ? 'Connected to Express & SQLite Database'
                : 'Offline / Demo Storage Mode'
            }
          >
            {isBackendOnline ? (
              <>
                <Database size={13} />
                <span>API Database Connected</span>
              </>
            ) : (
              <>
                <CloudOff size={13} />
                <span>Offline Demo Mode</span>
              </>
            )}
          </div>
        </aside>

        {/* Prominent Mark Today's Attendance Section */}
        <TodayCard
          todayRecord={todayRecord}
          onMarkIn={handleMarkIn}
          onMarkOut={handleMarkOut}
          onEditToday={handleOpenEditModal}
          isLoading={isLoading}
        />

        {/* Statistics & Monthly Summary */}
        <DashboardStats
          stats={stats}
          currentMonthStr={filters.month || getTodayDateString().slice(0, 7)}
        />

        {/* View Switcher Tabs (Table View / Calendar View) */}
        <div className="view-tabs">
          <button
            type="button"
            className={`tab-btn ${activeTab === 'table' ? 'active' : ''}`}
            onClick={() => setActiveTab('table')}
          >
            <TableIcon size={16} />
            <span>Attendance Table</span>
          </button>

          <button
            type="button"
            className={`tab-btn ${activeTab === 'calendar' ? 'active' : ''}`}
            onClick={() => setActiveTab('calendar')}
          >
            <CalendarIcon size={16} />
            <span>Calendar View</span>
          </button>
        </div>

        {/* Active Tab View */}
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
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div>
            <strong>PhD Attendance Record</strong> &bull; Personal Attendance Remembrance System
          </div>
          <div style={{ marginTop: '0.25rem', color: 'var(--text-muted)' }}>
            Designed for PhD Researchers &bull; Decoupled from University Biometrics &bull; Manual Data Entry
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

      {/* Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
};
