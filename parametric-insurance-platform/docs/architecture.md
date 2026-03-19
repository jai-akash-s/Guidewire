# GigShield Architecture

GigShield uses a multi-tier architecture to deliver parametric income protection for delivery partners.

- Mobile: React Native worker app for onboarding, policy selection, risk score, payouts.
- Web: React worker dashboard + insurer/admin analytics portal.
- API Gateway: Node.js/Express REST APIs for auth, policies, claims, disruptions, admin.
- AI/ML: FastAPI microservices for risk scoring, fraud detection, payout calculation.
- Data: PostgreSQL for core entities with Redis for caching.
- External Signals: weather, AQI, curfew, flood alerts, platform outage feeds.