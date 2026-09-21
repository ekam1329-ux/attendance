const fs = require('fs');
const path = require('path');
const initSqlJs = require('sql.js');
const bcrypt = require('bcryptjs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', '..', 'attendance.sqlite');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');

let db = null;
let SQL = null;

async function initDb() {
  if (db) return db;

  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const fileBuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }

  // Run schema
  const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
  db.run(schema);
  saveDb();

  // Check if any user exists; if not, seed default researcher
  const userCount = queryOne('SELECT COUNT(*) as count FROM users');
  if (!userCount || userCount.count === 0) {
    const defaultUserId = 'user_phd_default';
    const defaultUsername = 'researcher';
    const passwordHash = bcrypt.hashSync('researcher123', 10);
    run(
      `INSERT INTO users (id, username, password_hash, full_name) VALUES (?, ?, ?, ?)`,
      [defaultUserId, defaultUsername, passwordHash, 'PhD Scholar']
    );
    console.log('[DB] Seeded default user: username "researcher", password "researcher123"');
  }

  console.log(`[DB] Database ready at ${DB_PATH}`);
  return db;
}

function saveDb() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, buffer);
  } catch (err) {
    console.error('[DB] Failed to save database to disk:', err);
  }
}

function query(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params.length) {
    stmt.bind(params);
  }
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

function queryOne(sql, params = []) {
  const results = query(sql, params);
  return results.length > 0 ? results[0] : null;
}

function run(sql, params = []) {
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
  saveDb();
  return { changes: db.getRowsModified() };
}

module.exports = {
  initDb,
  getDb: () => db,
  query,
  queryOne,
  run,
  saveDb
};
