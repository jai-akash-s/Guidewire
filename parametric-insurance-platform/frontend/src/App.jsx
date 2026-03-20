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

const defaultWorker = {
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

const gigshieldWeeklyTiers = [
  { name: 'Basic', price: '₹49/week', payout: '₹800/day', cap: '₹3,200/week' },
  { name: 'Standard', price: '₹69/week', payout: '₹1,000/day', cap: '₹4,000/week' },
  { name: 'Premium', price: '₹99/week', payout: '₹1,200/day', cap: '₹5,000/week' }
];

const disruptionCoverage = [
  { event: 'Extreme Heat', trigger: 'Temp > 40°C for 3+ hrs', example: '₹1,000/day' },
  { event: 'Heavy Rain / Flood', trigger: 'Rain > 15mm/hr or flood alert', example: '₹800–₹1,200/day' },
  { event: 'Severe Pollution', trigger: 'AQI > 400', example: '₹1,000/day' },
  { event: 'Curfew / Strike', trigger: 'City curfew or verified strike', example: '₹1,000/day' },
  { event: 'Zone Closure', trigger: 'Police barricade / zone shutdown', example: '₹1,000/day' },
  { event: 'App Outage', trigger: 'Outage > 4 hrs', example: '₹800/day' },
  { event: 'GPS Failure', trigger: 'GPS error > 50% orders', example: '₹800/day' },
  { event: 'Infrastructure Halt', trigger: 'Roadblock / bridge closure', example: '₹1,000/day' }
];

const defaultClaimsFeed = [
  { id: 'CL-291', worker: 'Zara P.', type: 'RAIN', status: 'AUTO-APPROVE' },
  { id: 'CL-292', worker: 'Ishaan K.', type: 'AQI', status: 'REVIEW' },
  { id: 'CL-293', worker: 'Sana M.', type: 'HEAT', status: 'AUTO-APPROVE' },
  { id: 'CL-294', worker: 'Vikram D.', type: 'CURFEW', status: 'FLAG' }
];

const triggerBadges = ['Heavy Rain', 'Extreme Heat', 'Severe AQI', 'Curfew', 'App Outage'];

const API_BASE = 'http://localhost:5000/api';
const getToken = () => window.localStorage.getItem('gs_token');
const getStoredLogin = () => Boolean(getToken());
const saveSession = (token, worker) => {
  window.localStorage.setItem('gs_token', token);
  window.localStorage.setItem('gs_worker', JSON.stringify(worker));
};
const clearSession = () => {
  window.localStorage.removeItem('gs_token');
  window.localStorage.removeItem('gs_worker');
};
const getStoredWorker = () => {
  const raw = window.localStorage.getItem('gs_worker');
  return raw ? JSON.parse(raw) : null;
};

function Topbar({ showTabs = true, onLogout, isWorkerRoute = false }) {
  return (
    <header className="topbar">
      <div className="brand">
        <p className="eyebrow">GigShield Platform</p>
        <h1>AI Parametric Income Insurance for India's Delivery Partners</h1>
        <p className="subtitle">Instant payouts when disruptions hit. Zero claims paperwork.</p>
      </div>
      <div className="tab-group" role="tablist">
        {showTabs && !isWorkerRoute && (
          <>
            <Link className="tab-link" to="/worker">Worker Portal</Link>
            <Link className="tab-link" to="/admin">Insurer Admin</Link>
          </>
        )}
        {isWorkerRoute && (
          <nav className="subnav">
            <Link className="tab-link" to="/worker">Home</Link>
            <Link className="tab-link" to="/worker/policy">Policy</Link>
            <Link className="tab-link" to="/worker/claims">Claims</Link>
            <Link className="tab-link" to="/worker/simulation">Simulation</Link>
            <Link className="tab-link" to="/worker/onboarding">Onboarding</Link>
            <button className="ghost" onClick={onLogout}>Logout</button>
          </nav>
        )}
      </div>
    </header>
  );
}

function LoginPage({ onLogin }) {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submitLogin = async (event) => {
    event.preventDefault();
    const phoneValid = phone.trim().length === 10;
    const otpValid = otp.trim().length === 4;
    if (!phoneValid || !otpValid) {
      setError('Enter a 10-digit phone number and a 4-digit OTP.');
      return;
    }
    try {
      setLoading(true);
      setError('');
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: phone.trim() })
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Worker not found. Please complete onboarding.');
        }
        throw new Error(data.error || 'Login failed');
      }
      onLogin(data);
      navigate('/worker');
    } catch (err) {
      setError(err.message || 'Unable to login');
    } finally {
      setLoading(false);
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
          <button
            type="submit"
            className="primary"
            disabled={loading || phone.trim().length !== 10 || otp.trim().length !== 4}
          >
            {loading ? 'Verifying...' : 'Verify & Enter'}
          </button>
          <button
            type="button"
            className="soft"
            onClick={() => navigate('/worker/onboarding')}
          >
            New worker? Start onboarding
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
        </div>
      </section>
    </main>
  );
}

