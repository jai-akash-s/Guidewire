const express = require('express');
const router = express.Router();
const { zoneCoords } = require('../data');
const { db, mapWorker } = require('../db');
const { calculateRiskScore, premiumForTier, coverageForTier, startOfWeek } = require('../utils');

router.get('/profile', (req, res) => {
  const row = db.prepare('SELECT * FROM workers WHERE id = ?').get(req.worker.id);
  res.json(mapWorker(row));
});

router.put('/profile', (req, res) => {
  const worker = req.worker;
  const { zone, avg_weekly_earnings } = req.body;
  const updatedZone = zone || worker.zone;
  const updatedEarnings = avg_weekly_earnings ? Number(avg_weekly_earnings) : worker.avg_weekly_earnings;
  const updatedRisk = calculateRiskScore({ city: worker.city, avg_weekly_earnings: updatedEarnings });
  const location = zoneCoords[updatedZone] || worker.home_location || { lat: 0, lng: 0 };

  db.prepare(`
    UPDATE workers
    SET zone = ?, avg_weekly_earnings = ?, risk_score = ?, risk_tier = ?, home_lat = ?, home_lng = ?
    WHERE id = ?
  `).run(updatedZone, updatedEarnings, updatedRisk.risk_score, updatedRisk.risk_tier, location.lat, location.lng, worker.id);

  const row = db.prepare('SELECT * FROM workers WHERE id = ?').get(worker.id);
  res.json(mapWorker(row));
});

router.get('/policy/active', (req, res) => {
  const active = db.prepare('SELECT * FROM policies WHERE worker_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1')
    .get(req.worker.id, 'ACTIVE');
  res.json(active || null);
});

router.post('/policy/create', (req, res) => {
  const worker = req.worker;
  const { tier, auto_renew = true } = req.body;
  if (!tier || !['Basic', 'Standard', 'Premium'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  const weekStart = startOfWeek(new Date()).toISOString();
  db.prepare('UPDATE policies SET status = ? WHERE worker_id = ? AND status = ? AND week_start >= ?')
    .run('INACTIVE', worker.id, 'ACTIVE', weekStart);

  const weekly_premium_inr = premiumForTier(tier, worker.risk_score);
  const coverage = coverageForTier(tier);
  const weekStartIso = new Date().toISOString();
  const weekEndIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const createdAt = new Date().toISOString();

  const result = db.prepare(`
    INSERT INTO policies (worker_id, week_start, week_end, tier, weekly_premium_inr, max_payout_inr, daily_cover_inr, status, auto_renew, zone, platform, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    worker.id,
    weekStartIso,
    weekEndIso,
    tier,
    weekly_premium_inr,
    coverage.max_payout_inr,
    coverage.daily_cover_inr,
    'ACTIVE',
    auto_renew ? 1 : 0,
    worker.zone,
    worker.platform,
    createdAt
  );
  const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(policy);
});

router.get('/payouts', (req, res) => {
  const result = db.prepare('SELECT * FROM payouts WHERE worker_id = ? ORDER BY processed_at DESC LIMIT 4')
    .all(req.worker.id);
  res.json(result);
});

module.exports = router;
