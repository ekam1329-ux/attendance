import React from 'react';
import { Edit3, Trash2, Search, ArrowUpDown, Download, Plus, Filter } from 'lucide-react';
import { AttendanceRecord, AttendanceStatus, FilterOptions } from '../types';
import { formatDateDisplay, formatTimeDisplay, formatDuration, getDayName } from '../utils/dateUtils';

interface AttendanceTableProps {
  records: AttendanceRecord[];
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  onEdit: (record: AttendanceRecord) => void;
  onDelete: (record: AttendanceRecord) => void;
  onAddNew: () => void;
  onOpenExport: () => void;
  isLoading?: boolean;
}

export const AttendanceTable: React.FC<AttendanceTableProps> = ({
  records,
  filters,
  onFilterChange,
  onEdit,
  onDelete,
  onAddNew,
  onOpenExport,
  isLoading
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ ...filters, status: e.target.value });
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, month: e.target.value });
  };

  const toggleSort = () => {
    onFilterChange({ ...filters, sort: filters.sort === 'desc' ? 'asc' : 'desc' });
  };

  return (
    <div>
      {/* Top Filter and Actions Toolbar */}
      <div className="filter-card">
        <div className="filter-group">
          {/* Search box */}
          <div className="search-wrapper">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              className="input-control search-input"
              placeholder="Search notes or status..."
              value={filters.search}
              onChange={handleSearchChange}
            />
          </div>

          {/* Month selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Month:</span>
            <input
              type="month"
              className="input-control"
              value={filters.month}
              onChange={handleMonthChange}
            />
          </div>

          {/* Status selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Status:</span>
            <select
              className="select-control"
              value={filters.status}
              onChange={handleStatusChange}
            >
              <option value="All">All Statuses</option>
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
              <option value="Leave">Leave</option>
              <option value="Holiday">Holiday</option>
            </select>
          </div>

          {/* Sort toggle */}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleSort}
            title={`Sorted ${filters.sort === 'desc' ? 'Newest First' : 'Oldest First'}`}
            style={{ padding: '0.5rem 0.8rem' }}
          >
            <ArrowUpDown size={15} />
            <span>{filters.sort === 'desc' ? 'Newest' : 'Oldest'}</span>
          </button>
        </div>

        {/* Action Buttons: Add Record & Export */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onOpenExport}
            title="Export to CSV or JSON"
          >
            <Download size={15} />
            <span>Export</span>
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={onAddNew}
          >
            <Plus size={16} />
            <span>Add Record</span>
          </button>
        </div>
      </div>

      {/* Responsive Table */}
      <div className="table-container" style={{ overflowX: 'auto' }}>
        <table className="attendance-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Day</th>
              <th>Status</th>
              <th>In Time</th>
              <th>Out Time</th>
              <th>Total Duration</th>
              <th>Notes</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                  Loading attendance records...
                </td>
              </tr>
            ) : records.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                  No attendance records found for the selected filters.
                </td>
              </tr>
            ) : (
              records.map((r) => {
                const dateDisplay = formatDateDisplay(r.date);
                const dayDisplay = getDayName(r.date);
                const inTimeDisplay = formatTimeDisplay(r.in_time);
                const outTimeDisplay = formatTimeDisplay(r.out_time);
                const durationDisplay = formatDuration(r.duration_minutes);

                return (
                  <tr key={r.id}>
                    <td style={{ fontWeight: 600 }}>{dateDisplay}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{dayDisplay}</td>
                    <td>
                      <span className={`status-badge status-${r.status}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="time-mono">{inTimeDisplay}</td>
                    <td className="time-mono">{outTimeDisplay}</td>
                    <td className="time-mono" style={{ fontWeight: 600, color: r.duration_minutes > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {durationDisplay}
                    </td>
                    <td className="notes-cell" title={r.notes || ''}>
                      {r.notes || '—'}
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          className="btn btn-icon"
                          onClick={() => onEdit(r)}
                          title="Edit record"
                          style={{ padding: '0.35rem' }}
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn btn-icon"
                          onClick={() => onDelete(r)}
                          title="Delete record"
                          style={{ padding: '0.35rem', color: 'var(--status-absent-accent)' }}
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
        <span>Showing {records.length} {records.length === 1 ? 'record' : 'records'}</span>
        <span>Records sorted with {filters.sort === 'desc' ? 'newest first' : 'oldest first'}</span>
      </div>
    </div>
  );
};
