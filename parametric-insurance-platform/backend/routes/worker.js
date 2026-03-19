const express = require('express');
const router = express.Router();
const { workers, policies, claims, payouts, zoneCoords } = require('../data');
const { calculateRiskScore, premiumForTier, coverageForTier, startOfWeek } = require('../utils');

router.get('/profile', (req, res) => {
  const worker = req.worker;
  res.json(worker);
});

router.put('/profile', (req, res) => {
  const worker = req.worker;
  const { zone, avg_weekly_earnings } = req.body;
  if (zone) worker.zone = zone;
  if (avg_weekly_earnings) worker.avg_weekly_earnings = Number(avg_weekly_earnings);
  if (zone && zoneCoords[zone]) worker.home_location = zoneCoords[zone];
  const updatedRisk = calculateRiskScore({ city: worker.city, avg_weekly_earnings: worker.avg_weekly_earnings });
  worker.risk_score = updatedRisk.risk_score;
  worker.risk_tier = updatedRisk.risk_tier;
  res.json(worker);
});

router.get('/policy/active', (req, res) => {
  const worker = req.worker;
  const active = policies.find(p => p.worker_id === worker.id && p.status === 'ACTIVE');
  res.json(active || null);
});

router.post('/policy/create', (req, res) => {
  const worker = req.worker;
  const { tier, auto_renew = true } = req.body;
  if (!tier || !['Basic', 'Standard', 'Premium'].includes(tier)) {
    return res.status(400).json({ error: 'Invalid tier' });
  }

  const weekStart = startOfWeek(new Date());
  policies.forEach(p => {
    if (p.worker_id === worker.id && p.status === 'ACTIVE' && new Date(p.week_start) >= weekStart) {
      p.status = 'INACTIVE';
    }
  });

  const weekly_premium_inr = premiumForTier(tier, worker.risk_score);
  const coverage = coverageForTier(tier);
  const policy = {
    id: policies.length + 1,
    worker_id: worker.id,
    week_start: new Date().toISOString(),
    week_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    tier,
    weekly_premium_inr,
    max_payout_inr: coverage.max_payout_inr,
    daily_cover_inr: coverage.daily_cover_inr,
    status: 'ACTIVE',
    auto_renew,
    zone: worker.zone,
    platform: worker.platform,
    created_at: new Date().toISOString()
  };
  policies.push(policy);
  res.status(201).json(policy);
});

router.get('/payouts', (req, res) => {
  const worker = req.worker;
  const result = payouts.filter(p => p.worker_id === worker.id).slice(-4).reverse();
  res.json(result);
});

module.exports = router;
