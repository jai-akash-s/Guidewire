from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from datetime import datetime
from dateutil.parser import isoparse
from math import radians, sin, cos, atan2, sqrt

app = FastAPI(title='GigShield AI Services')

class RiskInput(BaseModel):
    city: str
    zone: str
    platform: str
    avg_weekly_earnings: float
    months_active: int

class PremiumInput(BaseModel):
    risk_score: float
    coverage_tier: str
    zone: str

class FraudInput(BaseModel):
    worker_id: int
    claim_id: int
    location_at_trigger: dict
    gps_history_last_2hrs: list
    city: str
    zone: str
    zone_epicentre: dict | None = None
    cluster_count: int | None = None
    claims_this_week: int | None = None
    claims_avg_4wk: float | None = None
    days_since_signup: int | None = None
    disruption_window: dict | None = None

class PayoutInput(BaseModel):
    worker_id: int
    disruption_duration_hours: float
    policy_tier: str
    avg_daily_earnings: float

@app.post('/risk/score')
def risk_score(in_data: RiskInput):
    city_profiles = {
        "Mumbai": {"flood_history": 75, "aqi_avg": 55, "curfew_incidents": 20},
        "Delhi": {"flood_history": 35, "aqi_avg": 85, "curfew_incidents": 25},
        "Bengaluru": {"flood_history": 30, "aqi_avg": 40, "curfew_incidents": 10},
        "Kolkata": {"flood_history": 60, "aqi_avg": 60, "curfew_incidents": 18},
        "Chennai": {"flood_history": 70, "aqi_avg": 50, "curfew_incidents": 12}
    }
    profile = city_profiles.get(in_data.city, {"flood_history": 45, "aqi_avg": 50, "curfew_incidents": 15})
    earnings_volatility = min(100, (in_data.avg_weekly_earnings / 8000) * 100)
    disruption_freq = min(100, profile["flood_history"] + profile["curfew_incidents"])
    risk_score = round(
        (profile["flood_history"] * 0.3)
        + (profile["aqi_avg"] * 0.2)
        + (profile["curfew_incidents"] * 0.2)
        + (max(disruption_freq, earnings_volatility) * 0.3)
    )
    risk_tier = 'High' if risk_score > 70 else 'Low' if risk_score < 30 else 'Medium'
    recommended_premium = 49 * (1 + risk_score / 200)
    return {
        'risk_score': risk_score,
        'risk_tier': risk_tier,
        'recommended_premium_inr': round(recommended_premium),
        'coverage_multiplier': 1 + (risk_score/200)
    }

@app.post('/risk/premium')
def risk_premium(in_data: PremiumInput):
    base_rate = {'Basic': 29, 'Standard': 49, 'Premium': 79}
    zone_multiplier = 1.0
    risk_score = in_data.risk_score
    premium = base_rate.get(in_data.coverage_tier, 25) * zone_multiplier * (1 + risk_score/200)
    max_payout = {'Basic': 900, 'Standard': 1500, 'Premium': 2100}.get(in_data.coverage_tier, 900)
    return {'weekly_premium_inr': round(premium), 'max_payout_inr': max_payout, 'covered_hours_per_week': 72 }

@app.post('/fraud/analyze')
def fraud_analyze(in_data: FraudInput):
    fraud_score = 0.1
    flags = []

    epicentre = in_data.zone_epicentre or {}
    if epicentre and in_data.location_at_trigger:
        def dist_km(a, b):
            R = 6371
            dlat = radians(b["lat"] - a["lat"])
            dlon = radians(b["lng"] - a["lng"])
            lat1 = radians(a["lat"])
            lat2 = radians(b["lat"])
            h = sin(dlat/2)**2 + cos(lat1)*cos(lat2)*sin(dlon/2)**2
            return 2 * R * atan2(sqrt(h), sqrt(1-h))

        if dist_km(in_data.location_at_trigger, epicentre) > 5:
            flags.append('gps_zone_validation_failed')
            fraud_score += 0.3

    if in_data.cluster_count is not None and in_data.cluster_count < 3:
        flags.append('cluster_validation_failed')
        fraud_score += 0.2

    if in_data.claims_this_week is not None and in_data.claims_this_week >= 2:
        flags.append('frequency_cap_exceeded')
        fraud_score += 0.2

    if in_data.days_since_signup is not None and in_data.days_since_signup < 14:
        flags.append('new_account_hold')
        fraud_score += 0.2

    if in_data.claims_avg_4wk is not None and in_data.claims_this_week is not None:
        if in_data.claims_avg_4wk > 0 and in_data.claims_this_week >= in_data.claims_avg_4wk * 3:
            flags.append('historical_anomaly')
            fraud_score += 0.2

    if in_data.disruption_window:
        window_start = isoparse(in_data.disruption_window.get('start'))
        window_end = isoparse(in_data.disruption_window.get('end'))
        now = datetime.utcnow()
        if not (window_start <= now <= window_end):
            flags.append('timing_anomaly')
            fraud_score += 0.2

    recommendation = 'APPROVE' if fraud_score < 0.4 else 'REVIEW' if fraud_score < 0.85 else 'REJECT'
    return {'fraud_score': fraud_score, 'flags': flags, 'recommendation': recommendation}

@app.post('/payout/calculate')
def payout_calculate(in_data: PayoutInput):
    multiplier = {'Basic': 0.8, 'Standard': 1.0, 'Premium': 1.3}.get(in_data.policy_tier, 1.0)
    payout = (in_data.avg_daily_earnings / 10) * in_data.disruption_duration_hours * multiplier
    cap = in_data.avg_daily_earnings * 7 * 0.6
    payout_amount = min(payout, cap)
    return {
        'payout_amount_inr': round(payout_amount),
        'calculation_breakdown': {
            'base': in_data.avg_daily_earnings / 10,
            'hours': in_data.disruption_duration_hours,
            'tier_multiplier': multiplier,
            'capped_at': cap
        },
        'upi_id': f'worker{in_data.worker_id}@upi'
    }

@app.post('/payout/disburse')
def payout_disburse(data: dict):
    if not data.get('amount_inr'):
        raise HTTPException(status_code=400, detail='amount_inr required')
    return {
        'transaction_id': f'TX{int(datetime.utcnow().timestamp())}',
        'status': 'SUCCESS',
        'timestamp': datetime.utcnow().isoformat(),
        'amount_inr': data['amount_inr']
    }
