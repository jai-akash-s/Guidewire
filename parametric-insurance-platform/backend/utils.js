const { zoneCoords, tierConfig, riskProfiles } = require('./data');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function riskTier(score) {
  if (score > 70) return 'High';
  if (score < 30) return 'Low';
  return 'Medium';
}

function calculateRiskScore({ city, avg_weekly_earnings = 5000 }) {
  const profile = riskProfiles[city] || {
    flood_history: 45,
    aqi_avg: 50,
    curfew_incidents: 15,
    disruption_freq: 45
  };
  const earnings_volatility = Math.min(100, (avg_weekly_earnings / 8000) * 100);
  const score = Math.round(
    profile.flood_history * 0.3 +
      profile.aqi_avg * 0.2 +
      profile.curfew_incidents * 0.2 +
      Math.max(profile.disruption_freq, earnings_volatility) * 0.3
  );
  return { risk_score: score, risk_tier: riskTier(score) };
}

function applyRiskAdjustment(base, riskScore) {
  if (riskScore > 70) return base * 1.2;
  if (riskScore < 30) return base * 0.85;
  return base;
}

function premiumForTier(tier, riskScore) {
  const base = tierConfig[tier]?.base_premium || tierConfig.Basic.base_premium;
  return Math.round(applyRiskAdjustment(base, riskScore));
}

function coverageForTier(tier) {
  const tierData = tierConfig[tier] || tierConfig.Basic;
  return { daily_cover_inr: tierData.daily_cover, max_payout_inr: tierData.max_payout };
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

function distanceKm(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  return 2 * R * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function isWithinKm(point, centre, km = 5) {
  return distanceKm(point, centre) <= km;
}

function startOfWeek(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

function claimsInWindow(claims, workerId, startTime, endTime) {
  return claims.filter(
    c =>
      c.worker_id === workerId &&
      new Date(c.created_at).getTime() >= startTime.getTime() &&
      new Date(c.created_at).getTime() <= endTime.getTime()
  );
}

function calculatePayout({ policyTier, avg_daily_earnings, disruption_hours, weekly_earnings }) {
  const tierMultipliers = { Basic: 0.8, Standard: 1.0, Premium: 1.3 };
  const multiplier = tierMultipliers[policyTier] || 1.0;
  const payout = (avg_daily_earnings / 10) * disruption_hours * multiplier;
  const cap = weekly_earnings * 0.6;
  return Math.round(Math.min(payout, cap));
}

function getZoneCentre(zone) {
  return zoneCoords[zone] || null;
}

function daysBetween(a, b) {
  return Math.round((a.getTime() - b.getTime()) / MS_PER_DAY);
}

module.exports = {
  riskTier,
  calculateRiskScore,
  applyRiskAdjustment,
  premiumForTier,
  coverageForTier,
  distanceKm,
  isWithinKm,
  startOfWeek,
  claimsInWindow,
  calculatePayout,
  getZoneCentre,
  daysBetween
};
