import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, Check, AlertCircle } from 'lucide-react';
import { AttendanceRecord, AttendanceStatus } from '../types';
import {
  calculateDurationMinutes,
  formatDuration,
  getCurrentTimeString,
  getTodayDateString
} from '../utils/dateUtils';

interface AttendanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit: AttendanceRecord | null;
  initialDate?: string;
  onSave: (data: Partial<AttendanceRecord>) => Promise<void>;
}

export const AttendanceModal: React.FC<AttendanceModalProps> = ({
  isOpen,
  onClose,
  recordToEdit,
  initialDate,
  onSave
}) => {
  const [date, setDate] = useState(getTodayDateString());
  const [status, setStatus] = useState<AttendanceStatus>('Present');
  const [inTime, setInTime] = useState('');
  const [outTime, setOutTime] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (recordToEdit) {
      setDate(recordToEdit.date);
      setStatus(recordToEdit.status);
      setInTime(recordToEdit.in_time || '');
      setOutTime(recordToEdit.out_time || '');
      setNotes(recordToEdit.notes || '');
    } else {
      setDate(initialDate || getTodayDateString());
      setStatus('Present');
      setInTime(getCurrentTimeString());
      setOutTime('');
      setNotes('');
    }
    setErrorMessage(null);
  }, [recordToEdit, initialDate, isOpen]);

  if (!isOpen) return null;

  const durationMin = calculateDurationMinutes(inTime || null, outTime || null);
  const durationDisplay = formatDuration(durationMin);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!date) {
      setErrorMessage('Please select a date.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        date,
        status,
        in_time: inTime ? inTime.trim() : null,
        out_time: outTime ? outTime.trim() : null,
        duration_minutes: durationMin,
        notes: notes.trim()
      });
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to save attendance record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetInNow = () => {
    setInTime(getCurrentTimeString());
  };

  const handleSetOutNow = () => {
    setOutTime(getCurrentTimeString());
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{recordToEdit ? 'Edit Attendance Record' : 'Add Attendance Record'}</h3>
          <button
            type="button"
            className="btn btn-icon"
            onClick={onClose}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errorMessage && (
              <div
                style={{
                  background: 'var(--status-absent-bg)',
                  border: '1px solid var(--status-absent-border)',
                  color: 'var(--status-absent-text)',
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem'
                }}
              >
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Date and Status */}
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Date *</label>
                <input
                  type="date"
                  className="form-input"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Status *</label>
                <select
                  className="form-select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AttendanceStatus)}
                >
                  <option value="Present">Present</option>
                  <option value="Absent">Absent</option>
                  <option value="Leave">Leave</option>
                  <option value="Holiday">Holiday</option>
                </select>
              </div>
            </div>

            {/* In Time and Out Time */}
            <div className="form-row">
              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">In Time</label>
                  <button
                    type="button"
                    onClick={handleSetInNow}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Set to Now
                  </button>
                </div>
                <input
                  type="time"
                  className="form-input"
                  value={inTime}
                  onChange={(e) => setInTime(e.target.value)}
                  placeholder="HH:MM"
                />
              </div>

              <div className="form-group">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label">Out Time</label>
                  <button
                    type="button"
                    onClick={handleSetOutNow}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: 'var(--primary)',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                      fontWeight: 600
                    }}
                  >
                    Set to Now
                  </button>
                </div>
                <input
                  type="time"
                  className="form-input"
                  value={outTime}
                  onChange={(e) => setOutTime(e.target.value)}
                  placeholder="HH:MM"
                />
              </div>
            </div>

            {/* Calculated Duration Indicator */}
            {inTime && outTime && (
              <div
                style={{
                  background: 'var(--bg-tertiary)',
                  padding: '0.65rem 1rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)' }}>
                  <Clock size={15} />
                  <span>Calculated Duration:</span>
                </div>
                <strong style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                  {durationDisplay}
                </strong>
              </div>
            )}

            {/* Notes */}
            <div className="form-group">
              <label className="form-label">Notes / Research Activity</label>
              <textarea
                className="form-textarea"
                rows={3}
                placeholder="e.g. Lab experiment, thesis writing, seminar, supervisor discussion..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : recordToEdit ? 'Update Record' : 'Save Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
