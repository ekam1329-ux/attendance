# PhD Attendance Record

> 🌐 **Live Website Link**: [https://ekam1329-ux.github.io/attendance/](https://ekam1329-ux.github.io/attendance/)  
> 💻 **Local URL**: [http://localhost:5173/](http://localhost:5173/)  
> 
> **Scope Disclaimer**: This application is a personal attendance remembrance and record-keeping tool. It is **NOT** connected to any university biometric machine, fingerprint reader, RFID badge reader, or official university tracking system. Actual attendance happens physically at the university; this tool simply allows you to log and remember your timings.

---

## Architecture Overview

```text
┌──────────────────────────────────────────────┐
│           Frontend (Vite + React)            │
│  - Academic Researcher UI (Light/Dark Theme) │
│  - Real-time Clock & Mark In/Out Quick Action│
│  - Attendance Table with Filters & Search    │
│  - Interactive Monthly Calendar View         │
│  - Statistics & Monthly Breakdown            │
│  - Export to CSV & JSON                      │
│  - GitHub Pages Ready (VITE_API_BASE_URL)    │
│  - Offline / Standalone Demo Fallback        │
└──────────────────────┬───────────────────────┘
                       │ HTTP / REST API (CORS enabled)
                       ▼
┌──────────────────────────────────────────────┐
│        Backend API (Node.js + Express)       │
│  - RESTful Attendance & Auth Endpoints       │
│  - Duplicate Mark-In & Mark-Out Safeguards   │
│  - Time Validation & Duration Engine         │
│  - Optional JWT Authentication               │
└──────────────────────┬───────────────────────┘
                       │ Modular Query Layer
                       ▼
┌──────────────────────────────────────────────┐
│     Database (Modular SQLite / PostgreSQL)   │
│  - UNIQUE(user_id, date) constraint          │
│  - Zero-config local SQLite (attendance.sqlite│
│  - Drop-in schema ready for PostgreSQL       │
└──────────────────────────────────────────────┘
```

---

## Features

1. **Main Dashboard**:
   - Live digital clock with current date (e.g. `Monday, 21 September 2026`).
   - Prominent **Today's Attendance** card with 3 states:
     - **Not marked yet**: Quick time picker + **[ Mark In ]** button.
     - **Marked In, not Out**: Displays Present status, In Time, and **[ Mark Out ]** button.
     - **Completed**: Displays In Time, Out Time, Duration, and **[ Edit Record ]** button.
2. **Attendance Table**:
   - Columns: `Date`, `Day`, `Status`, `In Time`, `Out Time`, `Total Duration`, `Notes`, `Actions`.
   - Sorted newest date first.
   - Live search (by notes or status), month filter, status filter, and sort order toggle.
   - Manual **Edit** and **Delete** (with confirmation dialog).
3. **Calendar View**:
   - Monthly grid with color-coded badges for `Present`, `Absent`, `Leave`, and `Holiday`.
   - Click any date to inspect day details or quickly log an attendance record.
4. **Statistics & Monthly Breakdown**:
   - Total Present Days, Absent Days, Leave Days, and Holidays.
   - Average daily working hours.
   - Current month's attendance count and estimated working day percentage.
5. **Export / Backup**:
   - One-click export to **CSV** (for Excel, Google Sheets).
   - One-click export to **JSON** (complete structured data schema).
6. **Safeguards**:
   - Prevents double Mark-In for the same date (`UNIQUE(user_id, date)` constraint).
   - Prevents Mark-Out before Mark-In.
   - Prevents a second Mark-Out on the same day.
   - Automatically computes duration in hours and minutes (including overnight shifts).

---

## Quickstart: Running Locally

### 1. Prerequisites
- [Node.js](https://nodejs.org/) v18+ (tested with v24)
- npm v9+

### 2. Start the Backend API
```bash
cd backend
npm install
npm start
# The backend starts at http://localhost:5000 with a local SQLite database (attendance.sqlite)
```

### 3. Start the Frontend Application
In a new terminal window:
```bash
cd frontend
npm install
npm run dev
# The frontend starts at http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## Database Architecture & Schema

The application uses a modular database layer with a zero-configuration SQLite database (`attendance.sqlite`) created automatically on startup.

### Database Schema (`backend/src/database/schema.sql`)

```sql
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  date TEXT NOT NULL,           -- Format: YYYY-MM-DD
  status TEXT NOT NULL CHECK(status IN ('Present', 'Absent', 'Leave', 'Holiday')),
  in_time TEXT,                 -- Format: HH:MM
  out_time TEXT,                -- Format: HH:MM
  duration_minutes INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  UNIQUE(user_id, date),
  FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_attendance_user_date ON attendance(user_id, date);
CREATE INDEX IF NOT EXISTS idx_attendance_user_status ON attendance(user_id, status);
```

### Connecting to PostgreSQL (Production)
To switch to PostgreSQL:
1. In `backend/`, install `pg`:
   ```bash
   npm install pg
   ```
2. In `backend/src/database/db.js`, replace the `sql.js` driver with `new pg.Pool({ connectionString: process.env.DATABASE_URL })`.
3. The SQL schema is fully ANSI-SQL compliant and identical for PostgreSQL.

---

## Environment Variables

### Backend (`backend/.env`)
Create a `.env` file in `backend/` (or copy `backend/.env.example`):
```ini
PORT=5000
REQUIRE_AUTH=false
JWT_SECRET=your-secret-key-here
DATABASE_PATH=attendance.sqlite
```

### Frontend (`frontend/.env.production` or repository secrets)
```ini
# Base URL for hosted backend API (leave empty during local development to use proxy)
VITE_API_BASE_URL=https://your-backend-api.onrender.com
```

---

## GitHub Pages Deployment (Frontend)

The frontend is ready for GitHub Pages hosting:

1. Push your repository to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of PhD Attendance Record"
   git branch -M main
   git remote add origin https://github.com/ekam1329-ux/attendance.git
   git push -u origin main
   ```
2. In your GitHub repository:
   - Go to **Settings** > **Pages**.
   - Under **Build and deployment** > **Source**, select **GitHub Actions**.
3. (Optional) If you have a hosted backend, go to **Settings** > **Secrets and variables** > **Actions** > **Variables**, and add:
   - Name: `VITE_API_BASE_URL`
   - Value: `https://your-backend-api.onrender.com`
4. When you push to `main`, the included workflow in [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) will build and deploy the frontend automatically to:
   **`https://ekam1329-ux.github.io/attendance/`**
5. **Offline/Standalone Resilience**: If you haven't deployed a backend yet, the GitHub Pages site automatically runs in **Offline Demo Mode**, storing records in the browser so you can test all features immediately.

---

## Backend Deployment (Free / Low Cost)

Since GitHub Pages only serves static frontend files, you can deploy the backend API to free/low-cost platforms:

### Deploying to Render.com:
1. Create a free account at [render.com](https://render.com).
2. Click **New +** > **Web Service** and connect your GitHub repository.
3. Configure the service:
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**:
     - `PORT`: `5000`
     - `JWT_SECRET`: `<generate-a-random-secret>`
4. Copy the service URL (e.g. `https://phd-attendance-api.onrender.com`).
5. Set `VITE_API_BASE_URL=https://phd-attendance-api.onrender.com` in your GitHub repository variables.

---

## Security Considerations

1. **Database Access**: The SQLite / PostgreSQL database is never exposed directly to the public internet or client browsers. All queries go through the Express backend API.
2. **CORS Configuration**: The backend has CORS enabled to accept requests from your GitHub Pages URL (`https://ekam1329-ux.github.io`) and localhost.
3. **Authentication**:
   - Default local mode uses a single-user personal researcher profile (`researcher` / `researcher123`).
   - Setting `REQUIRE_AUTH=true` enforces JWT Bearer tokens on all endpoints.
4. **No Secrets in Git**: `.gitignore` is configured to prevent `.env`, `*.sqlite`, and credentials from being committed to version control.

