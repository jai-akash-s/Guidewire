const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { policies, disruptions, zoneCoords } = require('./data');

const OPENWEATHER_KEY = process.env.OPENWEATHER_KEY || '';
const API_BASE = process.env.API_BASE || 'http://localhost:5000';

function readMock(file) {
  const filePath = path.join(__dirname, 'mocks', file);
  if (!fs.existsSync(filePath)) return [];
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function getWeather(city) {
  const coords = zoneCoords[city];
  if (!coords) return null;
  if (!OPENWEATHER_KEY) {
    const mock = readMock('weather.json').find(w => w.city === city);
    return mock || { rain: { '1h': 0 }, main: { temp: 32 }, visibility: 8000 };
  }
  try {
    const res = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${coords.lat}&lon=${coords.lng}&units=metric&appid=${OPENWEATHER_KEY}`
    );
    return res.data;
  } catch (err) {
    return null;
  }
}

async function runMonitor() {
  console.log('[triggerMonitor] checking disruptions...');
  const activeZones = [...new Set(policies.filter(p => p.status === 'ACTIVE').map(p => p.zone))];
  const curfew = readMock('curfew.json');
  const aqiData = readMock('aqi.json');
  const floodAlerts = readMock('flood_alerts.json');
  const outages = readMock('platform_outage.json');

  for (const zone of activeZones) {
    const weather = await getWeather(zone);
    const aqi = aqiData.find(a => a.city === zone)?.aqi ?? Math.floor(Math.random() * 500);
    const curfewActive = curfew.find(c => c.zone === zone && c.active);
    const floodActive = floodAlerts.find(f => f.zone === zone && f.active);

    const triggers = [];
    if (weather?.rain && weather.rain['1h'] > 15) triggers.push({ type: 'RAIN', hours: 1 });
    if (weather?.main?.temp > 43) triggers.push({ type: 'HEAT', hours: 1 });
    if (weather?.visibility && weather.visibility < 500) triggers.push({ type: 'VISIBILITY', hours: 1 });
    if (aqi > 300) triggers.push({ type: 'AQI', hours: 8 });
    if (curfewActive) triggers.push({ type: 'CURFEW', hours: curfewActive.duration_hours || 6 });
    if (floodActive) triggers.push({ type: 'FLOOD', hours: floodActive.duration_hours || 6 });

    const zoneOutages = outages.filter(o => o.active);
    if (zoneOutages.length) {
      triggers.push({ type: 'APP_OUTAGE', hours: zoneOutages[0].duration_hours || 2 });
    }

    for (const trigger of triggers) {
      disruptions.push({
        id: disruptions.length + 1,
        city: zone,
        zone,
        type: trigger.type,
        severity: 8,
        started_at: new Date().toISOString(),
        ended_at: new Date(Date.now() + trigger.hours * 60 * 60 * 1000).toISOString(),
        active: true,
        payout_hours: trigger.hours,
        affected_workers_count: policies.filter(p => p.zone === zone).length
      });

      await axios
        .post(`${API_BASE}/api/claims/trigger`, {
          zone,
          type: trigger.type,
          severity: 8,
          disruption_hours: trigger.hours
        })
        .catch(err => console.error('trigger error', err.message));
      console.log('triggered in zone', zone, trigger.type);
    }
  }
}

if (require.main === module) {
  runMonitor();
}

module.exports = { runMonitor };
