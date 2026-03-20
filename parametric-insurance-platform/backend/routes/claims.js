const express = require('express');
const router = express.Router();
const { disruptions } = require('../data');
const { db, mapWorker } = require('../db');
const {
  calculatePayout,
  getZoneCentre,
  isWithinKm,
  startOfWeek,
  claimsInWindow,
  daysBetween
} = require('../utils');

router.post('/', (req, res) => {
  const { policy_id, disruption_id, disruption_hours = 4 } = req.body;
  const policy = db.prepare('SELECT * FROM policies WHERE id = ?').get(Number(policy_id));
  if (!policy) return res.status(404).json({ error: 'policy not found' });
  const worker = mapWorker(db.prepare('SELECT * FROM workers WHERE id = ?').get(policy.worker_id));
  if (!worker) return res.status(404).json({ error: 'worker not found' });

  const payoutAmount = calculatePayout({
    policyTier: policy.tier,
    avg_daily_earnings: worker.avg_weekly_earnings / 7,
    disruption_hours,
    weekly_earnings: worker.avg_weekly_earnings
  });

  const createdAt = new Date().toISOString();
  const claimInsert = db.prepare(`
    INSERT INTO claims (worker_id, policy_id, disruption_id, fraud_score, fraud_flags, status, payout_amount_inr, auto_triggered, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const result = claimInsert.run(
    worker.id,
    policy.id,
    disruption_id || null,
    0.15,
    JSON.stringify([]),
    'APPROVED',
    payoutAmount,
    0,
    createdAt
  );
  const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(result.lastInsertRowid);
  db.prepare(`
    INSERT INTO payouts (claim_id, worker_id, amount_inr, upi_id, transaction_id, status, processed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(claim.id, worker.id, payoutAmount, `worker${worker.id}@upi`, `TX${Date.now()}`, 'SUCCESS', createdAt);

  res.status(201).json(claim);
});

router.post('/trigger', (req, res, next) => {
  const aiKey = req.headers['x-ai-key'];
  const expectedKey = process.env.AI_SERVICE_KEY;
  const isInternal = expectedKey && aiKey && aiKey === expectedKey;
  if (!req.worker && !isInternal) {
    return res.status(401).json({ error: 'AI key or worker token required' });
  }
  return next();
}, (req, res) => {
  const { zone, type, severity = 7, disruption_hours = 4, epicentre } = req.body;
  const activePolicies = db.prepare('SELECT * FROM policies WHERE zone = ? AND status = ?').all(zone, 'ACTIVE');
  if (!activePolicies.length) return res.status(404).json({ error: 'No active policies in zone' });

  const zoneCentre = epicentre || getZoneCentre(zone);
  const now = new Date();
  const startWeek = startOfWeek(now);
  const endWeek = new Date(startWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
  const last4WeeksStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const createdClaims = activePolicies
    .map(policy => {
      const worker = mapWorker(db.prepare('SELECT * FROM workers WHERE id = ?').get(policy.worker_id));
      if (!worker) return null;

      const allClaims = db.prepare('SELECT * FROM claims WHERE worker_id = ?').all(worker.id);
      const claimsThisWeek = claimsInWindow(allClaims, worker.id, startWeek, endWeek);
      const claimsLast4Weeks = claimsInWindow(allClaims, worker.id, last4WeeksStart, now);
      const avgWeeklyClaims = claimsLast4Weeks.length / 4;

      const fraudFlags = [];
      let fraudScore = 0.1;
      let recommendation = 'APPROVE';

      const eventType = type || 'PARAMETRIC_EVENT';
      const windowStart = new Date(Date.now() - disruption_hours * 60 * 60 * 1000);
      const duplicate = allClaims.find(
        c => c.worker_id === worker.id && c.event_type === eventType && new Date(c.created_at) >= windowStart
      );
      if (duplicate) return null;

      const workerLocation = worker.home_location || zoneCentre;
      if (!isWithinKm(workerLocation, zoneCentre, 5)) {
        fraudFlags.push('gps_zone_validation_failed');
        fraudScore += 0.3;
      }

      if (claimsThisWeek.length >= 2) {
        fraudFlags.push('frequency_cap_exceeded');
        fraudScore += 0.2;
      }

      if (activePolicies.length < 3) {
        fraudFlags.push('cluster_validation_failed');
        fraudScore += 0.2;
        recommendation = 'REVIEW';
      }

      const daysSinceSignup = daysBetween(now, new Date(worker.created_at));
      if (daysSinceSignup < 14) {
        fraudFlags.push('new_account_hold');
        fraudScore += 0.2;
        recommendation = 'REVIEW';
      }

      if (avgWeeklyClaims > 0 && claimsThisWeek.length >= Math.ceil(avgWeeklyClaims * 3)) {
        fraudFlags.push('historical_anomaly');
        fraudScore += 0.2;
        recommendation = 'REVIEW';
      }

      if (fraudScore >= 0.85) recommendation = 'REJECT';

      const payoutAmount = calculatePayout({
        policyTier: policy.tier,
        avg_daily_earnings: worker.avg_weekly_earnings / 7,
        disruption_hours,
        weekly_earnings: worker.avg_weekly_earnings
      });

      const createdAt = new Date().toISOString();
      const insertResult = db.prepare(`
        INSERT INTO claims (worker_id, policy_id, disruption_id, fraud_score, fraud_flags, status, payout_amount_inr, auto_triggered, event_type, event_severity, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        worker.id,
        policy.id,
        null,
        Number(fraudScore.toFixed(2)),
        JSON.stringify(fraudFlags),
        recommendation === 'APPROVE' ? 'APPROVED' : recommendation === 'REJECT' ? 'REJECTED' : 'PENDING',
        recommendation === 'APPROVE' ? payoutAmount : 0,
        1,
        eventType,
        severity,
        createdAt
      );
      const claim = db.prepare('SELECT * FROM claims WHERE id = ?').get(insertResult.lastInsertRowid);

      if (recommendation === 'APPROVE') {
        db.prepare(`
          INSERT INTO payouts (claim_id, worker_id, amount_inr, upi_id, transaction_id, status, processed_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(
          claim.id,
          worker.id,
          payoutAmount,
          `worker${worker.id}@upi`,
          `TX${Date.now()}${worker.id}`,
          'SUCCESS',
          createdAt
        );
      }

      return claim;
    })
    .filter(Boolean);

  if (type) {
    disruptions.push({
      id: disruptions.length + 1,
      city: zone,
      zone,
      type,
      severity,
      started_at: new Date().toISOString(),
      ended_at: new Date(Date.now() + disruption_hours * 60 * 60 * 1000).toISOString(),
      active: true,
      payout_hours: disruption_hours,
      affected_workers_count: createdClaims.length
    });
  }

  res.json({ triggered: createdClaims.length, claims: createdClaims });
});

router.get('/', (req, res) => {
  const result = db.prepare('SELECT * FROM claims WHERE worker_id = ? ORDER BY created_at DESC')
    .all(req.worker.id);
  res.json(result);
});

router.get('/:id', (req, res) => {
  const claim = db.prepare('SELECT * FROM claims WHERE id = ? AND worker_id = ?')
    .get(Number(req.params.id), req.worker.id);
  if (!claim) return res.status(404).json({ error: 'claim not found' });
  res.json(claim);
});

module.exports = router;
