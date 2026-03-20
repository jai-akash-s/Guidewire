const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { zoneCoords } = require('../data');
const { db, mapWorker } = require('../db');
const { calculateRiskScore } = require('../utils');
const JWT_SECRET = process.env.JWT_SECRET || 'secret_gigshield';

router.post('/register', (req, res) => {
  const { phone, name, city, zone, platform, avg_weekly_earnings } = req.body;
  if (!phone || !name || !city || !zone || !platform || !avg_weekly_earnings) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const existing = db.prepare('SELECT id FROM workers WHERE phone = ?').get(phone);
  if (existing) return res.status(409).json({ error: 'Phone already registered' });

  const { risk_score, risk_tier } = calculateRiskScore({ city, avg_weekly_earnings: Number(avg_weekly_earnings) });
  const location = zoneCoords[zone] || zoneCoords[city] || { lat: 0, lng: 0 };
  const createdAt = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO workers (phone, name, city, zone, platform, avg_weekly_earnings, risk_score, risk_tier, home_lat, home_lng, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = insert.run(
    phone,
    name,
    city,
    zone,
    platform,
    Number(avg_weekly_earnings),
    risk_score,
    risk_tier,
    location.lat,
    location.lng,
    createdAt
  );
  const row = db.prepare('SELECT * FROM workers WHERE id = ?').get(result.lastInsertRowid);
  const worker = mapWorker(row);
  const token = jwt.sign({ workerId: worker.id }, JWT_SECRET, { expiresIn: '4h' });
  res.json({ token, worker });
});

router.post('/login', (req, res) => {
  const { phone } = req.body;
  const row = db.prepare('SELECT * FROM workers WHERE phone = ?').get(phone);
  const worker = mapWorker(row);
  if (!worker) return res.status(404).json({ error: 'Worker not found' });
  const token = jwt.sign({ workerId: worker.id }, JWT_SECRET, { expiresIn: '4h' });
  res.json({ token, worker });
});

router.post('/refresh-token', (req, res) => {
  const { token } = req.body;
  if (!token) return res.status(401).json({ error: 'token required' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const newToken = jwt.sign({ workerId: payload.workerId }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token: newToken });
  } catch (err) {
    res.status(401).json({ error: 'invalid token' });
  }
});

module.exports = router;
