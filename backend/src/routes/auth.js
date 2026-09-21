const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { queryOne, run } = require('../database/db');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const user = queryOne('SELECT * FROM users WHERE username = ?', [username.trim()]);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = bcrypt.compareSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username, fullName: user.full_name },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name
    }
  });
});

// POST /api/auth/register
router.post('/register', (req, res) => {
  const { username, password, fullName } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  const existing = queryOne('SELECT id FROM users WHERE username = ?', [username.trim()]);
  if (existing) {
    return res.status(409).json({ error: 'Username already taken' });
  }

  const newId = 'user_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const passwordHash = bcrypt.hashSync(password, 10);

  run(
    'INSERT INTO users (id, username, password_hash, full_name) VALUES (?, ?, ?, ?)',
    [newId, username.trim(), passwordHash, fullName || 'PhD Scholar']
  );

  const token = jwt.sign(
    { userId: newId, username: username.trim(), fullName: fullName || 'PhD Scholar' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.status(201).json({
    message: 'Account registered successfully',
    token,
    user: {
      id: newId,
      username: username.trim(),
      fullName: fullName || 'PhD Scholar'
    }
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  const user = queryOne('SELECT id, username, full_name, created_at FROM users WHERE id = ?', [req.user.userId]);
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  res.json({
    user: {
      id: user.id,
      username: user.username,
      fullName: user.full_name,
      createdAt: user.created_at
    }
  });
});

module.exports = router;
