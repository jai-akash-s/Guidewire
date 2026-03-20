const path = require('path');
const Database = require('better-sqlite3');

const dbPath = path.join(__dirname, 'gigshield.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS workers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  zone TEXT NOT NULL,
  platform TEXT NOT NULL,
  avg_weekly_earnings REAL NOT NULL,
  risk_score INTEGER,
  risk_tier TEXT,
  home_lat REAL,
  home_lng REAL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS policies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL,
  week_start TEXT NOT NULL,
  week_end TEXT NOT NULL,
  tier TEXT NOT NULL,
  weekly_premium_inr REAL NOT NULL,
  max_payout_inr REAL NOT NULL,
  daily_cover_inr REAL NOT NULL,
  status TEXT NOT NULL,
  auto_renew INTEGER NOT NULL,
  zone TEXT NOT NULL,
  platform TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS claims (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worker_id INTEGER NOT NULL,
  policy_id INTEGER NOT NULL,
  disruption_id INTEGER,
  fraud_score REAL,
  fraud_flags TEXT,
  status TEXT,
  payout_amount_inr REAL,
  auto_triggered INTEGER,
  event_type TEXT,
  event_severity INTEGER,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  claim_id INTEGER NOT NULL,
  worker_id INTEGER NOT NULL,
  amount_inr REAL NOT NULL,
  upi_id TEXT,
  transaction_id TEXT,
  status TEXT,
  processed_at TEXT
);
`);

const mapWorker = (row) => {
  if (!row) return null;
  return {
    ...row,
    avg_weekly_earnings: Number(row.avg_weekly_earnings),
    risk_score: row.risk_score !== null ? Number(row.risk_score) : null,
    home_location: row.home_lat !== null && row.home_lng !== null
      ? { lat: Number(row.home_lat), lng: Number(row.home_lng) }
      : null
  };
};

module.exports = { db, mapWorker };
