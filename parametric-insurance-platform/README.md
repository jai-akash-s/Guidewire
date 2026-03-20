# GigShield — AI Parametric Income Insurance for Food Delivery Partners

## Problem Statement & Persona
Food delivery partners on Zomato and Swiggy lose income when deliveries stop because of extreme weather, curfews, or platform outages. The persona is a full-time delivery partner in a metro city who depends on daily earnings and needs instant income protection without paperwork.

## Solution Overview
GigShield is an AI-powered parametric **income protection** platform for delivery partners in India. It monitors external disruption signals (rain, heat, AQI, curfews, platform downtime) and automatically triggers payouts when thresholds are breached. No claims filing is required — payouts are calculated and disbursed instantly after automated fraud checks.

## Parametric Triggers & Thresholds
| Trigger | Data Source | Threshold | Payout Hours |
|---|---|---|---|
| Heavy Rain | OpenWeatherMap | Rainfall > 15mm/hr | Per hour halted |
| Extreme Heat | OpenWeatherMap | Temp > 43°C | Per hour halted |
| Severe AQI | WAQI API | AQI > 300 | Full day covered |
| Local Curfew | Mock JSON | `curfew: true` for zone | Full duration |
| Platform Outage | Mock endpoint | Simulated downtime | Per hour down |

## Weekly Premium Model
Base premium is adjusted by AI risk score:

`weekly_premium = base_premium[tier] × (1 + risk_score / 200)`

AI adjustment rules:
- High-risk zone (score > 70): premium × 1.2
- Low-risk zone (score < 30): premium × 0.85

Base tiers:
- Basic: ₹29/week, ₹300/day, max ₹900
- Standard: ₹49/week, ₹500/day, max ₹1,500
- Premium: ₹79/week, ₹700/day, max ₹2,100

## GigShield Weekly — Hackathon Product Spec
**Tagline:** Weekly income protection for delivery riders when disruptions stop work.

**Weekly pricing only (no monthly or daily plans).**

**Pricing tiers:**
- Basic: ₹49/week, payout ₹800/day, cap ₹3,200/week
- Standard: ₹69/week, payout ₹1,000/day, cap ₹4,000/week
- Premium: ₹99/week, payout ₹1,200/day, cap ₹5,000/week

**Covered disruptions (event → trigger → payout example):**
- Extreme Heat → Temp > 40°C for 3+ hrs → ₹1,000/day
- Heavy Rain / Flood → Rain > 15mm/hr or flood alert → ₹800–₹1,200/day
- Severe Pollution → AQI > 400 → ₹1,000/day
- Curfew / Strike → City curfew or verified strike → ₹1,000/day
- Zone Closure → Police barricade / zone shutdown → ₹1,000/day
- App Outage → Outage > 4 hrs → ₹800/day
- GPS Failure → GPS error affects > 50% orders → ₹800/day
- Infrastructure Halt → Roadblock / bridge closure → ₹1,000/day

**Claims flow:**
1. Trigger event detected
2. Rider submits photo + GPS proof
3. AI verifies disruption & location
4. UPI payout within 24 hrs

**Eligibility:** 20+ rides/week verified via platform data (Swiggy/Zomato).

**Strict exclusions:** No health, life, accident, or vehicle repair coverage.

## Critical Constraints (From Challenge Brief)
- Coverage is strictly for **income loss only** during delivery disruptions.
- Excludes **health, life, accident, and vehicle repair** coverage (no medical or repair payouts).
- **Weekly pricing only** (no monthly or daily plans) to align with gig-worker income cycles.
- Disruptions are **external** events (environmental + social) that stop deliveries.

## AI/ML Integration Plan
- Risk Engine: calculates risk score using disruption frequency, flood history, AQI averages, and earnings volatility.
- Fraud Engine: validates GPS, cluster triggers, frequency caps, new account holds, and historical anomalies.
- Payout Engine: calculates payout by disruption hours and tier multiplier with a 60% weekly cap.

