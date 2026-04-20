from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, List
import math, time, uuid, random

app = FastAPI(title="RapidRed API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── DATABASE ────────────────────────────────────────────────────────────────
HOSPITALS: Dict[str, dict] = {
    "H001": {
        "name": "AIIMS Delhi",
        "lat": 28.5672, "lng": 77.2100,
        "inventory": {"O-": 5, "O+": 12, "AB-": 2, "AB+": 8, "A-": 3, "A+": 15, "B-": 1, "B+": 10, "Bombay": 1},
        "health_credits": 0,
        "storage_capacity": 500,
        "total_shared": 142,
        "total_received": 30,
        "shared_history": [
            {"to": "H003", "units": 10, "blood_group": "O-",  "timestamp": "2024-11-01"},
            {"to": "H004", "units": 5,  "blood_group": "AB-", "timestamp": "2024-11-10"},
            {"to": "H002", "units": 8,  "blood_group": "O+",  "timestamp": "2024-11-15"},
        ],
    },
    "H002": {
        "name": "Safdarjung Hospital",
        "lat": 28.5685, "lng": 77.2064,
        "inventory": {"O-": 0, "O+": 20, "AB-": 0, "AB+": 5, "A-": 0, "A+": 9, "B-": 0, "B+": 7, "Bombay": 0},
        "health_credits": 120,
        "storage_capacity": 350,
        "total_shared": 85,
        "total_received": 60,
        "shared_history": [
            {"to": "H003", "units": 12, "blood_group": "O+", "timestamp": "2024-10-20"},
            {"to": "H001", "units": 6,  "blood_group": "B+", "timestamp": "2024-11-05"},
        ],
    },
    "H003": {
        "name": "RML Hospital",
        "lat": 28.6353, "lng": 77.2090,
        "inventory": {"O-": 3, "O+": 6, "AB-": 1, "AB+": 3, "A-": 2, "A+": 11, "B-": 4, "B+": 9, "Bombay": 0},
        "health_credits": 80,
        "storage_capacity": 280,
        "total_shared": 54,
        "total_received": 88,
        "shared_history": [
            {"to": "H004", "units": 7, "blood_group": "B-", "timestamp": "2024-10-15"},
        ],
    },
    "H004": {
        "name": "Apollo Sarita Vihar",
        "lat": 28.5355, "lng": 77.2936,
        "inventory": {"O-": 1, "O+": 8, "AB-": 3, "AB+": 6, "A-": 1, "A+": 14, "B-": 2, "B+": 12, "Bombay": 2},
        "health_credits": 200,
        "storage_capacity": 400,
        "total_shared": 110,
        "total_received": 45,
        "shared_history": [
            {"to": "H001", "units": 15, "blood_group": "Bombay", "timestamp": "2024-09-10"},
            {"to": "H003", "units": 20, "blood_group": "AB-",    "timestamp": "2024-10-01"},
        ],
    },
    "H005": {
        "name": "Fortis Vasant Kunj",
        "lat": 28.5200, "lng": 77.1500,
        "inventory": {"O-": 0, "O+": 30, "AB-": 0, "AB+": 0, "A-": 0, "A+": 0, "B-": 0, "B+": 0, "Bombay": 0},
        "health_credits": 50,
        "storage_capacity": 150,
        "total_shared": 18,
        "total_received": 95,
        "shared_history": [],
    },
}

DONORS: Dict[str, dict] = {
    "D001": {"name": "Rahul Sharma", "blood_group": "O-",  "health_credits": 350, "donations": 27},
    "D002": {"name": "Priya Singh",  "blood_group": "AB-", "health_credits": 500, "donations": 5},
}

ACTIVE_REQUESTS: Dict[str, dict] = {}

RARITY_WEIGHTS = {
    "Bombay": 10.0, "AB-": 5.0, "O-": 4.0, "B-": 3.5,
    "A-": 3.0, "AB+": 2.0, "B+": 1.5, "A+": 1.2, "O+": 1.0,
}

HEALTH_CREDIT_VALUES = {
    "Bombay": 500, "AB-": 200, "O-": 150, "B-": 120,
    "A-": 100, "AB+": 60, "B+": 50, "A+": 40, "O+": 30,
}

GOLDEN_HOUR_MINUTES = 15
RIDER_SPEED_KMH     = 40

# ─── RIDER DATABASE ──────────────────────────────────────────────────────────
RIDERS: Dict[str, dict] = {
    "R001": {"name": "Arjun Kapoor",    "avatar": "AK", "total_deliveries": 312, "avg_delivery_time_min": 8.2,  "status": "Available", "lat": 28.5720, "lng": 77.2050, "service_radius_km": 10, "star_rating": 4.9,  "rating_count": 280, "feedback_tags": {"Friendly Nature": 210, "Handled with Care": 265, "Hospital Staff Engagement": 198}, "specialization": "Critical / Bombay Blood",  "verified": True, "join_date": "2022-03-15"},
    "R002": {"name": "Meena Rathi",     "avatar": "MR", "total_deliveries": 289, "avg_delivery_time_min": 8.9,  "status": "Busy",      "lat": 28.5800, "lng": 77.2200, "service_radius_km": 9,  "star_rating": 4.85, "rating_count": 260, "feedback_tags": {"Friendly Nature": 240, "Handled with Care": 255, "Hospital Staff Engagement": 220}, "specialization": "Rare Blood Types",         "verified": True, "join_date": "2022-05-20"},
    "R003": {"name": "Vijay Sharma",    "avatar": "VS", "total_deliveries": 256, "avg_delivery_time_min": 9.5,  "status": "Available", "lat": 28.5610, "lng": 77.1950, "service_radius_km": 8,  "star_rating": 4.75, "rating_count": 230, "feedback_tags": {"Friendly Nature": 180, "Handled with Care": 230, "Hospital Staff Engagement": 170}, "specialization": "Emergency Response",       "verified": True, "join_date": "2022-07-10"},
    "R004": {"name": "Sita Patel",      "avatar": "SP", "total_deliveries": 241, "avg_delivery_time_min": 9.8,  "status": "Available", "lat": 28.5900, "lng": 77.2300, "service_radius_km": 9,  "star_rating": 4.80, "rating_count": 215, "feedback_tags": {"Friendly Nature": 200, "Handled with Care": 210, "Hospital Staff Engagement": 195}, "specialization": "Multi-Hospital Runs",      "verified": True, "join_date": "2022-08-01"},
    "R005": {"name": "Rajan Mehta",     "avatar": "RM", "total_deliveries": 220, "avg_delivery_time_min": 10.1, "status": "Available", "lat": 28.5500, "lng": 77.2000, "service_radius_km": 8,  "star_rating": 4.70, "rating_count": 198, "feedback_tags": {"Friendly Nature": 165, "Handled with Care": 198, "Hospital Staff Engagement": 155}, "specialization": "Night Shifts",             "verified": True, "join_date": "2022-09-12"},
    "R006": {"name": "Anita Desai",     "avatar": "AD", "total_deliveries": 198, "avg_delivery_time_min": 10.5, "status": "Busy",      "lat": 28.5650, "lng": 77.2400, "service_radius_km": 7,  "star_rating": 4.65, "rating_count": 178, "feedback_tags": {"Friendly Nature": 160, "Handled with Care": 175, "Hospital Staff Engagement": 148}, "specialization": "Pediatric Hospitals",      "verified": True, "join_date": "2022-11-05"},
    "R007": {"name": "Suresh Nair",     "avatar": "SN", "total_deliveries": 185, "avg_delivery_time_min": 11.0, "status": "Available", "lat": 28.5750, "lng": 77.1850, "service_radius_km": 7,  "star_rating": 4.60, "rating_count": 165, "feedback_tags": {"Friendly Nature": 140, "Handled with Care": 162, "Hospital Staff Engagement": 130}, "specialization": "Cross-City Transfers",     "verified": True, "join_date": "2023-01-18"},
    "R008": {"name": "Priya Iyer",      "avatar": "PI", "total_deliveries": 172, "avg_delivery_time_min": 11.3, "status": "Available", "lat": 28.5480, "lng": 77.2150, "service_radius_km": 7,  "star_rating": 4.55, "rating_count": 152, "feedback_tags": {"Friendly Nature": 138, "Handled with Care": 150, "Hospital Staff Engagement": 125}, "specialization": "Government Hospitals",     "verified": True, "join_date": "2023-02-22"},
    "R009": {"name": "Deepak Joshi",    "avatar": "DJ", "total_deliveries": 156, "avg_delivery_time_min": 11.8, "status": "Available", "lat": 28.5850, "lng": 77.2500, "service_radius_km": 6,  "star_rating": 4.50, "rating_count": 138, "feedback_tags": {"Friendly Nature": 120, "Handled with Care": 138, "Hospital Staff Engagement": 110}, "specialization": "Standard Delivery",        "verified": True, "join_date": "2023-03-30"},
    "R010": {"name": "Kavya Reddy",     "avatar": "KR", "total_deliveries": 140, "avg_delivery_time_min": 12.2, "status": "Busy",      "lat": 28.5600, "lng": 77.1780, "service_radius_km": 6,  "star_rating": 4.45, "rating_count": 124, "feedback_tags": {"Friendly Nature": 110, "Handled with Care": 122, "Hospital Staff Engagement": 98},  "specialization": "South Delhi Zone",         "verified": True, "join_date": "2023-05-14"},
    "R011": {"name": "Nikhil Gupta",    "avatar": "NG", "total_deliveries": 128, "avg_delivery_time_min": 12.8, "status": "Available", "lat": 28.5380, "lng": 77.2350, "service_radius_km": 6,  "star_rating": 4.35, "rating_count": 112, "feedback_tags": {"Friendly Nature": 95,  "Handled with Care": 110, "Hospital Staff Engagement": 88},  "specialization": "Private Clinic Network",   "verified": True, "join_date": "2023-06-20"},
    "R012": {"name": "Sunita Rao",      "avatar": "SR", "total_deliveries": 110, "avg_delivery_time_min": 13.5, "status": "Available", "lat": 28.5950, "lng": 77.1950, "service_radius_km": 5,  "star_rating": 4.25, "rating_count": 98,  "feedback_tags": {"Friendly Nature": 85,  "Handled with Care": 96,  "Hospital Staff Engagement": 78},  "specialization": "North Delhi Zone",         "verified": True, "join_date": "2023-08-08"},
    "R013": {"name": "Amit Tiwari",     "avatar": "AT", "total_deliveries": 95,  "avg_delivery_time_min": 14.0, "status": "Available", "lat": 28.5430, "lng": 77.1680, "service_radius_km": 5,  "star_rating": 4.15, "rating_count": 84,  "feedback_tags": {"Friendly Nature": 72,  "Handled with Care": 82,  "Hospital Staff Engagement": 65},  "specialization": "West Delhi Zone",          "verified": True, "join_date": "2023-09-15"},
    "R014": {"name": "Rekha Pillai",    "avatar": "RP", "total_deliveries": 78,  "avg_delivery_time_min": 14.8, "status": "Busy",      "lat": 28.5780, "lng": 77.2620, "service_radius_km": 5,  "star_rating": 4.05, "rating_count": 70,  "feedback_tags": {"Friendly Nature": 60,  "Handled with Care": 68,  "Hospital Staff Engagement": 55},  "specialization": "East Delhi Zone",          "verified": True, "join_date": "2023-10-01"},
    "R015": {"name": "Karan Bhatia",    "avatar": "KB", "total_deliveries": 62,  "avg_delivery_time_min": 15.5, "status": "Available", "lat": 28.5520, "lng": 77.2500, "service_radius_km": 5,  "star_rating": 3.95, "rating_count": 55,  "feedback_tags": {"Friendly Nature": 45,  "Handled with Care": 54,  "Hospital Staff Engagement": 40},  "specialization": "General Dispatch",         "verified": True, "join_date": "2023-11-20"},
}

RIDER_RATINGS_LOG: List[dict] = []

# ─── RIDER RANKING ALGORITHM ─────────────────────────────────────────────────
def compute_rider_score(rider: dict) -> float:
    deliveries   = rider.get("total_deliveries", 0)
    star         = rider.get("star_rating", 0)
    avg_time     = rider.get("avg_delivery_time_min", 20)
    tag_counts   = rider.get("feedback_tags", {})
    rating_count = max(1, rider.get("rating_count", 1))
    speed_score      = max(0, (20 - avg_time)) * 2
    engagement_score = sum(tag_counts.values()) / rating_count
    return round((deliveries * 0.40) + (star * 12.0) + (speed_score * 0.30) + (engagement_score * 0.10), 2)

def get_rider_tier(score: float) -> dict:
    if score >= 160:
        return {"tier": "Platinum", "label": "Elite / Platinum", "badge": "⚡ PLATINUM", "color": "#E5C07B", "priority": 1}
    elif score >= 130:
        return {"tier": "Gold",     "label": "Gold Verified",    "badge": "🥇 GOLD",     "color": "#F0A500", "priority": 2}
    elif score >= 100:
        return {"tier": "Silver",   "label": "Silver Rider",     "badge": "🥈 SILVER",   "color": "#A8B2D8", "priority": 3}
    else:
        return {"tier": "Standard", "label": "Standard Rider",   "badge": "🔵 STANDARD", "color": "#6C8EBF", "priority": 4}

def rank_riders() -> List[dict]:
    ranked = []
    for rid, r in RIDERS.items():
        score = compute_rider_score(r)
        tier  = get_rider_tier(score)
        ranked.append({
            "rider_id": rid, "name": r["name"], "avatar": r["avatar"],
            "status": r["status"], "lat": r["lat"], "lng": r["lng"],
            "service_radius_km": r["service_radius_km"],
            "total_deliveries": r["total_deliveries"],
            "avg_delivery_time_min": r["avg_delivery_time_min"],
            "star_rating": r["star_rating"], "rating_count": r["rating_count"],
            "feedback_tags": r["feedback_tags"], "specialization": r["specialization"],
            "verified": r["verified"], "join_date": r["join_date"],
            "reputation_score": score,
            "tier": tier["tier"], "tier_label": tier["label"],
            "badge": tier["badge"], "tier_color": tier["color"], "tier_priority": tier["priority"],
            "score_formula": f"({r['total_deliveries']} x 0.40) + ({r['star_rating']} x 12.0) + (speed x 0.30) + (engagement x 0.10) = {score}",
        })
    ranked.sort(key=lambda x: x["reputation_score"], reverse=True)
    return ranked

def pick_best_rider(hospital_lat: float, hospital_lng: float, blood_group: str = "") -> Optional[dict]:
    ranked = rank_riders()
    if blood_group == "Bombay":
        ranked = [r for r in ranked if r["tier"] in ("Platinum", "Gold")]
    available = [r for r in ranked if r["status"] == "Available"]
    if not available:
        available = ranked
    best_priority = available[0]["tier_priority"]
    top_tier      = [r for r in available if r["tier_priority"] == best_priority]
    return min(top_tier, key=lambda r: haversine(hospital_lat, hospital_lng, r["lat"], r["lng"]))

# ─── SCHEMAS ─────────────────────────────────────────────────────────────────
class BloodRequest(BaseModel):
    blood_group: str
    recipient_lat: float = 28.5800
    recipient_lng: float = 77.2150
    units_needed: int = 1
    donor_id: Optional[str] = None

class StockUpdate(BaseModel):
    hospital_id: str
    blood_group: str
    delta: int
    donor_id: Optional[str] = None

class CompleteDelivery(BaseModel):
    request_id: str
    donor_id: Optional[str] = None

class ShareUnits(BaseModel):
    from_hospital_id: str
    to_hospital_id: str
    blood_group: str
    units: int

class RateRider(BaseModel):
    rider_id: str
    hospital_id: str
    stars: float
    feedback_tags: List[str] = []
    comment: Optional[str] = None

# ─── HAVERSINE ───────────────────────────────────────────────────────────────
def haversine(lat1, lng1, lat2, lng2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi    = math.radians(lat2 - lat1)
    dlambda = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlambda/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

# ─── MATCHING ALGORITHM ──────────────────────────────────────────────────────
def match_hospital(blood_group, r_lat, r_lng, units=1):
    if blood_group not in RARITY_WEIGHTS:
        raise ValueError(f"Unknown blood group: {blood_group}")
    rarity     = RARITY_WEIGHTS[blood_group]
    candidates = []
    for hid, h in HOSPITALS.items():
        stock = h["inventory"].get(blood_group, 0)
        if stock < units:
            continue
        dist_km = haversine(r_lat, r_lng, h["lat"], h["lng"])
        score   = rarity / (dist_km + 0.1)
        eta_min = (dist_km / RIDER_SPEED_KMH) * 60
        tier    = get_hospital_tier(hid)
        candidates.append({
            "hospital_id": hid, "hospital_name": h["name"],
            "distance_km": round(dist_km, 2), "eta_minutes": round(eta_min, 1),
            "stock": stock, "score": round(score, 4),
            "within_golden_hour": eta_min <= GOLDEN_HOUR_MINUTES,
            "tier": tier["tier"], "tier_label": tier["label"],
        })
    candidates.sort(key=lambda x: x["score"], reverse=True)
    return candidates

# ─── HIERARCHY ALGORITHM ─────────────────────────────────────────────────────
def compute_share_score(hospital: dict) -> float:
    total_units    = sum(hospital["inventory"].values())
    capacity       = hospital.get("storage_capacity", 100)
    shared         = hospital.get("total_shared", 0)
    capacity_ratio = total_units / capacity if capacity > 0 else 0
    return round((shared * 0.7) + (capacity_ratio * 0.3 * 100), 2)

def get_hospital_tier(hospital_id: str) -> dict:
    h     = HOSPITALS[hospital_id]
    score = compute_share_score(h)
    cap   = h.get("storage_capacity", 100)
    if score >= 80 and cap >= 400:
        return {"tier": 1, "label": "Tier-1 Emergency Hub",    "badge": "🔴 HUB"}
    elif score >= 40 and cap >= 250:
        return {"tier": 2, "label": "Tier-2 Network Node",     "badge": "🟠 NODE"}
    else:
        return {"tier": 3, "label": "Tier-3 End-Point Clinic", "badge": "🟡 END-POINT"}

# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS — EXISTING
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/")
def root():
    return {"service": "RapidRed API v3", "status": "online"}

@app.get("/hospitals")
def get_hospitals():
    return {"hospitals": HOSPITALS}

@app.get("/network-hierarchy")
def network_hierarchy():
    ranked = []
    for hid, h in HOSPITALS.items():
        score = compute_share_score(h)
        tier  = get_hospital_tier(hid)
        total_units = sum(h["inventory"].values())
        ranked.append({
            "hospital_id": hid, "hospital_name": h["name"],
            "share_score": score, "tier": tier["tier"], "tier_label": tier["label"],
            "badge": tier["badge"], "total_shared": h.get("total_shared", 0),
            "total_received": h.get("total_received", 0),
            "storage_capacity": h.get("storage_capacity", 0),
            "current_units": total_units,
            "capacity_pct": round((total_units / h.get("storage_capacity", 1)) * 100, 1),
            "shared_history": h.get("shared_history", []),
            "formula": f"({h.get('total_shared',0)} x 0.7) + ({round((total_units/h.get('storage_capacity',1))*100,1)} x 0.3) = {score}",
        })
    ranked.sort(key=lambda x: x["share_score"], reverse=True)
    return {"hierarchy": ranked, "algorithm": "Score = (Total_Shared x 0.7) + (Capacity_Ratio x 0.3 x 100)"}

@app.post("/share-units")
def share_units(req: ShareUnits):
    if req.from_hospital_id not in HOSPITALS:
        raise HTTPException(status_code=404, detail="Source hospital not found.")
    if req.to_hospital_id not in HOSPITALS:
        raise HTTPException(status_code=404, detail="Destination hospital not found.")
    src = HOSPITALS[req.from_hospital_id]
    dst = HOSPITALS[req.to_hospital_id]
    if src["inventory"].get(req.blood_group, 0) < req.units:
        raise HTTPException(status_code=400, detail="Insufficient stock to share.")
    src["inventory"][req.blood_group] -= req.units
    dst["inventory"][req.blood_group]  = dst["inventory"].get(req.blood_group, 0) + req.units
    src["total_shared"]   = src.get("total_shared", 0) + req.units
    dst["total_received"] = dst.get("total_received", 0) + req.units
    src.setdefault("shared_history", []).append({
        "to": req.to_hospital_id, "units": req.units,
        "blood_group": req.blood_group, "timestamp": time.strftime("%Y-%m-%d"),
    })
    return {"success": True, "from": src["name"], "to": dst["name"], "units": req.units, "blood_group": req.blood_group}

@app.post("/request-blood")
def request_blood(req: BloodRequest):
    try:
        ranked = match_hospital(req.blood_group, req.recipient_lat, req.recipient_lng, req.units_needed)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    if not ranked:
        raise HTTPException(status_code=404, detail=f"No hospital has {req.units_needed} unit(s) of {req.blood_group}.")
    best   = ranked[0]
    req_id = str(uuid.uuid4())[:8].upper()
    best_rider = pick_best_rider(HOSPITALS[best["hospital_id"]]["lat"], HOSPITALS[best["hospital_id"]]["lng"], req.blood_group)
    rider_ref  = {"id": best_rider["rider_id"], "name": best_rider["name"], "tier": best_rider["tier"]}
    if best_rider["status"] == "Available":
        RIDERS[best_rider["rider_id"]]["status"] = "Busy"
    ACTIVE_REQUESTS[req_id] = {
        "blood_group": req.blood_group, "units": req.units_needed,
        "hospital_id": best["hospital_id"], "hospital_name": best["hospital_name"],
        "distance_km": best["distance_km"], "eta_minutes": best["eta_minutes"],
        "status": "DISPATCHED", "created_at": time.time(),
        "donor_id": req.donor_id, "rider": rider_ref,
    }
    HOSPITALS[best["hospital_id"]]["inventory"][req.blood_group] -= req.units_needed
    return {
        "request_id": req_id, "blood_group": req.blood_group, "units_needed": req.units_needed,
        "best_match": best, "all_candidates": ranked, "rider": rider_ref,
        "golden_hour_alert": not best["within_golden_hour"],
        "dispatch_note": f"Assigned {best_rider['tier']} rider {best_rider['name']}",
    }

@app.get("/track-rider/{req_id}")
def track_rider(req_id: str):
    req_id = req_id.upper()
    if req_id not in ACTIVE_REQUESTS:
        raise HTTPException(status_code=404, detail="Request ID not found.")
    r        = ACTIVE_REQUESTS[req_id]
    elapsed  = (time.time() - r["created_at"]) / 60
    progress = min(elapsed / max(r["eta_minutes"], 1), 1.0)
    status   = "DELIVERED" if progress >= 1.0 else "EN_ROUTE" if progress > 0.5 else "DISPATCHED"
    return {
        "request_id": req_id, "status": status,
        "progress_pct": round(progress * 100, 1),
        "remaining_eta": max(0, round(r["eta_minutes"] - elapsed, 1)),
        "rider": r["rider"], "rider_name": r["rider"]["name"],
        "hospital": r["hospital_name"], "blood_group": r["blood_group"],
    }

@app.post("/complete-delivery")
def complete_delivery(req: CompleteDelivery):
    req_id = req.request_id.upper()
    if req_id not in ACTIVE_REQUESTS:
        raise HTTPException(status_code=404, detail="Request not found.")
    r           = ACTIVE_REQUESTS[req_id]
    blood_group = r["blood_group"]
    credits     = HEALTH_CREDIT_VALUES.get(blood_group, 30) * r["units"]
    donor_id    = req.donor_id or r.get("donor_id")
    HOSPITALS[r["hospital_id"]]["health_credits"] += credits
    donor_credits = None
    if donor_id and donor_id in DONORS:
        DONORS[donor_id]["health_credits"] += credits
        DONORS[donor_id]["donations"]      += 1
        donor_credits = DONORS[donor_id]["health_credits"]
    rider_id = r["rider"]["id"]
    if rider_id in RIDERS:
        RIDERS[rider_id]["status"]            = "Available"
        RIDERS[rider_id]["total_deliveries"] += 1
    ACTIVE_REQUESTS[req_id]["status"] = "DELIVERED"
    return {"request_id": req_id, "credits_awarded": credits, "donor_credits": donor_credits}

@app.get("/donor/{donor_id}")
def get_donor(donor_id: str):
    if donor_id not in DONORS:
        raise HTTPException(status_code=404, detail="Donor not found.")
    return DONORS[donor_id]

@app.post("/update-stock")
def update_stock(update: StockUpdate):
    if update.hospital_id not in HOSPITALS:
        raise HTTPException(status_code=404, detail="Hospital not found.")
    h         = HOSPITALS[update.hospital_id]
    current   = h["inventory"].get(update.blood_group, 0)
    new_stock = current + update.delta
    if new_stock < 0:
        raise HTTPException(status_code=400, detail=f"Insufficient stock. Available: {current}")
    h["inventory"][update.blood_group] = new_stock
    return {"hospital_id": update.hospital_id, "blood_group": update.blood_group, "new_stock": new_stock}

# ═══════════════════════════════════════════════════════════════════════════════
# ENDPOINTS — NEW: ELITE DISPATCHER & RIDER HIERARCHY
# ═══════════════════════════════════════════════════════════════════════════════

@app.get("/riders")
def get_all_riders():
    return {"riders": rank_riders(), "total": len(RIDERS)}

@app.get("/riders/{rider_id}")
def get_rider(rider_id: str):
    if rider_id not in RIDERS:
        raise HTTPException(status_code=404, detail="Rider not found.")
    r     = RIDERS[rider_id]
    score = compute_rider_score(r)
    tier  = get_rider_tier(score)
    return {**r, "rider_id": rider_id, "reputation_score": score, **tier}

@app.get("/rider-hierarchy")
def rider_hierarchy():
    ranked  = rank_riders()
    summary = {t: len([r for r in ranked if r["tier"] == t]) for t in ("Platinum","Gold","Silver","Standard")}
    return {
        "hierarchy": ranked, "summary": summary,
        "algorithm": "Score = (Deliveries x 0.40) + (Stars x 12.0) + (Speed_Score x 0.30) + (Engagement x 0.10)",
        "total": len(ranked),
    }

@app.post("/rate-rider")
def rate_rider(req: RateRider):
    """
    Hospital-to-Rider Feedback Loop  (Elite Dispatcher & Rider Hierarchy)
    ───────────────────────────────────────────────────────────────────────
    • Weighted rolling average — new star rating updates instantly.
    • Increments engagement tag counters for the 3 official feedback tags.
    • Recalculates full reputation score and tier on every submission.
    • Logs every rating in RIDER_RATINGS_LOG for audit/dashboard.
    • Returns old vs. new rating delta and tier-change flag.
    """
    if req.rider_id not in RIDERS:
        raise HTTPException(status_code=404, detail="Rider not found.")
    if req.hospital_id not in HOSPITALS:
        raise HTTPException(status_code=404, detail="Hospital not found.")
    if not (1.0 <= req.stars <= 5.0):
        raise HTTPException(status_code=400, detail="Stars must be between 1.0 and 5.0.")

    valid_tags = {"Friendly Nature", "Handled with Care", "Hospital Staff Engagement"}
    invalid    = [t for t in req.feedback_tags if t not in valid_tags]
    if invalid:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid tags: {invalid}. Allowed: {sorted(valid_tags)}"
        )

    rider      = RIDERS[req.rider_id]
    old_count  = rider["rating_count"]
    old_rating = rider["star_rating"]
    old_score  = compute_rider_score(rider)
    old_tier   = get_rider_tier(old_score)

    # ── Dynamic weighted rolling average ───────────────────────────────
    new_count  = old_count + 1
    new_rating = round(((old_rating * old_count) + req.stars) / new_count, 2)
    rider["star_rating"]  = new_rating
    rider["rating_count"] = new_count

    # ── Increment engagement tag counters ──────────────────────────────
    for tag in req.feedback_tags:
        rider["feedback_tags"][tag] = rider["feedback_tags"].get(tag, 0) + 1

    # ── Recompute reputation score & tier ──────────────────────────────
    new_score = compute_rider_score(rider)
    new_tier  = get_rider_tier(new_score)
    tier_changed = old_tier["tier"] != new_tier["tier"]

    # ── Persist to audit log ───────────────────────────────────────────
    RIDER_RATINGS_LOG.append({
        "rider_id":      req.rider_id,
        "rider_name":    rider["name"],
        "hospital_id":   req.hospital_id,
        "hospital_name": HOSPITALS[req.hospital_id]["name"],
        "stars":         req.stars,
        "feedback_tags": req.feedback_tags,
        "comment":       req.comment,
        "old_rating":    old_rating,
        "new_rating":    new_rating,
        "old_tier":      old_tier["tier"],
        "new_tier":      new_tier["tier"],
        "tier_changed":  tier_changed,
        "timestamp":     time.strftime("%Y-%m-%dT%H:%M:%S"),
    })

    return {
        # ── Core result ─────────────────────────────────────────────────
        "success":         True,
        "rider_id":        req.rider_id,
        "rider_name":      rider["name"],
        "hospital_name":   HOSPITALS[req.hospital_id]["name"],

        # ── Rating delta ────────────────────────────────────────────────
        "previous_rating": old_rating,
        "new_rating":      new_rating,
        "rating_delta":    round(new_rating - old_rating, 3),
        "total_ratings":   new_count,
        "stars_given":     req.stars,

        # ── Engagement tags ─────────────────────────────────────────────
        "tags_added":      req.feedback_tags,
        "updated_tags":    rider["feedback_tags"],

        # ── Reputation & tier ───────────────────────────────────────────
        "previous_score":  old_score,
        "reputation_score": new_score,
        "score_delta":     round(new_score - old_score, 2),
        "tier":            new_tier["tier"],
        "tier_label":      new_tier["label"],
        "badge":           new_tier["badge"],
        "tier_color":      new_tier["color"],
        "tier_changed":    tier_changed,
        "tier_change_msg": (
            f"🎉 Promoted from {old_tier['tier']} → {new_tier['tier']}!"
            if tier_changed and new_tier["priority"] < old_tier["priority"]
            else f"⚠ Downgraded from {old_tier['tier']} → {new_tier['tier']}"
            if tier_changed
            else "No tier change."
        ),

        # ── Comment ─────────────────────────────────────────────────────
        "comment":         req.comment,
    }

@app.get("/rider-performance-dashboard")
def rider_performance_dashboard():
    ranked   = rank_riders()
    top      = ranked[0] if ranked else {}
    bombay_rider = pick_best_rider(28.5672, 77.2100, "Bombay")
    engagement_scores = []
    for r in ranked:
        eng = round(sum(r["feedback_tags"].values()) / max(1, r["rating_count"]), 2)
        engagement_scores.append({"rider_id": r["rider_id"], "name": r["name"], "engagement_score": eng, "tier": r["tier"]})
    return {
        "total_riders": len(ranked),
        "available_now": len([r for r in ranked if r["status"] == "Available"]),
        "busy_now": len([r for r in ranked if r["status"] == "Busy"]),
        "tier_distribution": {t: len([r for r in ranked if r["tier"] == t]) for t in ("Platinum","Gold","Silver","Standard")},
        "top_performer": top,
        "bombay_blood_pick": bombay_rider,
        "engagement_scores": engagement_scores,
        "total_deliveries_all": sum(r["total_deliveries"] for r in ranked),
        "avg_rating_network": round(sum(r["star_rating"] for r in ranked) / len(ranked), 2),
        "recent_ratings_log": RIDER_RATINGS_LOG[-10:],
        "algorithm": "Score = (Deliveries x 0.40) + (Stars x 12.0) + (Speed_Score x 0.30) + (Engagement x 0.10)",
    }

@app.get("/dispatch-recommendation")
def dispatch_recommendation(blood_group: str = "O+", hospital_lat: float = 28.5672, hospital_lng: float = 77.2100):
    rider = pick_best_rider(hospital_lat, hospital_lng, blood_group)
    if not rider:
        raise HTTPException(status_code=503, detail="No eligible riders available.")
    dist = haversine(hospital_lat, hospital_lng, rider["lat"], rider["lng"])
    eta  = round((dist / RIDER_SPEED_KMH) * 60, 1)
    return {
        "recommended_rider": rider,
        "distance_to_hospital_km": round(dist, 2),
        "eta_to_hospital_min": eta,
        "blood_group": blood_group,
        "dispatch_reason": f"{rider['tier']} tier + closest Available rider to pickup point",
    }
