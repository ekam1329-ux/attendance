import React from 'react';
import { X, FileSpreadsheet, FileCode, Download, ShieldCheck } from 'lucide-react';
import { AttendanceRecord } from '../types';
import { exportToCSV, exportToJSON } from '../utils/exportUtils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  records: AttendanceRecord[];
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, records }) => {
  if (!isOpen) return null;

  const handleExportCSV = () => {
    exportToCSV(records);
    onClose();
  };

  const handleExportJSON = () => {
    exportToJSON(records);
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '460px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Export Attendance Records</h3>
          <button type="button" className="btn btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            Export all <strong>{records.length}</strong> attendance records for independent backup,
            offline spreadsheet analysis, or archival.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginTop: '0.5rem' }}>
            {/* CSV Option */}
            <div
              onClick={handleExportCSV}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-tertiary)',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: '#10b981' }}>
                  <FileSpreadsheet size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>CSV Spreadsheet</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Compatible with Excel, Google Sheets, LibreOffice (.csv)
                  </div>
                </div>
              </div>
              <Download size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>

            {/* JSON Option */}
            <div
              onClick={handleExportJSON}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border-strong)',
                background: 'var(--bg-tertiary)',
                cursor: 'pointer',
                transition: 'border-color 0.15s ease'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ color: '#3b82f6' }}>
                  <FileCode size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>JSON Data Object</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Full structured data schema with metadata (.json)
                  </div>
                </div>
              </div>
              <Download size={18} style={{ color: 'var(--text-secondary)' }} />
            </div>
          </div>

          <div
            style={{
              fontSize: '0.75rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginTop: '0.5rem'
            }}
          >
            <ShieldCheck size={14} style={{ color: 'var(--status-present-accent)' }} />
            <span>Includes: Date, Day, Status, In Time, Out Time, Duration, Notes.</span>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
