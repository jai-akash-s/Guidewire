const express = require('express');
const router = express.Router();
const { policies, workers } = require('../data');
const { premiumForTier, coverageForTier } = require('../utils');

let nextPolicyId = 1;

// Create policy (Zomato delivery partner)
router.post('/', (req, res) => {
  const { worker_id, tier = 'Standard', auto_renew = true } = req.body;
  const worker = workers.find(w => w.id === Number(worker_id));
  if (!worker) {
    return res.status(400).json({ error: 'valid worker_id required' });
  }
  if (!['Basic', 'Standard', 'Premium'].includes(tier)) {
    return res.status(400).json({ error: 'invalid tier' });
  }

  const weekly_premium_inr = premiumForTier(tier, worker.risk_score);
  const coverage = coverageForTier(tier);
  const policy = {
    id: nextPolicyId++,
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

router.get('/', (req, res) => {
  const { worker_id } = req.query;
  if (worker_id) {
    return res.json(policies.filter(p => p.worker_id === Number(worker_id)));
  }
  res.json(policies);
});

router.get('/:policyId', (req, res) => {
  const policy = policies.find(p => p.id === Number(req.params.policyId));
  if (!policy) return res.status(404).json({ error: 'policy not found' });
  res.json(policy);
});

module.exports = router;
