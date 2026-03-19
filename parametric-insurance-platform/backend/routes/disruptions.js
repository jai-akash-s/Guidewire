const express = require('express');
const router = express.Router();
const { disruptions } = require('../data');

function expireDisruptions() {
  const now = Date.now();
  disruptions.forEach(d => {
    if (d.active && d.ended_at && new Date(d.ended_at).getTime() <= now) {
      d.active = false;
    }
  });
}

router.get('/live', (req, res) => {
  expireDisruptions();
  const zone = req.worker?.zone;
  const active = disruptions.filter(d => d.active);
  res.json(zone ? active.filter(d => d.zone === zone) : active);
});

router.get('/history/:city', (req, res) => {
  expireDisruptions();
  const city = req.params.city;
  const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
  res.json(
    disruptions.filter(
      d => d.city.toLowerCase() === city.toLowerCase() && new Date(d.started_at).getTime() >= cutoff
    )
  );
});

router.post('/simulate', (req, res) => {
  const { city, zone, type, severity = 7, durationMinutes = 120, payout_hours = 4 } = req.body;
  const now = new Date();
  const newDis = {
    id: disruptions.length + 1,
    city,
    zone,
    type,
    severity,
    started_at: now.toISOString(),
    ended_at: new Date(now.getTime() + durationMinutes * 60000).toISOString(),
    active: true,
    payout_hours,
    affected_workers_count: 0
  };
  disruptions.push(newDis);
  res.status(201).json(newDis);
});

module.exports = router;