function WorkerDashboard() {
  const [liveAlert, setLiveAlert] = useState('None');
  const [profile, setProfile] = useState(getStoredWorker() || defaultWorker);
  const [selectedPlan, setSelectedPlan] = useState(defaultWorker.active_policy);
  const [activePolicy, setActivePolicy] = useState(null);
  const [payoutsData, setPayoutsData] = useState(payouts);
  const [statusNote, setStatusNote] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    const headers = { Authorization: `Bearer ${token}` };
    const loadProfile = async () => {
      const res = await fetch(`${API_BASE}/worker/profile`, { headers });
      if (res.ok) {
        const data = await res.json();
        setProfile({ ...data, policy_status: 'Active' });
        setSelectedPlan(data.active_policy || defaultWorker.active_policy);
      }
    };
    const loadPolicy = async () => {
      const res = await fetch(`${API_BASE}/worker/policy/active`, { headers });
      if (res.ok) {
        const data = await res.json();
        setActivePolicy(data);
        if (data?.tier) setSelectedPlan(data.tier);
      }
    };
    const loadPayouts = async () => {
      const res = await fetch(`${API_BASE}/worker/payouts`, { headers });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setPayoutsData(data.map((p, idx) => ({
          week: `Wk-${idx + 1}`,
          amount: p.amount_inr || 0
        })));
      }
    };
    loadProfile();
    loadPolicy();
    loadPayouts();
  }, []);

  return (
    <main className="layout">
      <section className="hero-card">
        <div className="hero-left">
          <div className="pill-row">
            <span className={`pill ${activePolicy ? 'pill-good' : 'pill-warn'}`}>
              {activePolicy ? 'Active' : 'Inactive'}
            </span>
            <span className="pill pill-outline">Plan: {activePolicy?.tier || selectedPlan}</span>
          </div>
          <h2>Hello {profile.name || defaultWorker.name}</h2>
          <p className="muted">
            {profile.platform || defaultWorker.platform} partner in {profile.city || defaultWorker.city} • Zone: {profile.zone || defaultWorker.zone}
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
            <p className="metric-value">₹{activePolicy?.max_payout_inr || defaultWorker.earnings_protected}</p>
            <p className="muted">This week</p>
          </div>
          <div>
            <p className="metric-label">Avg Weekly Earnings</p>
            <p className="metric-value">₹{profile.avg_weekly_earnings || defaultWorker.avg_weekly_earnings}</p>
            <p className="muted">Last 8 weeks</p>
          </div>
        </div>
      </section>

      {statusNote && <div className="action-banner">{statusNote}</div>}

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
              <p className="muted">{profile.city || defaultWorker.city} • 32°C • Humidity 78%</p>
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
              className="soft"
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
            <span className={`pill ${profile.risk_tier === 'High' ? 'pill-warn' : 'pill-good'}`}>
              {profile.risk_tier || defaultWorker.risk_tier} Risk
            </span>
          </div>
          <div className="risk-score">
            <div>
              <strong>{profile.risk_score || defaultWorker.risk_score}</strong>
              <p className="muted">Risk Index</p>
            </div>
            <div className="risk-bar">
              <div style={{ width: `${profile.risk_score || defaultWorker.risk_score}%` }} />
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
              <div
                className={`tier-card ${selectedPlan === tier.name ? 'selected' : ''}`}
                key={tier.name}
              >
                <div>
                  <h4>{tier.name}</h4>
                  <p className="muted">{tier.cover} • Max {tier.max}</p>
                </div>
                <div className="tier-cta">
                  <p className="price">₹{tier.price}/wk</p>
                  <button
                    className={selectedPlan === tier.name ? 'active' : 'primary'}
                    onClick={async () => {
                      setSelectedPlan(tier.name);
                      const token = getToken();
                      if (!token) return;
                      const res = await fetch(`${API_BASE}/worker/policy/create`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                        body: JSON.stringify({ tier: tier.name })
                      });
                      if (res.ok) {
                        const data = await res.json();
                        setActivePolicy(data);
                        setStatusNote(`Policy activated: ${data.tier} plan.`);
                      }
                    }}
                  >
                    {selectedPlan === tier.name ? 'Selected' : 'Choose'}
                  </button>
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
            {payoutsData.map(p => (
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e7eaf5" />
                <XAxis dataKey="week" stroke="#7a8194" />
                <YAxis stroke="#7a8194" />
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

function WorkerPolicyPage() {
  const [selectedPlan, setSelectedPlan] = useState(defaultWorker.active_policy);
  const [policyStatus, setPolicyStatus] = useState('');
  return (
    <main className="layout">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Weekly Protection Plans</p>
          <h2>Choose your weekly income protection</h2>
          <p className="muted">You must strictly exclude coverage for health, life, accidents, or vehicle repair.</p>
        </div>
        <button
          className="primary"
          onClick={async () => {
            const token = getToken();
            if (!token) return;
            const res = await fetch(`${API_BASE}/worker/policy/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
              body: JSON.stringify({ tier: selectedPlan })
            });
            if (res.ok) {
              const data = await res.json();
              setPolicyStatus(`Policy activated on ${data.tier} plan.`);
            }
          }}
        >
          Activate Weekly Policy
        </button>
      </section>
      {policyStatus && <div className="action-banner">{policyStatus}</div>}

      <section className="card-row plans-grid">
        {workerTiers.map(tier => (
          <div key={tier.name} className={`plan-card ${selectedPlan === tier.name ? 'selected' : ''}`}>
            <div>
              <h3>{tier.name}</h3>
              <p className="price-lg">₹{tier.price}/week</p>
              <p className="muted">Up to {tier.max} lost income/week</p>
            </div>
            <ul className="plan-features">
              <li>Rain, Heat, AQI, Curfew triggers</li>
              <li>Auto-claim & instant payout</li>
              <li>Weekly pricing model</li>
            </ul>
            <button
              className={selectedPlan === tier.name ? 'active' : 'primary'}
              onClick={() => setSelectedPlan(tier.name)}
            >
              {selectedPlan === tier.name ? 'Selected' : 'Choose Plan'}
            </button>
          </div>
        ))}
      </section>

      <section className="card">
        <div className="card-header">
          <div>
            <h3>GigShield Weekly — Product Snapshot</h3>
            <p className="muted">You must strictly exclude coverage for health, life, accidents, or vehicle repair.</p>
          </div>
          <span className="pill pill-outline">Weekly Only</span>
        </div>
        <p className="narrative">
          Weekly income protection for delivery riders when disruptions stop work. Payouts are for income loss only.
        </p>
        <div className="spec-grid">
          {gigshieldWeeklyTiers.map(tier => (
            <div key={tier.name} className="spec-card">
              <h4>{tier.name}</h4>
              <p className="price-lg">{tier.price}</p>
              <p className="muted">Payout: {tier.payout}</p>
              <p className="muted">Weekly Cap: {tier.cap}</p>
            </div>
          ))}
        </div>
        <div className="flowchart">
          <strong>Claims Flow</strong>
          <ol className="flow-list">
            <li>Trigger event detected</li>
            <li>Rider submits photo + GPS proof</li>
            <li>AI verifies disruption & location</li>
            <li>UPI payout within 24 hrs</li>
          </ol>
        </div>
        <div className="spec-table">
          <div className="spec-row spec-head">
            <span>Event</span>
            <span>Trigger</span>
            <span>Payout Example</span>
          </div>
          {disruptionCoverage.map(item => (
            <div key={item.event} className="spec-row">
              <span>{item.event}</span>
              <span>{item.trigger}</span>
              <span>{item.example}</span>
            </div>
          ))}
        </div>
        <p className="muted">
          Eligibility: 20+ rides/week verified via platform data (Swiggy/Zomato).
        </p>
        <p className="muted">
          Marketing copy: “When rain, curfews, or outages stop your rides, GigShield Weekly protects your income —
          instant UPI payout with zero paperwork.”
        </p>
      </section>
    </main>
  );
}

function WorkerClaimsPage() {
  const [statusNote, setStatusNote] = useState('');
  const [claims, setClaims] = useState([
    { id: 'CL-812', type: 'Heavy Rain', payout: 300, status: 'Approved', time: '19/3/2026, 2:04 pm' }
  ]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/claims`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data) && data.length) {
          setClaims(data.map(item => ({
            id: item.id,
            type: item.event_type || 'Disruption',
            payout: item.payout_amount_inr || 0,
            status: item.status || 'PENDING',
            time: item.created_at
          })));
        }
      })
      .catch(() => {});
  }, []);
  return (
    <main className="layout">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Claims</p>
          <h2>Protected Earnings & Claims</h2>
          <p className="muted">Auto-approved payouts for disrupted delivery hours.</p>
        </div>
      </section>
      {statusNote && <div className="action-banner">{statusNote}</div>}

      <section className="claims-list">
        {claims.map(claim => (
          <div key={claim.id} className="claim-item-wide">
            <div>
              <h3>{claim.type}</h3>
              <p className="muted">Heavy disruption affected deliveries in your zone.</p>
              <p className="muted">Payout: ₹{claim.payout}</p>
            </div>
            <div className="claim-status">
              <span className="pill pill-good">{claim.status}</span>
              <span className="muted">{claim.time}</span>
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}

function WorkerSimulationPage() {
  const [simStatus, setSimStatus] = useState('');
  const [activePolicy, setActivePolicy] = useState(null);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    fetch(`${API_BASE}/worker/policy/active`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.ok ? res.json() : null)
      .then(data => setActivePolicy(data))
      .catch(() => {});
  }, []);

  const simulateClaim = async (label, hours = 4) => {
    const token = getToken();
    if (!token) {
      setSimStatus('Please log in to simulate a claim.');
      return;
    }
    if (!activePolicy?.id) {
      setSimStatus('Activate a weekly policy first to simulate claims.');
      return;
    }
    const res = await fetch(`${API_BASE}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ policy_id: activePolicy.id, disruption_hours: hours })
    });
    if (res.ok) {
      setSimStatus(`${label} claim created. Check Claims page.`);
    } else {
      setSimStatus('Unable to create claim.');
    }
  };
  return (
    <main className="layout">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Simulation</p>
          <h2>Delivery Disruption Simulation</h2>
          <p className="muted">Simulate disruptions to create real claims for the logged-in worker.</p>
        </div>
      </section>
      {simStatus && <div className="action-banner">{simStatus}</div>}

      <section className="card">
        <div className="card-header">
          <div>
            <h3>Parametric Trigger Simulator</h3>
            <p className="muted">Simulate disruptions and auto-trigger claim approval.</p>
          </div>
        </div>
        <div className="sim-grid simple">
          {[
            { title: 'Heavy Rain', payout: '₹400' },
            { title: 'Severe Pollution', payout: '₹300' },
            { title: 'Zone Closure', payout: '₹350' },
            { title: 'Flood Alert', payout: '₹500' }
          ].map(item => (
            <div key={item.title} className="sim-card">
              <strong>{item.title}</strong>
              <p className="muted">Potential payout: {item.payout}</p>
              <button className="primary" onClick={() => simulateClaim(item.title, 4)}>
                Simulate
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

function WorkerOnboardingPage() {
  const [onboardNote, setOnboardNote] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    platform: 'Zomato',
    city: '',
    zone: '',
    avg_weekly_earnings: ''
  });
  const navigate = useNavigate();
  return (
    <main className="layout">
      <section className="page-hero">
        <div>
          <p className="eyebrow">Onboarding</p>
          <h2>Food Delivery Partner Onboarding</h2>
          <p className="muted">You must strictly exclude coverage for health, life, accidents, or vehicle repair.</p>
        </div>
      </section>
      {onboardNote && <div className="action-banner">{onboardNote}</div>}
      <section className="card onboarding-card">
        <h3>Register as a delivery partner</h3>
        <p className="muted">Zomato and Swiggy</p>
        <div className="onboarding-form">
          <input
            placeholder="Full Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
          />
          <input
            placeholder="Phone Number"
            value={form.phone}
            onChange={(event) => setForm({ ...form, phone: event.target.value.replace(/\D/g, '').slice(0, 10) })}
          />
          <select value={form.platform} onChange={(event) => setForm({ ...form, platform: event.target.value })}>
            <option>Zomato</option>
            <option>Swiggy</option>
          </select>
          <input
            placeholder="City (e.g., Chennai, Bangalore)"
            value={form.city}
            onChange={(event) => setForm({ ...form, city: event.target.value })}
          />
          <input
            placeholder="Zone (e.g., Mumbai Central)"
            value={form.zone}
            onChange={(event) => setForm({ ...form, zone: event.target.value })}
          />
          <input
            placeholder="Avg Weekly Earnings (₹)"
            value={form.avg_weekly_earnings}
            onChange={(event) => setForm({ ...form, avg_weekly_earnings: event.target.value.replace(/\D/g, '') })}
          />
          <button
            type="button"
            className="primary"
            onClick={async () => {
              try {
                const response = await fetch(`${API_BASE}/auth/register`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    name: form.name,
                    phone: form.phone,
                    platform: form.platform,
                    city: form.city,
                    zone: form.zone || form.city,
                    avg_weekly_earnings: Number(form.avg_weekly_earnings)
                  })
                });
                const data = await response.json();
                if (!response.ok) {
                  setOnboardNote(data.error || 'Unable to register');
                  return;
                }
                saveSession(data.token, data.worker);
                setOnboardNote('Onboarding submitted. Redirecting...');
                navigate('/worker');
              } catch (err) {
                setOnboardNote('Unable to register right now.');
              }
            }}
          >
            Start Protection
          </button>
          {onboardNote && <p className="muted">{onboardNote}</p>}
        </div>
      </section>
    </main>
  );
}

function AdminDashboard() {
  const [simulationFeed, setSimulationFeed] = useState([]);
  const [claimsFeed, setClaimsFeed] = useState(defaultClaimsFeed);
  const simulationTimersRef = useRef([]);
  const weekLabel = useMemo(() => 'Week of Mar 17', []);
  const navigate = useNavigate();

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

  const handleClaimAction = (id, nextStatus) => {
    setClaimsFeed(prev =>
      prev.map(item => (item.id === id ? { ...item, status: nextStatus } : item))
    );
  };

  return (
    <main className="layout">
      <section className="admin-strip">
        <div>
          <p className="eyebrow">Command Center</p>
          <h2>GigShield Admin</h2>
          <p className="muted">Admin privileges active • Real-time risk monitoring</p>
        </div>
        <div className="admin-badges">
          <span className="admin-pill">Coverage Active</span>
          <span className="admin-pill soft">Fraud Watch</span>
          <button className="ghost" onClick={() => navigate('/login')}>Sign Out</button>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card accent">
          <p>Active Policies</p>
          <h3>2,847</h3>
        </div>
        <div className="stat-card neutral">
          <p>Claims This Week</p>
          <h3>143</h3>
        </div>
        <div className="stat-card warn">
          <p>Total Payout</p>
          <h3>₹71,500</h3>
        </div>
        <div className="stat-card soft">
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
            {claimsFeed.map(item => (
              <div key={item.id} className="claim-item">
                <div className="claim-meta">
                  <strong>{item.id}</strong>
                  <p className="muted">{item.worker}</p>
                </div>
                <span className="pill pill-outline">{item.type}</span>
                <span className={`pill ${item.status === 'FLAG' ? 'pill-warn' : 'pill-good'}`}>{item.status}</span>
                <div className="claim-actions">
                  <button className="primary" onClick={() => handleClaimAction(item.id, 'APPROVED')}>
                    Approve
                  </button>
                  <button className="soft" onClick={() => handleClaimAction(item.id, 'FLAG')}>
                    Flag
                  </button>
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e7eaf5" />
                <XAxis dataKey="type" stroke="#7a8194" />
                <YAxis stroke="#7a8194" />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e7eaf5" />
                <XAxis dataKey="week" stroke="#7a8194" />
                <YAxis stroke="#7a8194" />
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
                <CartesianGrid strokeDasharray="3 3" stroke="#e7eaf5" />
                <XAxis dataKey="day" stroke="#7a8194" />
                <YAxis stroke="#7a8194" />
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

      <section className="card sim-shell">
        <div className="card-header">
          <div>
            <h3>Simulation Panel</h3>
            <p className="muted">Live pipeline: trigger → fraud → payout</p>
          </div>
          <span className="pill pill-outline">Auto-Claim</span>
        </div>
        <div className="sim-grid">
          <div className="sim-left">
            <div className="sim-callout">
              <div>
                <p className="eyebrow">Parametric Disruption Simulator</p>
                <h4>Trigger AI evaluation pipeline</h4>
                <p className="muted">Simulate events to observe auto-claim approvals.</p>
              </div>
              <div className="sim-buttons">
                <button
                  className="primary"
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
                  className="primary"
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
                  className="primary"
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
            </div>
          </div>
          <div className="sim-right">
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
          </div>
        </div>
      </section>
    </main>
  );
}

function AppRoutes() {
  const [workerLoggedIn, setWorkerLoggedIn] = useState(getStoredLogin());
  const location = useLocation();

  const handleLogin = (data) => {
    if (data?.token && data?.worker) {
      saveSession(data.token, data.worker);
      setWorkerLoggedIn(true);
    }
  };

  const handleLogout = () => {
    clearSession();
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
          <Route path="/worker/policy" element={workerLoggedIn ? <WorkerPolicyPage /> : <Navigate to="/login" replace />} />
          <Route path="/worker/claims" element={workerLoggedIn ? <WorkerClaimsPage /> : <Navigate to="/login" replace />} />
          <Route path="/worker/simulation" element={workerLoggedIn ? <WorkerSimulationPage /> : <Navigate to="/login" replace />} />
          <Route path="/worker/onboarding" element={<WorkerOnboardingPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return <AppRoutes />;
}
