require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initDb } = require('./database/db');
const authRoutes = require('./routes/auth');
const attendanceRoutes = require('./routes/attendance');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allows requests from local Vite (localhost:5173) and hosted frontend (GitHub Pages)
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Health & Info endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    app: 'PhD Attendance Record API',
    description: 'Personal remembrance & record-keeping API for PhD scholar attendance',
    disclaimer: 'Personal record-keeping only. NOT connected to university biometric attendance system.',
    version: '1.0.0',
    endpoints: {
      health: 'GET /api/health',
      auth: 'POST /api/auth/login, POST /api/auth/register, GET /api/auth/me',
      attendance: 'GET /api/attendance, GET /api/attendance/today, GET /api/attendance/stats, POST /api/attendance/mark-in, POST /api/attendance/mark-out, POST /api/attendance, PUT /api/attendance/:id, DELETE /api/attendance/:id'
    }
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

// Start Server after DB init
async function start() {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(` PhD Attendance API Server running on port ${PORT}`);
      console.log(` Local: http://localhost:${PORT}`);
      console.log(` Disclaimer: Manual personal record-keeping only.`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal: Failed to start server:', err);
    process.exit(1);
  }
}

start();
