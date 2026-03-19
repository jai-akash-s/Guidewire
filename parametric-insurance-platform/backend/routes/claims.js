const express = require('express');
const router = express.Router();
const { claims, policies, workers, disruptions, payouts } = require('../data');
const {
  calculatePayout,
  getZoneCentre,
  isWithinKm,
  startOfWeek,
  claimsInWindow,
  daysBetween
} = require('../utils');
let nextClaimId = 1;

router.post('/', (req, res) => {
  const { policy_id, disruption_id, disruption_hours = 4 } = req.body;
  const policy = policies.find(p => p.id === Number(policy_id));
  if (!policy) return res.status(404).json({ error: 'policy not found' });
  const worker = workers.find(w => w.id === policy.worker_id);
  if (!worker) return res.status(404).json({ error: 'worker not found' });

  const payoutAmount = calculatePayout({
    policyTier: policy.tier,
    avg_daily_earnings: worker.avg_weekly_earnings / 7,
    disruption_hours,
    weekly_earnings: worker.avg_weekly_earnings
  });

  const claim = {
    id: nextClaimId++,
    worker_id: worker.id,
    policy_id: policy.id,
    disruption_id: disruption_id || null,
    fraud_score: 0.15,
    fraud_flags: [],
    status: 'APPROVED',
    payout_amount_inr: payoutAmount,
    auto_triggered: false,
    created_at: new Date().toISOString()
  };

  claims.push(claim);
  payouts.push({
    id: payouts.length + 1,
    claim_id: claim.id,
    worker_id: worker.id,
    amount_inr: payoutAmount,
    upi_id: `worker${worker.id}@upi`,
    transaction_id: `TX${Date.now()}`,
    status: 'SUCCESS',
    processed_at: new Date().toISOString()
  });
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
  const activePolicies = policies.filter(p => p.zone === zone && p.status === 'ACTIVE');
  if (!activePolicies.length) return res.status(404).json({ error: 'No active policies in zone' });

  const zoneCentre = epicentre || getZoneCentre(zone);
  const now = new Date();
  const startWeek = startOfWeek(now);
  const endWeek = new Date(startWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
  const last4WeeksStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

  const createdClaims = activePolicies
    .map(policy => {
      const worker = workers.find(w => w.id === policy.worker_id);
      if (!worker) return null;

      const claimsThisWeek = claimsInWindow(claims, worker.id, startWeek, endWeek);
      const claimsLast4Weeks = claimsInWindow(claims, worker.id, last4WeeksStart, now);
      const avgWeeklyClaims = claimsLast4Weeks.length / 4;

      const fraudFlags = [];
      let fraudScore = 0.1;
      let recommendation = 'APPROVE';

      const eventType = type || 'PARAMETRIC_EVENT';
      const windowStart = new Date(Date.now() - disruption_hours * 60 * 60 * 1000);
      const duplicate = claims.find(
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

      const claim = {
        id: nextClaimId++,
        worker_id: worker.id,
        policy_id: policy.id,
        disruption_id: null,
        fraud_score: Number(fraudScore.toFixed(2)),
        fraud_flags: fraudFlags,
        status: recommendation === 'APPROVE' ? 'APPROVED' : recommendation === 'REJECT' ? 'REJECTED' : 'PENDING',
        payout_amount_inr: recommendation === 'APPROVE' ? payoutAmount : 0,
        auto_triggered: true,
        event_type: eventType,
        event_severity: severity,
        created_at: new Date().toISOString()
      };

      claims.push(claim);

      if (recommendation === 'APPROVE') {
        payouts.push({
          id: payouts.length + 1,
          claim_id: claim.id,
          worker_id: worker.id,
          amount_inr: payoutAmount,
          upi_id: `worker${worker.id}@upi`,
          transaction_id: `TX${Date.now()}${worker.id}`,
          status: 'SUCCESS',
          processed_at: new Date().toISOString()
        });
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
  const worker = req.worker;
  res.json(claims.filter(c => c.worker_id === worker.id));
});

router.get('/:id', (req, res) => {
  const worker = req.worker;
  const claim = claims.find(c => c.id === Number(req.params.id) && c.worker_id === worker.id);
  if (!claim) return res.status(404).json({ error: 'claim not found' });
  res.json(claim);
});

module.exports = router;
