const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'phd-attendance-secret-key-2026';
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === 'true';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired authentication token' });
    }
  }

  // If strict auth is required and no token was provided
  if (REQUIRE_AUTH) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  // Default personal single-user mode for ease of personal record-keeping
  req.user = {
    userId: 'user_phd_default',
    username: 'researcher',
    fullName: 'PhD Scholar'
  };
  next();
}

module.exports = {
  authMiddleware,
  JWT_SECRET
};
