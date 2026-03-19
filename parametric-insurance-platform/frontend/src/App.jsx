import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, Route, Routes, useNavigate, useLocation } from 'react-router-dom';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from 'recharts';

const worker = {
  name: 'Anika Rao',
  city: 'Mumbai',
  zone: 'Mumbai Central',
  platform: 'Zomato',
  avg_weekly_earnings: 6400,
  risk_score: 68,
  risk_tier: 'Medium',
  active_policy: 'Standard',
  policy_status: 'Active',
  earnings_protected: 1500
};

const payouts = [
  { week: 'Wk-1', amount: 420 },
  { week: 'Wk-2', amount: 0 },
  { week: 'Wk-3', amount: 780 },
  { week: 'Wk-4', amount: 0 }
];

const earningsData = [
  { week: 'Wk-1', earnings: 6100, payouts: 420 },
  { week: 'Wk-2', earnings: 5800, payouts: 0 },
  { week: 'Wk-3', earnings: 6400, payouts: 780 },
  { week: 'Wk-4', earnings: 6000, payouts: 0 },
  { week: 'Wk-5', earnings: 6300, payouts: 0 },
  { week: 'Wk-6', earnings: 6500, payouts: 520 },
  { week: 'Wk-7', earnings: 5900, payouts: 0 },
  { week: 'Wk-8', earnings: 6700, payouts: 900 }
];

const claimsByType = [
  { type: 'Rain', claims: 48 },
  { type: 'Heat', claims: 26 },
  { type: 'AQI', claims: 31 },
  { type: 'Curfew', claims: 18 },
  { type: 'App Outage', claims: 21 }
];

const lossRatioData = [
  { week: 'Wk-1', premiums: 46000, payouts: 32000 },
  { week: 'Wk-2', premiums: 48000, payouts: 21000 },
  { week: 'Wk-3', premiums: 50000, payouts: 36000 },
  { week: 'Wk-4', premiums: 52000, payouts: 41000 }
];

const tierDistribution = [
  { name: 'Basic', value: 35 },
  { name: 'Standard', value: 45 },
  { name: 'Premium', value: 20 }
];

const predictionData = [
  { day: 'Mon', risk: 18 },
  { day: 'Tue', risk: 22 },
  { day: 'Wed', risk: 30 },
  { day: 'Thu', risk: 28 },
  { day: 'Fri', risk: 34 },
  { day: 'Sat', risk: 40 },
  { day: 'Sun', risk: 32 }
];

const cities = [
  'Mumbai',
  'Delhi',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad'
];

const workerTiers = [
  { name: 'Basic', price: 29, cover: '₹300/day', max: '₹900' },
  { name: 'Standard', price: 49, cover: '₹500/day', max: '₹1,500' },
  { name: 'Premium', price: 79, cover: '₹700/day', max: '₹2,100' }
];

const defaultClaimsFeed = [
  { id: 'CL-291', worker: 'Zara P.', type: 'RAIN', status: 'AUTO-APPROVE' },
  { id: 'CL-292', worker: 'Ishaan K.', type: 'AQI', status: 'REVIEW' },
  { id: 'CL-293', worker: 'Sana M.', type: 'HEAT', status: 'AUTO-APPROVE' },
  { id: 'CL-294', worker: 'Vikram D.', type: 'CURFEW', status: 'FLAG' }
];

const triggerBadges = ['Heavy Rain', 'Extreme Heat', 'Severe AQI', 'Curfew', 'App Outage'];

const getStoredLogin = () => window.sessionStorage.getItem('worker_logged_in') === 'true';

function Topbar({ showTabs = true, onLogout, isWorkerRoute = false }) {
  return (
    <header className="topbar">
      <div className="brand">
        <p className="eyebrow">GigShield Platform</p>
        <h1>AI Parametric Income Insurance for India's Delivery Partners</h1>
        <p className="subtitle">Weekly income protection for external disruptions. Zero claims paperwork.</p>
      </div>
      <div className="tab-group" role="tablist">
        {showTabs && (
          <>
            <Link className="tab-link" to="/worker">Worker Portal</Link>
            <Link className="tab-link" to="/admin">Insurer Admin</Link>
          </>
        )}
        {isWorkerRoute && (
          <button className="ghost" onClick={onLogout}>Logout</button>
        )}
      </div>
    </header>
  );
}

