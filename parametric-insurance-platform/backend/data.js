const workers = [];
const policies = [];
const claims = [];
const disruptions = [];
const payouts = [];
const workerGpsLog = [];

const zoneCoords = {
  Mumbai: { lat: 19.076, lng: 72.8777 },
  Delhi: { lat: 28.7041, lng: 77.1025 },
  Bengaluru: { lat: 12.9716, lng: 77.5946 },
  Kolkata: { lat: 22.5726, lng: 88.3639 },
  Chennai: { lat: 13.0827, lng: 80.2707 },
  Hyderabad: { lat: 17.385, lng: 78.4867 },
  Pune: { lat: 18.5204, lng: 73.8567 },
  Jaipur: { lat: 26.9124, lng: 75.7873 },
  Ahmedabad: { lat: 23.0225, lng: 72.5714 },
  Lucknow: { lat: 26.8467, lng: 80.9462 }
};

const tierConfig = {
  Basic: { base_premium: 29, daily_cover: 300, max_payout: 900 },
  Standard: { base_premium: 49, daily_cover: 500, max_payout: 1500 },
  Premium: { base_premium: 79, daily_cover: 700, max_payout: 2100 }
};

const riskProfiles = {
  Mumbai: { flood_history: 75, aqi_avg: 55, curfew_incidents: 20, disruption_freq: 65 },
  Delhi: { flood_history: 35, aqi_avg: 85, curfew_incidents: 25, disruption_freq: 70 },
  Bengaluru: { flood_history: 30, aqi_avg: 40, curfew_incidents: 10, disruption_freq: 35 },
  Kolkata: { flood_history: 60, aqi_avg: 60, curfew_incidents: 18, disruption_freq: 55 },
  Chennai: { flood_history: 70, aqi_avg: 50, curfew_incidents: 12, disruption_freq: 50 },
  Hyderabad: { flood_history: 45, aqi_avg: 45, curfew_incidents: 10, disruption_freq: 40 },
  Pune: { flood_history: 35, aqi_avg: 40, curfew_incidents: 8, disruption_freq: 35 },
  Jaipur: { flood_history: 40, aqi_avg: 60, curfew_incidents: 15, disruption_freq: 45 },
  Ahmedabad: { flood_history: 38, aqi_avg: 55, curfew_incidents: 12, disruption_freq: 42 },
  Lucknow: { flood_history: 45, aqi_avg: 65, curfew_incidents: 18, disruption_freq: 50 }
};

module.exports = {
  workers,
  policies,
  claims,
  disruptions,
  payouts,
  workerGpsLog,
  zoneCoords,
  tierConfig,
  riskProfiles
};
