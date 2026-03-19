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

## Critical Constraints (From Challenge Brief)
- Coverage is strictly for **income loss only** during delivery disruptions.
- Excludes **health, life, accident, and vehicle repair** coverage (no medical or repair payouts).
- Pricing and payout model is **weekly** to align with gig-worker income cycles.
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