## Tech Stack Diagram
```
React Native (Worker App)  React (Web Dashboards)
        │                        │
        └──────────────┬─────────┘
                       ▼
               Node.js / Express API Gateway
                   ├──────────────┬──────────────┐
                   ▼              ▼              ▼
            FastAPI AI Services  PostgreSQL     Redis
           (Risk/Fraud/Payout)  (Schema docs)  (Cache)
                   ▼
         External Signals (Weather, AQI, Curfew, Outage)
```

## 6-Week Development Roadmap
1. Week 1: Persona research, onboarding UX, policy tier design.
2. Week 2: Worker app MVP + web dashboard UI.
3. Week 3: API Gateway routes, policy creation, mock disruption feeds.
4. Week 4: AI services for risk, fraud, payout engines.
5. Week 5: Parametric trigger monitor + simulation panel.
6. Week 6: Analytics, QA, demo narrative, deployment.

## Mock Data Sources & APIs
- OpenWeatherMap (weather)
- WAQI API (AQI)
- Google Maps (zone mapping, mocked)
- Mock Curfew JSON (local)
- Mock Platform Outage feed (local)
- Mock Razorpay/UPI payouts

## Repo Layout
- `backend/`: Node.js/Express API Gateway + trigger monitor
- `ai_services/`: FastAPI risk, fraud, payout services
- `frontend/`: React web dashboards (worker + admin)
- `rn_app/`: React Native worker app
- `docs/schema.sql`: PostgreSQL schema draft

## Built With
- React
- React Native (Expo)
- Node.js + Express
- Python + FastAPI
- SQLite (local persistence) / PostgreSQL (target schema)
- Redis (planned cache)
- Recharts
- OpenWeatherMap API (weather)
- WAQI API (air quality)

## About the Project — GigShield Parametric AI

### Inspiration
Delivery workers lose income when rain, heat, curfews, or app outages stop their work. We were inspired by parametric insurance — where payouts are triggered automatically by measurable events. We wanted a system that protects income without paperwork and fits weekly earning cycles.

### What it does
GigShield Parametric AI is a **weekly-priced micro‑insurance product** for delivery gig workers in India. It covers **only income loss** from external disruptions (extreme heat, heavy rain/floods, severe pollution, curfews, strikes, platform outages, GPS failures, roadblocks). It **strictly excludes** health, life, accident, or vehicle repair coverage. Payouts are triggered automatically and sent to UPI within 24 hours.

### How we built it
- **React (Web)** for worker & admin portals  
- **React Native** for worker onboarding and alerts  
- **Node.js/Express** as API gateway and trigger engine  
- **FastAPI (Python)** for risk, fraud, and payout engines  
- **SQLite/PostgreSQL** for worker, policy, claim, and payout data  
- **Mock disruption APIs** for weather, AQI, curfew, and outage signals  

Weekly premium formula:
\[
\text{weekly\_premium} = \text{base\_tier} \times (1 + \frac{\text{risk\_score}}{200})
\]

Payout cap formula:
\[
\text{payout} = \min \left( \frac{\text{avg\_daily\_earnings}}{10} \times \text{hours} \times \text{tier\_multiplier},\; 0.6 \times \text{weekly\_earnings} \right)
\]

### Challenges we ran into
- Translating real-world disruptions into clear parametric triggers  
- Preventing fraud while keeping claims instant  
- Aligning weekly pricing with actual gig‑worker earning cycles  
- Keeping UI premium while avoiding feature overload  

### Accomplishments that we're proud of
- End‑to‑end **auto‑claim** flow with UPI payout simulation  
- Realistic **fraud detection** rules and risk scoring  
- A polished, premium UI for both workers and insurers  
- Strict enforcement of **income‑only coverage**  

### What we learned
- Simpler, transparent triggers build user trust  
- Weekly pricing feels more natural for gig workers than monthly plans  
- AI validation adds speed without sacrificing fairness  

### What's next for GigShield Parametric AI
- Integrate live AQI + IMD weather feeds  
- Add neighborhood‑level risk mapping  
- Partner APIs for direct ride verification  
- Launch pilot trials with delivery platforms  
