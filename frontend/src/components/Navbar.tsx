import React from 'react';
import { GraduationCap, Sun, Moon, LogIn, LogOut, User as UserIcon, RefreshCw } from 'lucide-react';
import { User } from '../types';

interface NavbarProps {
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
  user: User | null;
  onOpenLogin: () => void;
  onLogout: () => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  theme,
  onToggleTheme,
  user,
  onOpenLogin,
  onLogout,
  onRefresh,
  isRefreshing
}) => {
  return (
    <header className="navbar">
      <div className="navbar-container">
        <div className="navbar-brand">
          <div className="brand-icon">
            <GraduationCap size={22} />
          </div>
          <div>
            <h1 className="brand-title">PhD Attendance Record</h1>
            <span className="brand-subtitle">Personal Researcher Attendance Tracker</span>
          </div>
        </div>

        <div className="navbar-actions">
          <button
            type="button"
            className="btn btn-icon"
            onClick={onRefresh}
            title="Refresh Attendance Data"
            disabled={isRefreshing}
          >
            <RefreshCw size={18} className={isRefreshing ? 'spin-animation' : ''} />
          </button>

          <button
            type="button"
            className="btn btn-icon"
            onClick={onToggleTheme}
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  padding: '0.35rem 0.65rem',
                  borderRadius: 'var(--radius-sm)',
                  background: 'var(--bg-tertiary)'
                }}
              >
                <UserIcon size={14} />
                <span>{user.fullName || user.username}</span>
              </div>
              <button
                type="button"
                className="btn btn-icon"
                onClick={onLogout}
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onOpenLogin}
              style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
            >
              <LogIn size={15} />
              <span>Login</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
