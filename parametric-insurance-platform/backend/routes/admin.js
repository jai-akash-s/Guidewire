const express = require('express');
const router = express.Router();
const axios = require('axios');
const { workers, policies, disruptions, claims, payouts } = require('../data');

router.get('/dashboard', (req, res) => {
  const activePolicies = policies.filter(p => p.status === 'ACTIVE').length;
  const weekClaims = claims.filter(c => new Date(c.created_at) > new Date(Date.now() - 7 * 24 * 3600 * 1000)).length;
  const totalPayout = payouts.reduce((acc, p) => acc + Number(p.amount_inr || 0), 0);
  const fraudFlags = claims.filter(c => c.fraud_score >= 0.8 || c.status === 'REJECTED').length;
  res.json({ activePolicies, weekClaims, totalPayout, fraudFlags });
});

router.get('/fraud-flags', (req, res) => {
  res.json(claims.filter(c => c.fraud_score >= 0.8 || (c.fraud_flags || []).length));
});

router.get('/payouts/pending', (req, res) => {
  res.json(payouts.filter(p => p.status !== 'SUCCESS'));
});

router.put('/payouts/:id', (req, res) => {
  const payout = payouts.find(p => p.id === Number(req.params.id));
  if (!payout) return res.status(404).json({ error: 'payout not found' });
  const { status } = req.body;
  payout.status = status || payout.status;
  payout.processed_at = new Date().toISOString();
  res.json(payout);
});

router.post('/simulate', (req, res) => {
  const { action } = req.body;
  const now = new Date();
  const apiBase = process.env.API_BASE || 'http://localhost:5000';
  const headers = process.env.AI_SERVICE_KEY ? { 'x-ai-key': process.env.AI_SERVICE_KEY } : {};
  if (action === 'MUMBAI_FLOOD') {
    disruptions.push({
      id: disruptions.length + 1,
      city: 'Mumbai',
      zone: 'Mumbai',
      type: 'RAIN',
      severity: 9,
      started_at: now.toISOString(),
      ended_at: new Date(now.getTime() + 3 * 60 * 60 * 1000).toISOString(),
      active: true,
      payout_hours: 3,
      affected_workers_count: policies.filter(p => p.zone === 'Mumbai').length
    });
    axios.post(`${apiBase}/api/claims/trigger`, { zone: 'Mumbai', type: 'RAIN', severity: 9, disruption_hours: 3 }, { headers }).catch(() => {});
  }
  if (action === 'DELHI_AQI') {
    disruptions.push({
      id: disruptions.length + 1,
      city: 'Delhi',
      zone: 'Delhi',
      type: 'AQI',
      severity: 8,
      started_at: now.toISOString(),
      ended_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
      active: true,
      payout_hours: 8,
      affected_workers_count: policies.filter(p => p.zone === 'Delhi').length
    });
    axios.post(`${apiBase}/api/claims/trigger`, { zone: 'Delhi', type: 'AQI', severity: 8, disruption_hours: 8 }, { headers }).catch(() => {});
  }
  if (action === 'ZOMATO_OUTAGE') {
    disruptions.push({
      id: disruptions.length + 1,
      city: 'National',
      zone: 'National',
      type: 'APP_OUTAGE',
      severity: 7,
      started_at: now.toISOString(),
      ended_at: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
      active: true,
      payout_hours: 2,
      affected_workers_count: policies.filter(p => p.platform === 'Zomato').length
    });
    axios.post(`${apiBase}/api/claims/trigger`, { zone: 'National', type: 'APP_OUTAGE', severity: 7, disruption_hours: 2 }, { headers }).catch(() => {});
  }
  res.json({ status: 'ok', disruptions: disruptions.slice(-3) });
});

module.exports = router;
