/* eslint-disable */
import { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts";
import RiderCommandCenter from "./components/RiderCommandCeter";

const API_BASE  = "http://localhost:8000";
const DEMO_MODE = true;

// ─── MOCK DATA ───────────────────────────────────────────────────────────────
const MOCK_HOSPITALS = {
  H001: { name: "AIIMS Delhi",         inventory: { "O-": 5, "O+": 12, "AB-": 2, "Bombay": 1 }, health_credits: 0,   storage_capacity: 500, total_shared: 142, total_received: 30  },
  H002: { name: "Safdarjung Hospital", inventory: { "O-": 0, "O+": 20, "AB-": 0, "Bombay": 0 }, health_credits: 120, storage_capacity: 350, total_shared: 85,  total_received: 60  },
  H003: { name: "RML Hospital",        inventory: { "O-": 3, "O+": 6,  "AB-": 1, "Bombay": 0 }, health_credits: 80,  storage_capacity: 280, total_shared: 54,  total_received: 88  },
  H004: { name: "Apollo Sarita Vihar", inventory: { "O-": 1, "O+": 8,  "AB-": 3, "Bombay": 2 }, health_credits: 200, storage_capacity: 400, total_shared: 110, total_received: 45  },
  H005: { name: "Fortis Vasant Kunj",  inventory: { "O-": 0, "O+": 30, "AB-": 0, "Bombay": 0 }, health_credits: 50,  storage_capacity: 150, total_shared: 18,  total_received: 95  },
};

const MOCK_HIERARCHY = [
  { hospital_id: "H001", hospital_name: "AIIMS Delhi",         share_score: 102.9, tier: 1, tier_label: "Tier-1 Emergency Hub",    badge: "🔴 HUB",       total_shared: 142, total_received: 30,  storage_capacity: 500, current_units: 20, capacity_pct: 4.0,  formula: "(142 × 0.7) + (4.0 × 0.3) = 102.9", shared_history: [{ to: "H003", units: 10, blood_group: "O-", timestamp: "2024-11-01" }, { to: "H004", units: 5, blood_group: "AB-", timestamp: "2025-1-10" }] },
  { hospital_id: "H004", hospital_name: "Apollo Sarita Vihar", share_score: 78.5,  tier: 1, tier_label: "Tier-1 Emergency Hub",    badge: "🔴 HUB",       total_shared: 110, total_received: 45,  storage_capacity: 400, current_units: 35, capacity_pct: 8.8,  formula: "(110 × 0.7) + (8.8 × 0.3) = 78.5",  shared_history: [{ to: "H001", units: 15, blood_group: "Bombay", timestamp: "2025-04-15" }] },
  { hospital_id: "H002", hospital_name: "Safdarjung Hospital", share_score: 61.0,  tier: 2, tier_label: "Tier-2 Network Node",     badge: "🟠 NODE",      total_shared: 85,  total_received: 60,  storage_capacity: 350, current_units: 41, capacity_pct: 11.7, formula: "(85 × 0.7) + (11.7 × 0.3) = 61.0",  shared_history: [{ to: "H003", units: 12, blood_group: "O+", timestamp: "2024-08-20" }] },
  { hospital_id: "H003", hospital_name: "RML Hospital",        share_score: 40.6,  tier: 2, tier_label: "Tier-2 Network Node",     badge: "🟠 NODE",      total_shared: 54,  total_received: 88,  storage_capacity: 280, current_units: 30, capacity_pct: 10.7, formula: "(54 × 0.7) + (10.7 × 0.3) = 40.6",  shared_history: [{ to: "H004", units: 7, blood_group: "B-", timestamp: "2026-01-15" }] },
  { hospital_id: "H005", hospital_name: "Fortis Vasant Kunj",  share_score: 18.6,  tier: 3, tier_label: "Tier-3 End-Point Clinic", badge: "🟡 END-POINT", total_shared: 18,  total_received: 95,  storage_capacity: 150, current_units: 30, capacity_pct: 20.0, formula: "(18 × 0.7) + (20.0 × 0.3) = 18.6",  shared_history: [] },
];

const MOCK_MATCH = {
  request_id: "A3F9B1", blood_group: "O-",
  best_match: { hospital_name: "AIIMS Delhi", distance_km: 1.4, eta_minutes: 2.1, score: 2.857, within_golden_hour: true, tier_label: "Tier-1 Emergency Hub" },
  all_candidates: [
    { hospital_name: "AIIMS Delhi",         distance_km: 1.4, eta_minutes: 2.1,  score: 2.857, within_golden_hour: true,  tier_label: "Tier-1 Emergency Hub" },
    { hospital_name: "RML Hospital",        distance_km: 7.8, eta_minutes: 11.7, score: 0.510, within_golden_hour: true,  tier_label: "Tier-2 Network Node" },
    { hospital_name: "Apollo Sarita Vihar", distance_km: 9.2, eta_minutes: 13.8, score: 0.431, within_golden_hour: true,  tier_label: "Tier-1 Emergency Hub" },
    { hospital_name: "Fortis Vasant Kunj",  distance_km: 5.1, eta_minutes: 7.7,  score: 0.192, within_golden_hour: true,  tier_label: "Tier-3 End-Point Clinic" },
  ],
  rider: { id: "RIDER-247", name: "Arjun K." },
  golden_hour_alert: false,
};

const MOCK_DONOR   = { name: "Rahul Sharma", blood_group: "O-", health_credits: 350, donations: 27 };
const MOCK_HISTORY = [
  { date: "2024-11-20", group: "O-", units: 1, credits: 150, hospital: "AIIMS Delhi" },
  { date: "2024-09-05", group: "O-", units: 1, credits: 150, hospital: "RML Hospital" },
  { date: "2024-07-12", group: "O-", units: 2, credits: 300, hospital: "Safdarjung" },
  { date: "2024-05-01", group: "O-", units: 1, credits: 150, hospital: "Apollo Sarita Vihar" },
];

const RARITY      = { "Bombay": "CRITICAL", "AB-": "CRITICAL", "O-": "CRITICAL", "B-": "HIGH", "A-": "HIGH" };
const rarityColor = (g) => RARITY[g] === "CRITICAL" ? "#ff2244" : RARITY[g] === "HIGH" ? "#ff8800" : "#00cc88";
const BLOOD_GROUPS = ["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+", "Bombay"];

const tierColor = (tier) => tier === 1 ? "#ff2244" : tier === 2 ? "#ff8800" : "#f0c040";

// ─── STYLES ──────────────────────────────────────────────────────────────────
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syne:wght@400;600;800&display=swap');
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  :root {
    --bg: #0d0d14; --surface: #12121c; --card: #16161f;
    --border: #1e1e2e; --red: #c0392b; --orange: #e67e22;
    --green: #27ae60; --blue: #3d7eff; --muted: #666;
    --text: #d4d4d8; --font: 'Syne', sans-serif;
    --font-mono: 'Space Mono', monospace;
  }
  body { background: var(--bg); color: var(--text); font-family: var(--font); }
  nav {
    position: sticky; top: 0; z-index: 100;
    display: flex; align-items: center; gap: 8px;
    padding: 0 24px; background: rgba(13,13,20,.95);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(12px); height: 56px;
  }
  .nav-logo { font-family: var(--font); font-weight: 800; font-size: 18px; color: #fff; letter-spacing: -0.5px; }
  .nav-logo span { color: var(--red); }
  .nav-tabs { display: flex; gap: 4px; margin-left: auto; }
  .nav-tab {
    padding: 6px 14px; border-radius: 8px; border: none; background: transparent;
    color: var(--muted); font-family: var(--font); font-size: 13px; font-weight: 600;
    cursor: pointer; transition: all .2s;
  }
  .nav-tab:hover { background: var(--surface); color: var(--text); }
  .nav-tab.active { background: var(--red); color: #fff; }
  main { max-width: 1200px; margin: 0 auto; padding: 28px 24px; }
  h2 { font-size: 22px; font-weight: 800; color: #fff; margin-bottom: 4px; }
  h3 { font-size: 14px; font-weight: 700; color: var(--text); margin-bottom: 12px; }
  .subtitle { font-family: var(--font-mono); font-size: 11px; color: var(--muted); margin-bottom: 24px; }
  .card {
    background: var(--card); border: 1px solid var(--border);
    border-radius: 12px; padding: 20px;
  }
  .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
  .grid-2 { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
  .badge { display: inline-flex; align-items: center; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 700; font-family: var(--font-mono); }
  .badge-red    { background: rgba(192,57,43,.15); color: #ff6b6b; border: 1px solid #c0392b44; }
  .badge-orange { background: rgba(230,126,34,.12); color: #e67e22; border: 1px solid #e67e2244; }
  .badge-green  { background: rgba(39,174,96,.12);  color: #27ae60; border: 1px solid #27ae6044; }
  .badge-blue   { background: rgba(61,126,255,.12); color: #3d7eff; border: 1px solid #3d7eff44; }
  .badge-gold   { background: rgba(240,192,64,.12); color: #f0c040; border: 1px solid #f0c04044; }
  .credit-big { font-family: var(--font-mono); font-size: 40px; font-weight: 700; color: var(--orange); }
  .donation-row { display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .donation-row:last-child { border-bottom: none; }
  .slide-in { animation: slideIn .3s ease; }
  @keyframes slideIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
  .sos-active { animation: pulse-border 1.2s ease-out infinite; border: 2px solid var(--red) !important; }
  @keyframes pulse-border { 0%,100% { box-shadow: 0 0 0 0 rgba(192,57,43,.4); } 50% { box-shadow: 0 0 0 8px rgba(192,57,43,0); } }
  select, input, textarea {
    background: var(--surface); border: 1px solid var(--border); border-radius: 8px;
    color: var(--text); font-family: var(--font); font-size: 13px; padding: 8px 12px;
    outline: none; transition: border-color .2s; width: 100%;
  }
  select:focus, input:focus, textarea:focus { border-color: var(--red); }
  button.primary {
    background: var(--red); color: #fff; border: none; border-radius: 8px;
    padding: 10px 20px; font-family: var(--font); font-weight: 700; font-size: 13px;
    cursor: pointer; transition: opacity .2s;
  }
  button.primary:hover { opacity: .85; }
  button.primary:disabled { opacity: .4; cursor: default; }
  .table-row { display: flex; gap: 12px; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--border); }
  .table-row:last-child { border-bottom: none; }
`;

function StyleTag() {
  return <style>{css}</style>;
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW 1: DASHBOARD
// ════════════════════════════════════════════════════════════════════════════
function Dashboard() {
  const [hospitals, setHospitals] = useState(MOCK_HOSPITALS);
  const [match,     setMatch]     = useState(null);
  const [form,      setForm]      = useState({ blood_group: "O-", lat: "28.5672", lng: "77.2100", units: "1" });
  const [loading,   setLoading]   = useState(false);
  const [trackId,   setTrackId]   = useState("");
  const [trackData, setTrackData] = useState(null);

  const bloodGroups = Object.entries(
    Object.values(hospitals).reduce((acc, h) => {
      Object.entries(h.inventory).forEach(([g, u]) => { acc[g] = (acc[g] || 0) + u; });
      return acc;
    }, {})
  ).map(([g, u]) => ({ group: g, units: u }));

  const requestBlood = async () => {
    setLoading(true);
    if (DEMO_MODE) { setMatch(MOCK_MATCH); setLoading(false); return; }
    try {
      const res = await axios.post(`${API_BASE}/request-blood`, {
        blood_group: form.blood_group, recipient_lat: parseFloat(form.lat),
        recipient_lng: parseFloat(form.lng), units_needed: parseInt(form.units),
      });
      setMatch(res.data);
    } catch { setMatch(MOCK_MATCH); }
    setLoading(false);
  };

  const trackRider = async () => {
    if (!trackId) return;
    if (DEMO_MODE) { setTrackData({ request_id: trackId, status:"EN_ROUTE", progress_pct:62, remaining_eta:3.1, rider_name:"Arjun K.", hospital:"AIIMS Delhi", blood_group:"O-" }); return; }
    try {
      const res = await axios.get(`${API_BASE}/track-rider/${trackId}`);
      setTrackData(res.data);
    } catch { setTrackData(null); }
  };

  return (
    <div className="slide-in">
      <h2>Live Dispatch</h2>
      <p className="subtitle">// Real-Time Blood Matching · Golden Hour Protocol · Rider Assignment</p>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        {/* Request Form */}
        <div className="card">
          <h3>🚨 Request Blood</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Blood Group</label>
              <select value={form.blood_group} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))}>
                {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div className="grid-2">
              <div>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Recipient Lat</label>
                <input value={form.lat} onChange={e => setForm(f => ({ ...f, lat: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Recipient Lng</label>
                <input value={form.lng} onChange={e => setForm(f => ({ ...f, lng: e.target.value }))} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Units Needed</label>
              <input type="number" min="1" value={form.units} onChange={e => setForm(f => ({ ...f, units: e.target.value }))} />
            </div>
            <button className="primary" onClick={requestBlood} disabled={loading}>
              {loading ? "Matching…" : "⚡ Find Best Match"}
            </button>
          </div>
        </div>

        {/* Match Result */}
        <div className={`card ${match ? "sos-active" : ""}`}>
          <h3>📍 Match Result</h3>
          {!match ? (
            <div style={{ color: "var(--muted)", fontSize: 13, fontFamily: "var(--font-mono)" }}>
              // Awaiting dispatch request…
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                <span className="badge badge-red">{match.blood_group}</span>
                <span className="badge badge-green">REQ#{match.request_id}</span>
                {match.golden_hour_alert && <span className="badge badge-orange">⚠ GOLDEN HOUR EXCEEDED</span>}
              </div>
              <div style={{ background: "var(--surface)", borderRadius: 8, padding: 14, marginBottom: 12 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#fff", marginBottom: 4 }}>
                  🏥 {match.best_match.hospital_name}
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", lineHeight: 1.8 }}>
                  📏 {match.best_match.distance_km} km away · ⏱ ETA {match.best_match.eta_minutes} min<br/>
                  🏆 {match.best_match.tier_label}<br/>
                  🏍 Rider: <span style={{ color: "var(--orange)" }}>{match.rider?.name}</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: "var(--muted)", marginBottom: 6 }}>ALL CANDIDATES</div>
                {match.all_candidates.map((c, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid var(--border)", fontSize: 12 }}>
                    <span style={{ color: i === 0 ? "var(--green)" : "var(--muted)" }}>{i === 0 ? "▶ " : "  "}{c.hospital_name}</span>
                    <span style={{ fontFamily: "var(--font-mono)", color: "var(--muted)" }}>{c.eta_minutes}m · {c.distance_km}km</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Inventory Overview */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>🩸 Network Inventory Overview</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {bloodGroups.map(({ group, units }) => (
            <div key={group} style={{
              background: "var(--surface)", border: `1px solid ${rarityColor(group)}44`,
              borderRadius: 8, padding: "10px 14px", textAlign: "center", minWidth: 64,
            }}>
              <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: rarityColor(group), fontSize: 15 }}>{group}</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: units === 0 ? "#c0392b" : "#fff", marginTop: 2 }}>{units}</div>
              <div style={{ fontSize: 10, color: "var(--muted)" }}>units</div>
            </div>
          ))}
        </div>
      </div>

      {/* Track Rider */}
      <div className="card">
        <h3>📡 Track Active Rider</h3>
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <input placeholder="Enter Request ID (e.g. A3F9B1)" value={trackId}
            onChange={e => setTrackId(e.target.value)} style={{ flex: 1 }} />
          <button className="primary" onClick={trackRider}>Track</button>
        </div>
        {trackData && (
          <div style={{ background: "var(--surface)", borderRadius: 8, padding: 14 }}>
            <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
              <span className="badge badge-green">REQ#{trackData.request_id}</span>
              <span className="badge badge-orange">{trackData.status}</span>
              <span className="badge badge-red">{trackData.blood_group}</span>
            </div>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", lineHeight: 2 }}>
              🏍 Rider: {trackData.rider_name}<br/>
              🏥 Hospital: {trackData.hospital}<br/>
              ⏱ Remaining ETA: {trackData.remaining_eta} min
            </div>
            <div style={{ marginTop: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--muted)", marginBottom: 4 }}>
                <span>Progress</span><span>{trackData.progress_pct}%</span>
              </div>
              <div style={{ height: 6, background: "var(--border)", borderRadius: 3 }}>
                <div style={{ height: 6, borderRadius: 3, width: `${trackData.progress_pct}%`,
                  background: "linear-gradient(90deg,#c0392b,#e67e22)", transition: "width .5s" }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW 2: TRACKING
// ════════════════════════════════════════════════════════════════════════════
function TrackingView() {
  const [trackId,   setTrackId]   = useState("A3F9B1");
  const [trackData, setTrackData] = useState(null);
  const [loading,   setLoading]   = useState(false);

  const track = async () => {
    setLoading(true);
    if (DEMO_MODE) {
      await new Promise(r => setTimeout(r, 400));
      setTrackData({ request_id: trackId, status:"EN_ROUTE", progress_pct:62, remaining_eta:3.1, rider_name:"Arjun K.", rider: { tier: "Platinum" }, hospital:"AIIMS Delhi", blood_group:"O-" });
      setLoading(false); return;
    }
    try {
      const res = await axios.get(`${API_BASE}/track-rider/${trackId}`);
      setTrackData(res.data);
    } catch { setTrackData(null); }
    setLoading(false);
  };

  const statusColor = s => s === "DELIVERED" ? "#27ae60" : s === "EN_ROUTE" ? "#e67e22" : "#3d7eff";

  return (
    <div className="slide-in">
      <h2>Live Tracking</h2>
      <p className="subtitle">// Golden Hour Monitor · Real-Time Rider Position · Delivery Confirmation</p>
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <input placeholder="Request ID" value={trackId} onChange={e => setTrackId(e.target.value)} style={{ flex: 1 }} />
          <button className="primary" onClick={track} disabled={loading}>{loading ? "…" : "Track"}</button>
        </div>
      </div>
      {trackData && (
        <div className="card">
          <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20 }}>
            <span className="badge badge-green">REQ#{trackData.request_id}</span>
            <span style={{ background: statusColor(trackData.status) + "22", color: statusColor(trackData.status), border: `1px solid ${statusColor(trackData.status)}44`, borderRadius: 20, padding: "3px 10px", fontSize: 11, fontWeight: 700 }}>{trackData.status}</span>
            <span className="badge badge-red">{trackData.blood_group}</span>
          </div>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <div style={{ fontSize: 64, marginBottom: 8 }}>🏍</div>
            <div style={{ fontWeight: 800, fontSize: 18, color: "#fff" }}>{trackData.rider_name}</div>
            <div style={{ color: "var(--muted)", fontSize: 13 }}>en route to {trackData.hospital}</div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--muted)", marginBottom: 6 }}>
              <span>Delivery Progress</span>
              <span style={{ fontFamily: "var(--font-mono)", color: "#fff" }}>{trackData.progress_pct}%</span>
            </div>
            <div style={{ height: 10, background: "var(--border)", borderRadius: 5 }}>
              <div style={{ height: 10, borderRadius: 5, width: `${trackData.progress_pct}%`,
                background: `linear-gradient(90deg,#c0392b,#e67e22)`, transition: "width .5s",
                boxShadow: "0 0 8px #e67e2288" }} />
            </div>
          </div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, color: "var(--muted)", textAlign: "center" }}>
            ⏱ {trackData.remaining_eta} minutes remaining
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW 3: DONOR WALLET
// ════════════════════════════════════════════════════════════════════════════
function BloodInventoryGraph() {
  const data = [
    { group: "O-", units: 8, rarity: "CRITICAL" },
    { group: "O+", units: 70, rarity: "COMMON" },
    { group: "A-", units: 6, rarity: "HIGH" },
    { group: "A+", units: 49, rarity: "COMMON" },
    { group: "B-", units: 7, rarity: "HIGH" },
    { group: "B+", units: 38, rarity: "COMMON" },
    { group: "AB-", units: 6, rarity: "CRITICAL" },
    { group: "AB+", units: 22, rarity: "COMMON" },
    { group: "Bombay", units: 3, rarity: "CRITICAL" },
  ];
  const colors = data.map(d => d.rarity === "CRITICAL" ? "#c0392b" : d.rarity === "HIGH" ? "#e67e22" : "#27ae60");

  return (
    <div className="card">
      <h3>Network Blood Supply</h3>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
          <XAxis dataKey="group" tick={{ fill: "#666", fontSize: 11 }} />
          <YAxis tick={{ fill: "#666", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#12121c", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 12 }} />
          <Bar dataKey="units" radius={[4, 4, 0, 0]}>
            {data.map((_, i) => <Cell key={i} fill={colors[i]} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DonorWallet() {
  const [donor, setDonor] = useState(MOCK_DONOR);

  useEffect(() => {
    if (DEMO_MODE) return;
    axios.get(`${API_BASE}/donor/D001`).then(r => setDonor(r.data)).catch(() => {});
  }, []);

  return (
    <div className="slide-in">
      <h2>Donor Wallet</h2>
      <p className="subtitle">// {donor.name} · Blood Group {donor.blood_group} · {donor.donations} Donations</p>
      <div className="grid-3" style={{ marginBottom: 20 }}>
        <div className="card" style={{ gridColumn: "1 / 3" }}>
          <h3>Health Credits Balance</h3>
          <div className="credit-big">{donor.health_credits.toLocaleString()}</div>
          <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", marginTop: 8 }}>
            Lifetime credits earned · Rare blood group O- earns 5× standard rate
          </p>
          <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
            <span className="badge badge-red">O- · CRITICAL TIER</span>
            <span className="badge badge-orange">+150 credits/unit</span>
          </div>
        </div>
        <div className="card">
          <h3>Stats</h3>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 2.4 }}>
            <div>🩸 Donations: <strong>27</strong></div>
            <div>💊 Lives Impacted: <strong>~21</strong></div>
            <div>📅 Next Eligible: <strong style={{ color: "var(--green)" }}>Dec 2026</strong></div>
          </div>
        </div>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        <h3>Donation History</h3>
        {MOCK_HISTORY.map((d, i) => (
          <div className="donation-row" key={i}>
            <div>
              <div style={{ fontWeight: 600 }}>{d.hospital}</div>
              <div style={{ fontSize: 11, color: "var(--muted)", fontFamily: "var(--font-mono)" }}>{d.date}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "var(--font-mono)", color: rarityColor(d.group) }}>{d.group} · {d.units}u</div>
              <div style={{ color: "var(--orange)", fontWeight: 700, fontFamily: "var(--font-mono)" }}>+{d.credits} HC</div>
            </div>
          </div>
        ))}
      </div>
      <BloodInventoryGraph />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW 4: NETWORK INSIGHTS
// ════════════════════════════════════════════════════════════════════════════
function NetworkInsights() {
  const [hierarchy, setHierarchy] = useState(MOCK_HIERARCHY);
  const [selected, setSelected]   = useState(null);

  useEffect(() => {
    if (DEMO_MODE) return;
    axios.get(`${API_BASE}/network-hierarchy`)
      .then(res => setHierarchy(res.data.hierarchy))
      .catch(() => setHierarchy(MOCK_HIERARCHY));
  }, []);

  const allFlows = hierarchy.flatMap(h =>
    (h.shared_history || []).map(s => ({
      from: h.hospital_name,
      to:   hierarchy.find(x => x.hospital_id === s.to)?.hospital_name || s.to,
      units: s.units,
      blood_group: s.blood_group,
      timestamp: s.timestamp,
    }))
  );

  return (
    <div className="slide-in">
      <h2>Network Insights</h2>
      <p className="subtitle">// Hospital Hierarchy · Blood Flow Analytics · Share Score Algorithm</p>

      <div className="card" style={{ marginBottom: 20, borderColor: "var(--blue)", background: "rgba(61,126,255,0.05)" }}>
        <h3>📐 Hierarchy Algorithm</h3>
        <p style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--muted)", lineHeight: 1.8 }}>
          Share Score = <strong style={{ color: "var(--blue)" }}>(Total_Shared × 0.7) + (Capacity_Ratio × 0.3 × 100)</strong>
        </p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {hierarchy.map(h => (
          <div key={h.hospital_id} className="card"
            style={{ borderColor: tierColor(h.tier) + "44", cursor: "pointer", transition: "border-color .2s" }}
            onClick={() => setSelected(selected?.hospital_id === h.hospital_id ? null : h)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#fff", marginBottom: 4 }}>{h.hospital_name}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  <span className="badge" style={{ background: tierColor(h.tier) + "22", color: tierColor(h.tier), border: `1px solid ${tierColor(h.tier)}44` }}>{h.badge}</span>
                  <span className="badge badge-blue">Score: {h.share_score}</span>
                </div>
              </div>
              <div style={{ textAlign: "right", fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)" }}>
                <div>Shared: {h.total_shared}u</div>
                <div>Received: {h.total_received}u</div>
              </div>
            </div>
            {selected?.hospital_id === h.hospital_id && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: "1px solid var(--border)" }}>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginBottom: 8 }}>
                  Formula: {h.formula}
                </div>
                {h.shared_history?.map((s, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: "var(--muted)", marginBottom: 4 }}>
                    <span style={{ color: rarityColor(s.blood_group) }}>{s.blood_group}</span>
                    <span>→ {hierarchy.find(x=>x.hospital_id===s.to)?.hospital_name || s.to}</span>
                    <span>{s.units}u</span>
                    <span>{s.timestamp}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="card">
        <h3>🔄 Recent Blood Flow</h3>
        {allFlows.map((f, i) => (
          <div key={i} className="table-row">
            <span className="badge badge-red">{f.blood_group}</span>
            <span style={{ fontSize: 12, color: "var(--text)" }}>{f.from}</span>
            <span style={{ color: "var(--muted)" }}>→</span>
            <span style={{ fontSize: 12, color: "var(--text)" }}>{f.to}</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--orange)", marginLeft: "auto" }}>{f.units}u · {f.timestamp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// VIEW 5: INVENTORY CONTROL
// ════════════════════════════════════════════════════════════════════════════
function InventoryControl() {
  const [hospitals, setHospitals] = useState(MOCK_HOSPITALS);
  const [form, setForm]           = useState({ hospital_id: "H001", blood_group: "O-", delta: "1" });
  const [result, setResult]       = useState(null);

  const updateStock = async () => {
    if (DEMO_MODE) {
      const h = { ...hospitals };
      h[form.hospital_id] = { ...h[form.hospital_id] };
      h[form.hospital_id].inventory = { ...h[form.hospital_id].inventory };
      h[form.hospital_id].inventory[form.blood_group] = Math.max(0, (h[form.hospital_id].inventory[form.blood_group] || 0) + parseInt(form.delta));
      setHospitals(h);
      setResult({ hospital_id: form.hospital_id, blood_group: form.blood_group, new_stock: h[form.hospital_id].inventory[form.blood_group] });
      return;
    }
    try {
      const res = await axios.post(`${API_BASE}/update-stock`, { hospital_id: form.hospital_id, blood_group: form.blood_group, delta: parseInt(form.delta) });
      setResult(res.data);
    } catch {}
  };

  return (
    <div className="slide-in">
      <h2>Inventory Control</h2>
      <p className="subtitle">// Stock Management · Real-Time Updates · Critical Alerts</p>

      <div className="grid-2" style={{ marginBottom: 20 }}>
        <div className="card">
          <h3>Update Stock</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Hospital</label>
              <select value={form.hospital_id} onChange={e => setForm(f => ({ ...f, hospital_id: e.target.value }))}>
                {Object.entries(hospitals).map(([id, h]) => <option key={id} value={id}>{h.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Blood Group</label>
              <select value={form.blood_group} onChange={e => setForm(f => ({ ...f, blood_group: e.target.value }))}>
                {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: "var(--muted)", display: "block", marginBottom: 4 }}>Delta (+ add / - remove)</label>
              <input type="number" value={form.delta} onChange={e => setForm(f => ({ ...f, delta: e.target.value }))} />
            </div>
            <button className="primary" onClick={updateStock}>Update Stock</button>
            {result && (
              <div style={{ background: "rgba(39,174,96,.1)", border: "1px solid #27ae6044", borderRadius: 8, padding: 10, fontFamily: "var(--font-mono)", fontSize: 12, color: "#27ae60" }}>
                ✓ New stock for {result.blood_group}: {result.new_stock} units
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <h3>Critical Alerts</h3>
          {Object.entries(hospitals).flatMap(([id, h]) =>
            Object.entries(h.inventory)
              .filter(([, u]) => u === 0)
              .map(([g]) => (
                <div key={`${id}-${g}`} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                  <span className="badge badge-red">ZERO STOCK</span>
                  <span style={{ fontSize: 12 }}>{h.name}</span>
                  <span className="badge" style={{ background: rarityColor(g) + "22", color: rarityColor(g), border: `1px solid ${rarityColor(g)}44` }}>{g}</span>
                </div>
              ))
          )}
        </div>
      </div>

      {Object.entries(hospitals).map(([id, h]) => (
        <div key={id} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>{h.name}</h3>
            <span className="badge badge-blue">Capacity: {h.storage_capacity}u</span>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.entries(h.inventory).map(([g, u]) => (
              <div key={g} style={{
                background: "var(--surface)", border: `1px solid ${u === 0 ? "#c0392b" : rarityColor(g) + "33"}`,
                borderRadius: 8, padding: "8px 12px", textAlign: "center", minWidth: 56,
              }}>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 700, color: rarityColor(g), fontSize: 13 }}>{g}</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: u === 0 ? "#c0392b" : "#fff" }}>{u}</div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// ROOT APP — now includes Rider Command Center tab
// ════════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState("dashboard");

  const tabs = [
    { id: "dashboard", label: "🏥 Dashboard" },
    { id: "tracking",  label: "📍 Live Track" },
    { id: "wallet",    label: "💳 Donor Wallet" },
    { id: "network",   label: "🌐 Network" },
    { id: "inventory", label: "🧪 Inventory" },
    { id: "riders",    label: "⚡ Rider Command" },   // ← NEW TAB
  ];

  return (
    <>
      <StyleTag />
      <nav>
        <div className="nav-logo">Rapid<span>Red</span></div>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>
          The Rapido for Blood
        </div>
        <div className="nav-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`nav-tab ${tab === t.id ? "active" : ""}`} onClick={() => setTab(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </nav>
      <main>
        {tab === "dashboard" && <Dashboard />}
        {tab === "tracking"  && <TrackingView />}
        {tab === "wallet"    && <DonorWallet />}
        {tab === "network"   && <NetworkInsights />}
        {tab === "inventory" && <InventoryControl />}
        {tab === "riders"    && <RiderCommandCenter />}
      </main>
    </>
  );
}
