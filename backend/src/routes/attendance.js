const express = require('express');
const router = express.Router();
const { query, queryOne, run } = require('../database/db');
const { authMiddleware } = require('../middleware/auth');
const {
  calculateDurationMinutes,
  formatMinutesToDuration,
  normalizeTime
} = require('../utils/duration');

router.use(authMiddleware);

// Helper to get local YYYY-MM-DD
function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper to get local HH:MM
function getLocalTimeString(date = new Date()) {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// GET /api/attendance/today - Get today's record
router.get('/today', (req, res) => {
  const clientDate = req.query.date || getLocalDateString();
  const record = queryOne(
    'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
    [req.user.userId, clientDate]
  );
  res.json({ record: record || null });
});

// GET /api/attendance/stats - Overall & Monthly statistics
router.get('/stats', (req, res) => {
  const userId = req.user.userId;
  const currentMonth = req.query.month || getLocalDateString().substring(0, 7); // YYYY-MM

  // Overall totals
  const overallRows = query(
    `SELECT status, COUNT(*) as count, SUM(duration_minutes) as total_duration
     FROM attendance
     WHERE user_id = ?
     GROUP BY status`,
    [userId]
  );

  let totalRecords = 0;
  let presentDays = 0;
  let absentDays = 0;
  let leaveDays = 0;
  let holidayDays = 0;
  let totalDurationMinutes = 0;

  overallRows.forEach(r => {
    totalRecords += r.count;
    if (r.status === 'Present') {
      presentDays = r.count;
      totalDurationMinutes = r.total_duration || 0;
    } else if (r.status === 'Absent') {
      absentDays = r.count;
    } else if (r.status === 'Leave') {
      leaveDays = r.count;
    } else if (r.status === 'Holiday') {
      holidayDays = r.count;
    }
  });

  // Current month stats
  const monthRows = query(
    `SELECT status, COUNT(*) as count, SUM(duration_minutes) as total_duration
     FROM attendance
     WHERE user_id = ? AND date LIKE ?
     GROUP BY status`,
    [userId, `${currentMonth}%`]
  );

  let monthPresent = 0;
  let monthAbsent = 0;
  let monthLeave = 0;
  let monthHoliday = 0;
  let monthDurationMinutes = 0;

  monthRows.forEach(r => {
    if (r.status === 'Present') {
      monthPresent = r.count;
      monthDurationMinutes = r.total_duration || 0;
    } else if (r.status === 'Absent') {
      monthAbsent = r.count;
    } else if (r.status === 'Leave') {
      monthLeave = r.count;
    } else if (r.status === 'Holiday') {
      monthHoliday = r.count;
    }
  });

  const monthTotal = monthPresent + monthAbsent + monthLeave + monthHoliday;
  const avgDurationMinutes = presentDays > 0 ? Math.round(totalDurationMinutes / presentDays) : 0;
  const monthAvgDurationMinutes = monthPresent > 0 ? Math.round(monthDurationMinutes / monthPresent) : 0;

  res.json({
    overall: {
      totalRecords,
      presentDays,
      absentDays,
      leaveDays,
      holidayDays,
      totalDurationMinutes,
      avgDurationMinutes,
      avgDurationFormatted: formatMinutesToDuration(avgDurationMinutes)
    },
    currentMonth: {
      month: currentMonth,
      totalRecords: monthTotal,
      present: monthPresent,
      absent: monthAbsent,
      leave: monthLeave,
      holiday: monthHoliday,
      avgDurationMinutes: monthAvgDurationMinutes,
      avgDurationFormatted: formatMinutesToDuration(monthAvgDurationMinutes)
    }
  });
});

// GET /api/attendance - List attendance records with optional filtering
router.get('/', (req, res) => {
  const userId = req.user.userId;
  const { month, startDate, endDate, status, search, sort = 'desc' } = req.query;

  let sql = 'SELECT * FROM attendance WHERE user_id = ?';
  const params = [userId];

  if (month) {
    sql += ' AND date LIKE ?';
    params.push(`${month}%`);
  }

  if (startDate) {
    sql += ' AND date >= ?';
    params.push(startDate);
  }

  if (endDate) {
    sql += ' AND date <= ?';
    params.push(endDate);
  }

  if (status && status !== 'All') {
    sql += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    sql += ' AND (notes LIKE ? OR status LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  const orderDirection = sort.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  sql += ` ORDER BY date ${orderDirection}`;

  const records = query(sql, params);
  res.json({ records });
});

// GET /api/attendance/:date - Get by exact date
router.get('/:date', (req, res) => {
  const { date } = req.params;
  const record = queryOne(
    'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
    [req.user.userId, date]
  );
  if (!record) {
    return res.status(404).json({ error: 'Record not found for date ' + date });
  }
  res.json({ record });
});

// POST /api/attendance/mark-in - Quick Mark In for today
router.post('/mark-in', (req, res) => {
  const userId = req.user.userId;
  const targetDate = req.body.date || getLocalDateString();
  const inTime = normalizeTime(req.body.in_time || getLocalTimeString());
  const notes = req.body.notes || '';

  // Safeguard: Check if record already exists for this date
  const existing = queryOne(
    'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
    [userId, targetDate]
  );

  if (existing) {
    return res.status(400).json({
      error: `Attendance for ${targetDate} has already been marked (Status: ${existing.status}, In: ${existing.in_time || 'N/A'}). Please use Edit if you need to adjust timings.`
    });
  }

  const recordId = 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  run(
    `INSERT INTO attendance (id, user_id, date, status, in_time, out_time, duration_minutes, notes)
     VALUES (?, ?, ?, 'Present', ?, NULL, 0, ?)`,
    [recordId, userId, targetDate, inTime, notes]
  );

  const newRecord = queryOne('SELECT * FROM attendance WHERE id = ?', [recordId]);
  res.status(201).json({
    message: 'Marked In successfully',
    record: newRecord
  });
});

// POST /api/attendance/mark-out - Quick Mark Out for today
router.post('/mark-out', (req, res) => {
  const userId = req.user.userId;
  const targetDate = req.body.date || getLocalDateString();
  const outTime = normalizeTime(req.body.out_time || getLocalTimeString());
  const notes = req.body.notes;

  // Safeguard: Find today's record
  const existing = queryOne(
    'SELECT * FROM attendance WHERE user_id = ? AND date = ?',
    [userId, targetDate]
  );

  if (!existing) {
    return res.status(400).json({
      error: `Cannot Mark Out: No attendance record found for ${targetDate}. Please click "Mark In" first.`
    });
  }

  if (!existing.in_time) {
    return res.status(400).json({
      error: `Cannot Mark Out: No In-Time found for ${targetDate}. Please edit the record to provide an In-Time first.`
    });
  }

  if (existing.out_time) {
    return res.status(400).json({
      error: `You have already marked out for ${targetDate} at ${existing.out_time}. Use the Edit button if you need to adjust timings.`
    });
  }

  const durationMinutes = calculateDurationMinutes(existing.in_time, outTime);
  const updatedNotes = notes !== undefined ? notes : existing.notes;

  run(
    `UPDATE attendance
     SET out_time = ?, duration_minutes = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [outTime, durationMinutes, updatedNotes, existing.id]
  );

  const updatedRecord = queryOne('SELECT * FROM attendance WHERE id = ?', [existing.id]);
  res.json({
    message: 'Marked Out successfully',
    record: updatedRecord
  });
});

// POST /api/attendance - Manual record creation
router.post('/', (req, res) => {
  const userId = req.user.userId;
  const { date, status = 'Present', in_time, out_time, notes = '' } = req.body;

  if (!date) {
    return res.status(400).json({ error: 'Date is required (YYYY-MM-DD)' });
  }

  // Check unique constraint
  const existing = queryOne(
    'SELECT id FROM attendance WHERE user_id = ? AND date = ?',
    [userId, date]
  );
  if (existing) {
    return res.status(409).json({
      error: `A record already exists for ${date}. Please edit the existing record instead.`
    });
  }

  const normIn = in_time ? normalizeTime(in_time) : null;
  const normOut = out_time ? normalizeTime(out_time) : null;
  const duration = (normIn && normOut) ? calculateDurationMinutes(normIn, normOut) : 0;

  const recordId = 'att_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  run(
    `INSERT INTO attendance (id, user_id, date, status, in_time, out_time, duration_minutes, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [recordId, userId, date, status, normIn, normOut, duration, notes]
  );

  const newRecord = queryOne('SELECT * FROM attendance WHERE id = ?', [recordId]);
  res.status(201).json({
    message: 'Attendance record created successfully',
    record: newRecord
  });
});

// PUT /api/attendance/:id - Update existing record
router.put('/:id', (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const { date, status, in_time, out_time, notes } = req.body;

  const existing = queryOne(
    'SELECT * FROM attendance WHERE id = ? AND user_id = ?',
    [id, userId]
  );

  if (!existing) {
    return res.status(404).json({ error: 'Record not found' });
  }

  const targetDate = date || existing.date;
  // If date changed, ensure no conflict
  if (targetDate !== existing.date) {
    const conflict = queryOne(
      'SELECT id FROM attendance WHERE user_id = ? AND date = ? AND id != ?',
      [userId, targetDate, id]
    );
    if (conflict) {
      return res.status(409).json({ error: `Another record already exists for ${targetDate}` });
    }
  }

  const targetStatus = status || existing.status;
  const normIn = in_time !== undefined ? (in_time ? normalizeTime(in_time) : null) : existing.in_time;
  const normOut = out_time !== undefined ? (out_time ? normalizeTime(out_time) : null) : existing.out_time;
  const duration = (normIn && normOut) ? calculateDurationMinutes(normIn, normOut) : 0;
  const targetNotes = notes !== undefined ? notes : existing.notes;

  run(
    `UPDATE attendance
     SET date = ?, status = ?, in_time = ?, out_time = ?, duration_minutes = ?, notes = ?, updated_at = datetime('now')
     WHERE id = ?`,
    [targetDate, targetStatus, normIn, normOut, duration, targetNotes, id]
  );

  const updated = queryOne('SELECT * FROM attendance WHERE id = ?', [id]);
  res.json({
    message: 'Record updated successfully',
    record: updated
  });
});

// DELETE /api/attendance/:id - Delete a record
router.delete('/:id', (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const existing = queryOne(
    'SELECT id, date FROM attendance WHERE id = ? AND user_id = ?',
    [id, userId]
  );

  if (!existing) {
    return res.status(404).json({ error: 'Record not found' });
  }

  run('DELETE FROM attendance WHERE id = ? AND user_id = ?', [id, userId]);
  res.json({
    message: `Attendance record for ${existing.date} deleted successfully`,
    id
  });
});

module.exports = router;