function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const submitLogin = (event) => {
    event.preventDefault();
    const phoneValid = phone.trim().length === 10;
    const otpValid = otp.trim().length === 4;
    if (phoneValid && otpValid) {
      onLogin();
      navigate('/worker');
    } else {
      setError('Enter a 10-digit phone number and a 4-digit OTP.');
    }
  };

  return (
    <main className="layout">
      <section className="login-panel">
        <div>
          <p className="eyebrow">Worker Access</p>
          <h2>Sign in to your GigShield account</h2>
          <p className="muted">Secure OTP login for delivery partners. No passwords required.</p>
        </div>
        <form className="login-form" onSubmit={submitLogin}>
          <label>
            Phone number
            <input
              type="tel"
              placeholder="Enter your phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value.replace(/\D/g, '').slice(0, 10))}
              maxLength={10}
              pattern="\d{10}"
              required
            />
          </label>
          <label>
            OTP
            <input
              type="text"
              placeholder="Enter 4-digit OTP"
              value={otp}
              onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 4))}
              maxLength={4}
              pattern="\d{4}"
              required
            />
          </label>
          {error && <p className="error-text">{error}</p>}
          <button type="submit" disabled={phone.trim().length !== 10 || otp.trim().length !== 4}>
            Verify & Enter
          </button>
          <p className="muted small">Demo tip: Use any 10-digit number and any 4-digit OTP.</p>
        </form>
        <div className="login-benefits">
          <div>
            <h4>Instant Payouts</h4>
            <p>Automated payouts when disruptions halt deliveries.</p>
          </div>
          <div>
            <h4>Weekly Pricing</h4>
            <p>Aligned with the way you earn on platforms.</p>
          </div>
          <div>
            <h4>Income Only</h4>
            <p>No health, life, accident, or vehicle repair cover — income only.</p>
          </div>
        </div>
      </section>
    </main>
  );
}

