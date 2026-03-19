-- GigShield PostgreSQL Schema (Phase 1)

CREATE TABLE workers (
  id SERIAL PRIMARY KEY,
  phone VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  city VARCHAR(80) NOT NULL,
  zone VARCHAR(120) NOT NULL,
  platform VARCHAR(20) NOT NULL,
  avg_weekly_earnings NUMERIC NOT NULL,
  risk_score INTEGER,
  risk_tier VARCHAR(20),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE policies (
  id SERIAL PRIMARY KEY,
  worker_id INTEGER REFERENCES workers(id),
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  tier VARCHAR(20) NOT NULL,
  weekly_premium_inr NUMERIC NOT NULL,
  max_payout_inr NUMERIC NOT NULL,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE disruptions (
  id SERIAL PRIMARY KEY,
  city VARCHAR(80),
  zone VARCHAR(120),
  type VARCHAR(20) NOT NULL,
  severity INTEGER,
  started_at TIMESTAMP,
  ended_at TIMESTAMP,
  affected_workers_count INTEGER
);

CREATE TABLE claims (
  id SERIAL PRIMARY KEY,
  worker_id INTEGER REFERENCES workers(id),
  policy_id INTEGER REFERENCES policies(id),
  disruption_id INTEGER REFERENCES disruptions(id),
  fraud_score NUMERIC,
  fraud_flags TEXT[],
  status VARCHAR(20),
  payout_amount_inr NUMERIC,
  auto_triggered BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE payouts (
  id SERIAL PRIMARY KEY,
  claim_id INTEGER REFERENCES claims(id),
  worker_id INTEGER REFERENCES workers(id),
  amount_inr NUMERIC,
  upi_id VARCHAR(80),
  transaction_id VARCHAR(80),
  status VARCHAR(20),
  processed_at TIMESTAMP
);

CREATE TABLE worker_gps_log (
  id SERIAL PRIMARY KEY,
  worker_id INTEGER REFERENCES workers(id),
  lat NUMERIC,
  lng NUMERIC,
  logged_at TIMESTAMP DEFAULT NOW()
);