function WorkerDashboard() {
  const [liveAlert, setLiveAlert] = useState('None');

  return (
    <main className="layout">
      <section className="hero-card">
        <div className="hero-left">
          <div className="pill-row">
            <span className={`pill ${worker.policy_status === 'Active' ? 'pill-good' : 'pill-warn'}`}>
              {worker.policy_status}
            </span>
            <span className="pill pill-outline">Plan: {worker.active_policy}</span>
          </div>
          <h2>Hello {worker.name}</h2>
          <p className="muted">
            {worker.platform} partner in {worker.city} • Zone: {worker.zone}
          </p>
          <div className="trigger-strip">
            {triggerBadges.map(label => (
              <span key={label} className="trigger-pill">{label}</span>
            ))}
          </div>
        </div>
        <div className="hero-metrics">
          <div>
            <p className="metric-label">Earnings Protected</p>
            <p className="metric-value">₹{worker.earnings_protected}</p>
            <p className="muted">This week</p>
          </div>
          <div>
            <p className="metric-label">Avg Weekly Earnings</p>
            <p className="metric-value">₹{worker.avg_weekly_earnings}</p>
            <p className="muted">Last 8 weeks</p>
          </div>
        </div>
      </section>

      <section className="card-row worker-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Your Week, Protected</h3>
              <p className="muted">Built for food delivery partners</p>
            </div>
            <span className="pill pill-outline">Persona</span>
          </div>
          <p className="narrative">
            When heavy rain, curfews, or sudden zone closures hit, your delivery hours drop. GigShield watches
            your zone in real time and automatically protects the income you would have earned.
          </p>
          <div className="narrative-steps">
            <div>
              <span className="step-dot">1</span>
              <p>We detect disruptions in your delivery zone.</p>
            </div>
            <div>
              <span className="step-dot">2</span>
              <p>AI validates the event and triggers your claim.</p>
            </div>
            <div>
              <span className="step-dot">3</span>
              <p>Payout reaches you automatically.</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>Live Weather</h3>
              <p className="muted">{worker.city} • 32°C • Humidity 78%</p>
            </div>
            <span className="pill pill-outline">Updated 2 min ago</span>
          </div>
          <div className="weather-grid">
            <div>
              <span>Rainfall</span>
              <strong>2mm/hr</strong>
            </div>
            <div>
              <span>AQI</span>
              <strong>210</strong>
            </div>
            <div>
              <span>Visibility</span>
              <strong>6km</strong>
            </div>
          </div>
          <div className={`alert ${liveAlert === 'None' ? '' : 'active'}`} role="status" aria-live="polite">
            <div>
              <strong>Disruption Alert</strong>
              <p>{liveAlert}</p>
            </div>
            <button
              onClick={() => setLiveAlert(liveAlert === 'None' ? 'Heavy Rain Detected' : 'None')}
              aria-label="Toggle disruption alert"
            >
              Toggle Alert
            </button>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>My Zone Risk Score</h3>
              <p className="muted">Weekly recalculated</p>
            </div>
            <span className={`pill ${worker.risk_tier === 'High' ? 'pill-warn' : 'pill-good'}`}>
              {worker.risk_tier} Risk
            </span>
          </div>
          <div className="risk-score">
            <div>
              <strong>{worker.risk_score}</strong>
              <p className="muted">Risk Index</p>
            </div>
            <div className="risk-bar">
              <div style={{ width: `${worker.risk_score}%` }} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>Weekly Plan Selection</h3>
              <p className="muted">AI-adjusted premiums</p>
            </div>
          </div>
          <div className="tier-grid">
            {workerTiers.map(tier => (
              <div className="tier-card" key={tier.name}>
                <div>
                  <h4>{tier.name}</h4>
                  <p className="muted">{tier.cover} • Max {tier.max}</p>
                </div>
                <div className="tier-cta">
                  <p className="price">₹{tier.price}/wk</p>
                  <button>Choose</button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>Coverage Scope</h3>
              <p className="muted">Income protection only</p>
            </div>
            <span className="pill pill-outline">Weekly Model</span>
          </div>
          <ul className="scope-list">
            <li>Lost earnings due to weather, AQI, curfew, outage</li>
            <li>No health, life, accident, or vehicle repair coverage</li>
            <li>Payouts align with weekly earning cycles</li>
          </ul>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>How It Works</h3>
              <p className="muted">Zero-touch, AI-driven flow</p>
            </div>
          </div>
          <ol className="flow-list">
            <li>GigShield monitors your zone for disruptions.</li>
            <li>AI validates risk and auto-triggers claims.</li>
            <li>Payouts are calculated and sent instantly.</li>
          </ol>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>Weekly Pricing Explained</h3>
              <p className="muted">Transparent, earnings-aligned</p>
            </div>
            <span className="pill pill-outline">₹ / week</span>
          </div>
          <div className="pricing-grid">
            <div>
              <p className="metric-label">Base tier premium</p>
              <p className="metric-value">₹29 / ₹49 / ₹79</p>
              <p className="muted">Basic • Standard • Premium</p>
            </div>
            <div>
              <p className="metric-label">AI risk adjustment</p>
              <p className="metric-value">±20%</p>
              <p className="muted">Based on zone disruption risk</p>
            </div>
          </div>
          <p className="muted">
            Weekly pricing matches how delivery partners earn—so coverage and payouts map cleanly to your week.
          </p>
        </div>
      </section>

      <section className="card-row worker-grid two-col">
        <div className="card">
          <div className="card-header">
            <h3>Payout History</h3>
            <span className="pill pill-outline">Last 4 weeks</span>
          </div>
          <div className="payouts">
            {payouts.map(p => (
              <div key={p.week} className="payout-row">
                <span>{p.week}</span>
                <strong>₹{p.amount}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="card span-2">
          <div className="card-header">
            <h3>Weekly Earnings vs Payouts</h3>
            <span className="pill pill-outline">8-week trend</span>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={earningsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2f" />
                <XAxis dataKey="week" stroke="#9aa0b4" />
                <YAxis stroke="#9aa0b4" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="earnings" stroke="#5EE4D6" strokeWidth={2} />
                <Line type="monotone" dataKey="payouts" stroke="#F8B26A" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="card-row worker-grid two-col">
        <div className="card">
          <div className="card-header">
            <h3>Zone Risk Heatmap</h3>
            <span className="pill pill-outline">City grid</span>
          </div>
          <div className="heatmap">
            {cities.map(city => (
              <div key={city} className={`heat ${city === 'Delhi' ? 'high' : city === 'Mumbai' ? 'med' : 'low'}`}>
                <span>{city}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Policy Renewal Calendar</h3>
            <span className="pill pill-outline">Next 6 weeks</span>
          </div>
          <div className="calendar">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div key={`wk-${idx}`} className={`cal-cell ${idx === 2 ? 'active' : ''}`}>
                <span>Week {idx + 1}</span>
                <strong>{idx === 2 ? 'Renewal' : 'Active'}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function AdminDashboard() {
  const [simulationFeed, setSimulationFeed] = useState([]);
  const simulationTimersRef = useRef([]);
  const weekLabel = useMemo(() => 'Week of Mar 17', []);

  const triggerSimulation = (label, stages) => {
    simulationTimersRef.current.forEach(id => clearTimeout(id));
    simulationTimersRef.current = [];
    setSimulationFeed([]);
    const timers = stages.map((stage, index) =>
      setTimeout(() => {
        setSimulationFeed(prev => [{ id: `${label}-${index}`, text: stage }, ...prev].slice(0, 6));
      }, 1200 * (index + 1))
    );
    simulationTimersRef.current = timers;
  };

  useEffect(() => {
    return () => simulationTimersRef.current.forEach(id => clearTimeout(id));
  }, []);

  return (
    <main className="layout">
      <section className="stats-grid">
        <div className="stat-card">
          <p>Active Policies</p>
          <h3>2,847</h3>
        </div>
        <div className="stat-card">
          <p>Claims This Week</p>
          <h3>143</h3>
        </div>
        <div className="stat-card">
          <p>Total Payout</p>
          <h3>₹71,500</h3>
        </div>
        <div className="stat-card">
          <p>Fraud Flags</p>
          <h3>12</h3>
        </div>
        <span className="week-label">{weekLabel}</span>
      </section>

      <section className="card-row">
        <div className="card">
          <div className="card-header">
            <h3>Live Disruption Map</h3>
            <span className="pill pill-outline">City grid</span>
          </div>
          <div className="heatmap">
            {cities.map(city => (
              <div key={city} className={`heat ${city === 'Delhi' ? 'high' : city === 'Mumbai' ? 'med' : 'low'}`}>
                <span>{city}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <h3>Claims Feed</h3>
              <p className="muted">Real-time approvals</p>
            </div>
            <span className="pill pill-outline">Live</span>
          </div>
          <div className="claim-list">
            {defaultClaimsFeed.map(item => (
              <div key={item.id} className="claim-item">
                <div>
                  <strong>{item.id}</strong>
                  <p className="muted">{item.worker}</p>
                </div>
                <span className="pill pill-outline">{item.type}</span>
                <span className={`pill ${item.status === 'FLAG' ? 'pill-warn' : 'pill-good'}`}>{item.status}</span>
                <div className="claim-actions">
                  <button>Approve</button>
                  <button className="ghost">Flag</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="card-row">
        <div className="card">
          <div className="card-header">
            <h3>Claims by Disruption Type</h3>
            <span className="pill pill-outline">This week</span>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={claimsByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2f" />
                <XAxis dataKey="type" stroke="#9aa0b4" />
                <YAxis stroke="#9aa0b4" />
                <Tooltip />
                <Bar dataKey="claims" fill="#5EE4D6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Loss Ratio</h3>
            <span className="pill pill-outline">Premiums vs Payouts</span>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={lossRatioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2f" />
                <XAxis dataKey="week" stroke="#9aa0b4" />
                <YAxis stroke="#9aa0b4" />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="premiums" stroke="#6C9EFF" strokeWidth={2} />
                <Line type="monotone" dataKey="payouts" stroke="#F58C8C" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="card-row">
        <div className="card">
          <div className="card-header">
            <h3>Policy Tier Distribution</h3>
            <span className="pill pill-outline">Portfolio mix</span>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={tierDistribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#6C9EFF" label />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3>7-Day Disruption Forecast</h3>
            <span className="pill pill-outline">ML prediction</span>
          </div>
          <div className="chart">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={predictionData}>
                <defs>
                  <linearGradient id="risk" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F8B26A" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="#F8B26A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2f" />
                <XAxis dataKey="day" stroke="#9aa0b4" />
                <YAxis stroke="#9aa0b4" />
                <Tooltip />
                <Area type="monotone" dataKey="risk" stroke="#F8B26A" fillOpacity={1} fill="url(#risk)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="card-row">
        <div className="card">
          <div className="card-header">
            <div>
              <h3>Eligibility & Exclusions</h3>
              <p className="muted">Compliance with challenge constraints</p>
            </div>
            <span className="pill pill-outline">Income Only</span>
          </div>
          <ul className="scope-list">
            <li>Coverage applies only to income loss during external disruptions.</li>
            <li>No health, life, accident, or vehicle repair payouts.</li>
            <li>Weekly premium and payout model aligned to gig-worker cycles.</li>
          </ul>
        </div>
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h3>Simulation Panel</h3>
            <p className="muted">Live pipeline: trigger → fraud → payout</p>
          </div>
        </div>
        <div className="sim-buttons">
          <button
            onClick={() =>
              triggerSimulation('mumbai', [
                'Mumbai Flood Triggered (25mm/hr)',
                '42 claims auto-triggered',
                'Fraud checks complete • 5 flagged',
                'Payouts calculated • ₹1.2L',
                'Disbursed via Mock UPI'
              ])
            }
          >
            Trigger Mumbai Flood
          </button>
          <button
            onClick={() =>
              triggerSimulation('delhi', [
                'Delhi AQI Alert (AQI 350)',
                '31 claims auto-triggered',
                'Fraud checks complete • 2 flagged',
                'Payouts calculated • ₹86k',
                'Disbursed via Mock UPI'
              ])
            }
          >
            Trigger Delhi AQI Alert
          </button>
          <button
            onClick={() =>
              triggerSimulation('zomato', [
                'Zomato Outage Detected',
                'Nationwide claims queued',
                'Fraud checks complete • 8 flagged',
                'Payouts calculated • ₹2.1L',
                'Disbursed via Mock UPI'
              ])
            }
          >
            Trigger Zomato Outage
          </button>
        </div>
        <div className="sim-feed">
          {simulationFeed.length === 0 ? (
            <p className="muted">Run a simulation to view the live pipeline.</p>
          ) : (
            simulationFeed.map(item => (
              <div key={item.id} className="sim-item">
                {item.text}
              </div>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function AppRoutes() {
  const [workerLoggedIn, setWorkerLoggedIn] = useState(getStoredLogin());
  const location = useLocation();

  const handleLogin = () => {
    window.sessionStorage.setItem('worker_logged_in', 'true');
    setWorkerLoggedIn(true);
  };

  const handleLogout = () => {
    window.sessionStorage.setItem('worker_logged_in', 'false');
    setWorkerLoggedIn(false);
  };

  const isWorkerRoute = location.pathname.startsWith('/worker');

  return (
    <div className="app-shell">
      <div className="container">
        <Topbar showTabs={!location.pathname.startsWith('/login')} onLogout={handleLogout} isWorkerRoute={isWorkerRoute} />
        <Routes>
          <Route path="/" element={<Navigate to={workerLoggedIn ? '/worker' : '/login'} replace />} />
          <Route path="/login" element={<LoginPage onLogin={handleLogin} />} />
          <Route path="/worker" element={workerLoggedIn ? <WorkerDashboard /> : <Navigate to="/login" replace />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return <AppRoutes />;
}
