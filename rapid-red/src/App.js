/* eslint-disable */
import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  LineChart, Line, BarChart, Bar, Cell,
  PieChart, Pie, Sector,
  XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer
} from "recharts";
import RiderCommandCenter from "./components/RiderCommandCeter";

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:8000";
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

  /* Mission Control */
  @keyframes radar-pulse {
    0%   { transform: scale(1);   opacity: .7; }
    100% { transform: scale(3.5); opacity: 0;  }
  }
  .radar-ring {
    position: absolute; border-radius: 50%;
    border: 2px solid #e67e22;
    animation: radar-pulse 2s ease-out infinite;
    pointer-events: none;
  }
  .radar-ring:nth-child(2) { animation-delay: .7s; }
  .radar-ring:nth-child(3) { animation-delay: 1.4s; }
  @keyframes blink-red { 0%,100% { opacity:1; } 50% { opacity:.25; } }
  .blink { animation: blink-red 1s ease infinite; }
  .mishap-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,.78); backdrop-filter: blur(6px);
    display: flex; align-items: center; justify-content: center;
    animation: slideIn .25s ease;
  }
  .mishap-box {
    background: #16161f; border: 2px solid #c0392b;
    border-radius: 16px; padding: 28px 32px; width: 440px; max-width: 95vw;
    box-shadow: 0 0 48px rgba(192,57,43,.4);
  }
  .mishap-btn {
    width: 100%; padding: 11px 16px; border-radius: 9px; border: 1px solid #2a2a3a;
    background: #12121c; color: #d4d4d8; font-family: 'Syne',sans-serif;
    font-size: 13px; font-weight: 600; cursor: pointer; text-align: left;
    transition: all .18s; margin-bottom: 8px; display: flex; align-items: center; gap: 10px;
  }
  .mishap-btn:hover { border-color: #e67e22; color: #fff; background: rgba(230,126,34,.1); }
  .mishap-btn.danger:hover { border-color: #c0392b; background: rgba(192,57,43,.12); }
  .mc-stat {
    background: var(--surface); border: 1px solid var(--border);
    border-radius: 10px; padding: 14px 16px; text-align: center;
  }
  .mc-stat-val { font-family: 'Space Mono',monospace; font-size: 20px; font-weight: 700; color: #fff; }
  .mc-stat-lbl { font-size: 10px; color: var(--muted); margin-top: 3px; letter-spacing: .5px; text-transform: uppercase; }
  .action-btn {
    flex: 1; display: flex; align-items: center; justify-content: center; gap: 7px;
    padding: 11px 0; border-radius: 9px; border: 1px solid #2a2a3a;
    background: #12121c; color: #d4d4d8; font-family: 'Syne',sans-serif;
    font-size: 13px; font-weight: 700; cursor: pointer; transition: all .18s;
  }
  .action-btn:hover { border-color: var(--blue); color: #fff; background: rgba(61,126,255,.1); }
  .msg-chip {
    padding: 8px 14px; border-radius: 20px; border: 1px solid #27ae6044;
    background: rgba(39,174,96,.08); color: #27ae60; font-size: 12px; font-weight: 600;
    cursor: pointer; transition: all .18s; font-family: 'Syne',sans-serif;
  }
  .msg-chip:hover { background: rgba(39,174,96,.2); border-color: #27ae60; }
  .backup-card {
    background: rgba(39,174,96,.07); border: 1px solid #27ae6033;
    border-radius: 10px; padding: 14px 16px; margin-top: 12px;
  }
  /* ══ City-Wide Demand & Camp Planner ══ */
  @keyframes cp-pulse-ring {
    0%   { transform:scale(1);   opacity:.6; }
    100% { transform:scale(2.4); opacity:0;  }
  }
  @keyframes cp-bar-fill {
    from { width:0%; }
  }
  .cp-header {
    background: linear-gradient(135deg,#0a0f1a 0%,#0d1520 60%,#0f1a0a 100%);
    border:2px solid #3d7eff44; border-radius:14px;
    padding:24px 28px; margin-bottom:20px;
    position:relative; overflow:hidden;
  }
  .cp-header::before {
    content:''; position:absolute; inset:0;
    background: repeating-linear-gradient(
      45deg,transparent 0px,transparent 24px,
      rgba(61,126,255,.025) 24px,rgba(61,126,255,.025) 25px
    );
    pointer-events:none;
  }
  .cp-title {
    font-size:26px; font-weight:800; letter-spacing:-.5px;
    background:linear-gradient(90deg,#3d7eff,#00d4ff,#27ae60);
    -webkit-background-clip:text; -webkit-text-fill-color:transparent;
    background-clip:text;
  }
  .cp-region-pill {
    display:inline-flex; align-items:center; gap:6px;
    padding:5px 14px; border-radius:20px;
    font-size:12px; font-weight:700; cursor:pointer;
    transition:all .18s; border:1px solid transparent;
    font-family:'Syne',sans-serif;
  }
  .cp-rank-badge {
    width:28px; height:28px; border-radius:50%;
    display:flex; align-items:center; justify-content:center;
    font-weight:800; font-size:13px; flex-shrink:0;
  }
  .cp-camp-card {
    background:#13161f; border:1px solid #1e2a3e;
    border-radius:12px; overflow:hidden;
    transition:border-color .2s, transform .15s;
    margin-bottom:14px;
  }
  .cp-camp-card:hover { border-color:#3d7eff55; transform:translateY(-1px); }
  .cp-prob-bar-track {
    height:6px; background:#1e2a3e; border-radius:3px; overflow:hidden;
    margin-top:6px;
  }
  .cp-prob-bar-fill {
    height:6px; border-radius:3px;
    animation:cp-bar-fill .8s ease both;
  }
  .cp-institute-row {
    display:flex; align-items:flex-start; gap:10px;
    padding:9px 0; border-bottom:1px solid #1a2030;
    font-size:12px;
  }
  .cp-institute-row:last-child { border-bottom:none; }
  .cp-inst-icon {
    width:32px; height:32px; border-radius:8px;
    display:flex; align-items:center; justify-content:center;
    font-size:15px; flex-shrink:0;
  }
  .cp-strategy-row {
    display:grid;
    grid-template-columns: 140px 90px 1fr 100px 110px;
    gap:12px; align-items:center;
    padding:11px 16px; border-bottom:1px solid #1a2030;
    transition:background .15s;
  }
  .cp-strategy-row:hover { background:rgba(61,126,255,.04); }
  .cp-strategy-header {
    display:grid;
    grid-template-columns: 140px 90px 1fr 100px 110px;
    gap:12px; padding:9px 16px;
    background:#0f1420; border-bottom:1px solid #1e2a3e;
  }
  .cp-sim-btn {
    padding:10px 22px; border-radius:9px;
    border:1px solid #3d7eff55; background:rgba(61,126,255,.1);
    color:#3d7eff; font-family:'Syne',sans-serif;
    font-weight:700; font-size:13px; cursor:pointer;
    transition:all .18s; display:flex; align-items:center; gap:8px;
  }
  .cp-sim-btn:hover { background:rgba(61,126,255,.2); border-color:#3d7eff; }
  .cp-sim-btn:disabled { opacity:.4; cursor:default; }
  .cp-tooltip-custom {
    background:#12121c; border:1px solid #1e2a3e;
    border-radius:8px; padding:10px 14px; font-size:12px;
    font-family:'Space Mono',monospace;
  }

  /* ══ Code Rare Module ══ */
  @keyframes cr-scan {
    0%   { background-position: 0% 50%;   }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%;   }
  }
  @keyframes cr-border-glow {
    0%,100% { box-shadow: 0 0 0 0 rgba(220,38,127,.0); }
    50%      { box-shadow: 0 0 18px 4px rgba(220,38,127,.35); }
  }
  @keyframes cr-unlock-spin {
    0%   { transform: rotate(0deg) scale(1);   }
    50%  { transform: rotate(180deg) scale(1.3); }
    100% { transform: rotate(360deg) scale(1);  }
  }
  .cr-header {
    background: linear-gradient(135deg,#1a0a0f 0%,#1f0d1a 50%,#0d1520 100%);
    border: 2px solid #dc267f66;
    border-radius: 14px; padding: 24px 28px; margin-bottom: 20px;
    animation: cr-border-glow 3s ease infinite;
    position: relative; overflow: hidden;
  }
  .cr-header::before {
    content:''; position:absolute; inset:0;
    background: repeating-linear-gradient(
      90deg, transparent 0px, transparent 18px,
      rgba(220,38,127,.04) 18px, rgba(220,38,127,.04) 19px
    );
    pointer-events: none;
  }
  .cr-title {
    font-size: 26px; font-weight: 800; letter-spacing: -0.5px;
    background: linear-gradient(90deg,#ff2277,#dc267f,#a855f7);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .cr-confirm-overlay {
    position: fixed; inset: 0; z-index: 9999;
    background: rgba(0,0,0,.88); backdrop-filter: blur(8px);
    display: flex; align-items: center; justify-content: center;
    animation: slideIn .2s ease;
  }
  .cr-confirm-box {
    background: #0f0a14;
    border: 2px solid #dc267f;
    border-radius: 18px; padding: 36px 40px;
    width: 480px; max-width: 95vw; text-align: center;
    box-shadow: 0 0 60px rgba(220,38,127,.4), 0 0 120px rgba(220,38,127,.15);
  }
  .cr-confirm-icon {
    font-size: 52px; margin-bottom: 12px;
    animation: cr-unlock-spin 2s ease-in-out infinite;
    display: inline-block;
  }
  .cr-donor-card {
    border-radius: 12px; padding: 0;
    border: 1px solid #2a1a2e;
    background: #13101a;
    overflow: hidden; transition: transform .15s, border-color .15s;
    margin-bottom: 12px;
  }
  .cr-donor-card:hover { transform: translateY(-1px); border-color: #dc267f55; }
  .cr-group-bombay { color: #dc267f !important; }
  .cr-group-ab-neg  { color: #a855f7 !important; }
  .cr-group-o-neg   { color: #ff4466 !important; }
  .cr-filter-btn {
    padding: 6px 14px; border-radius: 20px; border: 1px solid #2a1a2e;
    background: transparent; font-family: 'Syne',sans-serif;
    font-size: 12px; font-weight: 700; cursor: pointer; transition: all .16s;
  }
  .cr-filter-btn.active-bombay { border-color:#dc267f; background:rgba(220,38,127,.12); color:#dc267f; }
  .cr-filter-btn.active-ab-neg { border-color:#a855f7; background:rgba(168,85,247,.12);  color:#a855f7; }
  .cr-filter-btn.active-o-neg  { border-color:#ff4466; background:rgba(255,68,102,.12);  color:#ff4466; }
  .cr-filter-btn.active-all    { border-color:#fff;    background:rgba(255,255,255,.08); color:#fff;    }
  .cr-filter-btn:not(.active-bombay):not(.active-ab-neg):not(.active-o-neg):not(.active-all) {
    color: #666;
  }
  .cr-call-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 14px; border-radius: 8px; border: 1px solid #27ae6044;
    background: rgba(39,174,96,.08); color: #27ae60;
    font-family: 'Syne',sans-serif; font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all .16s; flex: 1;
  }
  .cr-call-btn:hover { background: rgba(39,174,96,.2); border-color: #27ae60; }
  .cr-dispatch-btn {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    padding: 8px 14px; border-radius: 8px; border: 1px solid #dc267f44;
    background: rgba(220,38,127,.08); color: #dc267f;
    font-family: 'Syne',sans-serif; font-size: 12px; font-weight: 700;
    cursor: pointer; transition: all .16s; flex: 1;
  }
  .cr-dispatch-btn:hover { background: rgba(220,38,127,.2); border-color: #dc267f; }
  .cr-eligible   { color: #27ae60; font-weight: 700; }
  .cr-ineligible { color: #c0392b; font-weight: 700; }
  .cr-history-row {
    display: flex; gap: 8px; align-items: center;
    padding: 5px 0; border-bottom: 1px solid #1a1020;
    font-size: 11px; font-family: 'Space Mono',monospace; color: #666;
  }
  .cr-history-row:last-child { border-bottom: none; }
  .cr-lock-screen {
    text-align: center; padding: 64px 20px;
    background: linear-gradient(180deg,#0f0a14,#0d0d14);
    border: 2px dashed #dc267f44; border-radius: 14px;
    margin-top: 8px;
  }

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
// VIEW 2: TRACKING  —  MISSION CONTROL
// ════════════════════════════════════════════════════════════════════════════

// ── Mock delivery data ────────────────────────────────────────────────────
const MOCK_DELIVERY = {
  rider_id:    "RID-9921",
  delivery_id: "DEL-4402",
  blood_group: "O-",
  blood_label: "O Negative",
  units:        3,
  issued_at:   "2026-04-11 · 14:32",
  rider_name:  "Arjun Kumar",
  rider_avatar:"🏍",
  star_rating:  4.9,
  tier:        "Platinum",
  phone:       "+91-98765-43210",
  from_hospital:"AIIMS Delhi",
  to_hospital:  "RML Hospital",
  status:      "EN_ROUTE",
  progress_pct: 62,
  speed_kmh:   34,
  eta_minutes:  3.1,
  lat: 28.5672, lng: 77.2100,
};

const BACKUP_RIDERS = [
  { id:"RID-7734", name:"Priya Singh",   avatar:"🏍", tier:"Gold",     eta_minutes:4.2, lat:28.570, lng:77.215 },
  { id:"RID-5501", name:"Rohit Mehra",   avatar:"🛵", tier:"Silver",   eta_minutes:6.8, lat:28.562, lng:77.205 },
];

const DELAY_REASONS = [
  { icon:"🚦", label:"Heavy Traffic",      key:"traffic"  },
  { icon:"🌧", label:"Weather Conditions", key:"weather"  },
  { icon:"💥", label:"Accident Detected",  key:"accident" },
];

// ── Leaflet map sub-component ─────────────────────────────────────────────
function MissionMap({ delivery, backupRider }) {
  const mapRef    = React.useRef(null);
  const leafRef   = React.useRef(null);
  const markerRef = React.useRef(null);

  React.useEffect(() => {
    const L = window.L;
    if (!L || leafRef.current) return;
    const map = L.map(mapRef.current, {
      center: [delivery.lat, delivery.lng], zoom: 14, zoomControl: false,
    });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap"
    }).addTo(map);
    // rider marker
    const riderIcon = L.divIcon({ className:"", iconSize:[44,44], iconAnchor:[22,22],
      html:`<div style="width:44px;height:44px;border-radius:50%;background:#e67e22;
        display:flex;align-items:center;justify-content:center;font-size:22px;
        border:3px solid #fff;box-shadow:0 0 16px #e67e22aa;">🏍</div>` });
    markerRef.current = L.marker([delivery.lat, delivery.lng], { icon: riderIcon }).addTo(map);
    markerRef.current.bindTooltip(`<b>${delivery.rider_name}</b><br/>Speed: ${delivery.speed_kmh} km/h`, { permanent:false, direction:"top" });
    // destination marker
    const destIcon = L.divIcon({ className:"", iconSize:[36,36], iconAnchor:[18,18],
      html:`<div style="width:36px;height:36px;border-radius:50%;background:#c0392b;
        display:flex;align-items:center;justify-content:center;font-size:18px;
        border:2px solid #fff;box-shadow:0 0 10px #c0392baa;">🏥</div>` });
    L.marker([28.5598, 77.1996], { icon: destIcon }).addTo(map)
     .bindTooltip(delivery.to_hospital, { permanent:true, direction:"top", className:"" });
    leafRef.current = map;
  }, []);

  React.useEffect(() => {
    if (!leafRef.current || !backupRider) return;
    const L = window.L;
    const icon = L.divIcon({ className:"", iconSize:[36,36], iconAnchor:[18,18],
      html:`<div style="width:36px;height:36px;border-radius:50%;background:#27ae60;
        display:flex;align-items:center;justify-content:center;font-size:18px;
        border:3px solid #fff;box-shadow:0 0 12px #27ae60aa;">${backupRider.avatar}</div>` });
    L.marker([backupRider.lat, backupRider.lng], { icon })
     .addTo(leafRef.current)
     .bindTooltip(`<b>BACKUP: ${backupRider.name}</b><br/>ETA: ${backupRider.eta_minutes} min`, { permanent:true, direction:"top" });
  }, [backupRider]);

  return (
    <div style={{ position:"relative", height:280, borderRadius:10, overflow:"hidden" }}>
      <div ref={mapRef} style={{ width:"100%", height:"100%" }} />
      {/* Radar overlay centred on map */}
      <div style={{ position:"absolute", top:"50%", left:"50%",
        transform:"translate(-50%,-50%)", width:44, height:44, pointerEvents:"none" }}>
        <div className="radar-ring" style={{ width:44, height:44, top:0, left:0 }} />
        <div className="radar-ring" style={{ width:44, height:44, top:0, left:0 }} />
        <div className="radar-ring" style={{ width:44, height:44, top:0, left:0 }} />
      </div>
    </div>
  );
}

// ── Mishap / Delay popup ──────────────────────────────────────────────────
function MishapPopup({ onClose, onSelect }) {
  return (
    <div className="mishap-overlay" onClick={onClose}>
      <div className="mishap-box" onClick={e => e.stopPropagation()}>
        <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
          <span style={{ fontSize:26 }}>⚠️</span>
          <div>
            <div style={{ color:"#ff6b6b", fontWeight:800, fontSize:15 }}>Delay Detected</div>
            <div style={{ color:"var(--muted)", fontSize:12, fontFamily:"var(--font-mono)", marginTop:2 }}>
              Rider stationary &gt; 3 min. Select a reason:
            </div>
          </div>
        </div>
        {DELAY_REASONS.map(r => (
          <button key={r.key}
            className={`mishap-btn${r.key==="accident" ? " danger" : ""}`}
            onClick={() => onSelect(r.key)}>
            <span style={{ fontSize:18 }}>{r.icon}</span>
            <div>
              <div style={{ fontWeight:700 }}>{r.label}</div>
              {r.key==="accident" && (
                <div style={{ fontSize:11, color:"#ff6b6b", marginTop:2 }}>
                  Triggers backup rider + assistance alert
                </div>
              )}
            </div>
          </button>
        ))}
        <button onClick={onClose} style={{ marginTop:8, width:"100%", padding:"9px", borderRadius:9,
          border:"1px solid #333", background:"transparent", color:"var(--muted)",
          cursor:"pointer", fontSize:12, fontFamily:"var(--font)" }}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

// ── Main TrackingView (Mission Control) ───────────────────────────────────
function TrackingView() {
  const [delivery,    setDelivery]    = React.useState(null);
  const [loading,     setLoading]     = React.useState(false);
  const [trackId,     setTrackId]     = React.useState("DEL-4402");
  const [progress,    setProgress]    = React.useState(62);
  const [speed,       setSpeed]       = React.useState(34);
  const [eta,         setEta]         = React.useState(3.1);
  const [showMishap,  setShowMishap]  = React.useState(false);
  const [mishapReason,setMishapReason]= React.useState(null);   // traffic | weather | accident
  const [backupRider, setBackupRider] = React.useState(null);
  const [assistSent,  setAssistSent]  = React.useState(false);
  const [msgSent,     setMsgSent]     = React.useState("");
  const [alertLog,    setAlertLog]    = React.useState([]);
  const stationaryRef = React.useRef(null);

  // simulate live progress
  React.useEffect(() => {
    if (!delivery || mishapReason === "accident") return;
    const t = setInterval(() => {
      setProgress(p => Math.min(100, p + 0.4));
      setEta(e => Math.max(0, parseFloat((e - 0.05).toFixed(1))));
      setSpeed(Math.floor(28 + Math.random() * 18));
    }, 1200);
    return () => clearInterval(t);
  }, [delivery, mishapReason]);

  // stationary timer → trigger mishap popup after 8s
  React.useEffect(() => {
    if (!delivery || showMishap || mishapReason) return;
    stationaryRef.current = setTimeout(() => setShowMishap(true), 8000);
    return () => clearTimeout(stationaryRef.current);
  }, [delivery, showMishap, mishapReason]);

  const loadDelivery = async () => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    setDelivery(MOCK_DELIVERY);
    setProgress(62); setEta(3.1); setSpeed(34);
    setMishapReason(null); setBackupRider(null);
    setAssistSent(false); setAlertLog([]);
    setLoading(false);
  };

  const handleMishap = (reason) => {
    setShowMishap(false);
    setMishapReason(reason);
    const log = [...alertLog];
    if (reason === "traffic")  { log.push({ icon:"🚦", text:"Heavy traffic delay flagged", color:"#e67e22" }); }
    if (reason === "weather")  { log.push({ icon:"🌧", text:"Weather delay acknowledged",   color:"#3d7eff" }); }
    if (reason === "accident") {
      const br = BACKUP_RIDERS[0];
      setBackupRider(br);
      setAssistSent(true);
      log.push({ icon:"💥", text:"Accident detected — backup paged",    color:"#c0392b" });
      log.push({ icon:"🆘", text:`${br.name} dispatched · ETA ${br.eta_minutes} min`, color:"#27ae60" });
      log.push({ icon:"📡", text:"Assistance alert sent to rider location", color:"#e67e22" });
    }
    setAlertLog(log);
  };

  const sendMsg = (msg) => {
    setMsgSent(msg);
    setTimeout(() => setMsgSent(""), 3000);
  };

  const statusColor = mishapReason === "accident" ? "#c0392b"
    : mishapReason ? "#e67e22"
    : "#27ae60";
  const statusLabel = mishapReason === "accident" ? "⚠ ACCIDENT"
    : mishapReason === "traffic"  ? "🚦 DELAYED"
    : mishapReason === "weather"  ? "🌧 DELAYED"
    : "🟢 EN ROUTE";

  return (
    <div className="slide-in">
      {showMishap && <MishapPopup onClose={() => setShowMishap(false)} onSelect={handleMishap} />}

      <h2>Mission Control</h2>
      <p className="subtitle">// Live Delivery Tracking · Radar Overlay · Mishap Protocol · Backup Dispatch</p>

      {/* ── Search bar ── */}
      <div className="card" style={{ marginBottom:16 }}>
        <div style={{ display:"flex", gap:8 }}>
          <input placeholder="Delivery ID (e.g. DEL-4402)" value={trackId}
            onChange={e => setTrackId(e.target.value)} style={{ flex:1 }} />
          <button className="primary" onClick={loadDelivery} disabled={loading}>
            {loading ? "Loading…" : "⚡ Track"}
          </button>
        </div>
      </div>

      {!delivery ? (
        <div className="card" style={{ textAlign:"center", padding:"52px 20px", color:"var(--muted)",
          fontFamily:"var(--font-mono)", fontSize:13 }}>
          // Enter a Delivery ID to launch Mission Control
        </div>
      ) : (
        <>
          {/* ── Row 1: Digital ID header ── */}
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:16 }}>
            <div className="mc-stat">
              <div className="mc-stat-val" style={{ fontSize:15 }}>{delivery.rider_id}</div>
              <div className="mc-stat-lbl">Rider ID</div>
            </div>
            <div className="mc-stat">
              <div className="mc-stat-val" style={{ fontSize:15 }}>{delivery.delivery_id}</div>
              <div className="mc-stat-lbl">Delivery ID</div>
            </div>
            <div className="mc-stat">
              <div className="mc-stat-val" style={{ color:"#ff6b6b", fontSize:16 }}>{delivery.blood_group}</div>
              <div className="mc-stat-lbl">{delivery.blood_label} · {delivery.units} units</div>
            </div>
            <div className="mc-stat">
              <div className="mc-stat-val" style={{ fontSize:13, color:"var(--muted)" }}>{delivery.issued_at}</div>
              <div className="mc-stat-lbl">Issued At</div>
            </div>
          </div>

          {/* ── Row 2: Map + Rider Profile ── */}
          <div style={{ display:"grid", gridTemplateColumns:"1fr 320px", gap:16, marginBottom:16 }}>

            {/* Map card */}
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <div style={{ padding:"14px 16px 10px", borderBottom:"1px solid var(--border)",
                display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontWeight:700, fontSize:13 }}>📡 Live Position</div>
                <span style={{
                  background: statusColor+"22", color: statusColor,
                  border:`1px solid ${statusColor}44`,
                  borderRadius:20, padding:"3px 11px", fontSize:11, fontWeight:700,
                  fontFamily:"var(--font-mono)",
                }} className={mishapReason === "accident" ? "blink" : ""}>{statusLabel}</span>
              </div>
              <div style={{ padding:12 }}>
                <MissionMap delivery={delivery} backupRider={backupRider} />
              </div>
              {/* Speed / ETA strip */}
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr",
                borderTop:"1px solid var(--border)" }}>
                {[
                  { val:`${speed} km/h`, lbl:"Current Speed" },
                  { val:`${eta} min`,    lbl:"ETA"           },
                  { val:`${Math.round(progress)}%`, lbl:"Progress"    },
                ].map(s => (
                  <div key={s.lbl} style={{ padding:"12px 0", textAlign:"center",
                    borderRight:"1px solid var(--border)" }}>
                    <div style={{ fontFamily:"var(--font-mono)", fontWeight:700,
                      fontSize:16, color:"#fff" }}>{s.val}</div>
                    <div style={{ fontSize:10, color:"var(--muted)", marginTop:2,
                      textTransform:"uppercase", letterSpacing:.5 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
              {/* Progress bar */}
              <div style={{ padding:"10px 16px 14px" }}>
                <div style={{ height:6, background:"var(--border)", borderRadius:3 }}>
                  <div style={{ height:6, borderRadius:3, width:`${progress}%`,
                    background:"linear-gradient(90deg,#c0392b,#e67e22)",
                    transition:"width .6s", boxShadow:"0 0 8px #e67e2266" }} />
                </div>
              </div>
            </div>

            {/* Rider profile + actions */}
            <div style={{ display:"flex", flexDirection:"column", gap:12 }}>

              {/* Profile card */}
              <div className="card" style={{ textAlign:"center" }}>
                <div style={{ width:64, height:64, borderRadius:"50%", background:"#e67e2222",
                  border:"2px solid #e67e22", display:"flex", alignItems:"center",
                  justifyContent:"center", fontSize:32, margin:"0 auto 10px" }}>
                  {delivery.rider_avatar}
                </div>
                <div style={{ fontWeight:800, fontSize:15, color:"#fff" }}>{delivery.rider_name}</div>
                <div style={{ fontSize:11, color:"var(--muted)", fontFamily:"var(--font-mono)", margin:"4px 0 8px" }}>
                  {delivery.rider_id}
                </div>
                <div style={{ display:"flex", justifyContent:"center", gap:6 }}>
                  <span className="badge badge-gold">⭐ {delivery.star_rating}</span>
                  <span className="badge badge-orange">{delivery.tier}</span>
                </div>
                <div style={{ marginTop:10, fontSize:11, color:"var(--muted)",
                  fontFamily:"var(--font-mono)", lineHeight:1.8 }}>
                  📦 {delivery.from_hospital}<br/>
                  🏥 → {delivery.to_hospital}
                </div>
              </div>

              {/* Action buttons */}
              <div className="card" style={{ padding:14 }}>
                <div style={{ fontSize:11, color:"var(--muted)", fontWeight:700,
                  letterSpacing:.5, marginBottom:10 }}>COMMUNICATION</div>
                <div style={{ display:"flex", gap:8, marginBottom:10 }}>
                  <button className="action-btn"
                    onClick={() => alert(`Calling ${delivery.rider_name} at ${delivery.phone}`)}>
                    📞 Call Rider
                  </button>
                </div>
                <div style={{ fontSize:11, color:"var(--muted)", marginBottom:8 }}>Quick Message</div>
                <div style={{ display:"flex", flexWrap:"wrap", gap:7 }}>
                  {["How far are you?", "Hospital gates are open", "Please hurry!"].map(msg => (
                    <button key={msg} className="msg-chip" onClick={() => sendMsg(msg)}>
                      {msg}
                    </button>
                  ))}
                </div>
                {msgSent && (
                  <div style={{ marginTop:10, padding:"8px 12px", borderRadius:8,
                    background:"rgba(39,174,96,.12)", border:"1px solid #27ae6044",
                    fontSize:12, color:"#27ae60", fontFamily:"var(--font-mono)" }}>
                    ✓ Sent: "{msgSent}"
                  </div>
                )}
              </div>

              {/* Report delay button */}
              <button onClick={() => setShowMishap(true)} style={{
                width:"100%", padding:"11px 0", borderRadius:9,
                border:"1px solid #c0392b55", background:"rgba(192,57,43,.08)",
                color:"#ff6b6b", fontFamily:"var(--font)", fontWeight:700,
                fontSize:13, cursor:"pointer", transition:"all .18s",
              }}>
                ⚠ Report Delay / Mishap
              </button>
            </div>
          </div>

          {/* ── Row 3: Alert log + Backup ── */}
          {alertLog.length > 0 && (
            <div className="card" style={{ marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:12 }}>🛡 Incident Log</div>
              {alertLog.map((a, i) => (
                <div key={i} style={{ display:"flex", alignItems:"center", gap:10,
                  padding:"9px 0", borderBottom: i < alertLog.length-1 ? "1px solid var(--border)" : "none" }}>
                  <span style={{ fontSize:18 }}>{a.icon}</span>
                  <span style={{ fontSize:13, color: a.color, fontFamily:"var(--font-mono)", fontWeight:600 }}>
                    {a.text}
                  </span>
                  <span style={{ marginLeft:"auto", fontSize:10, color:"var(--muted)", fontFamily:"var(--font-mono)" }}>
                    just now
                  </span>
                </div>
              ))}

              {/* Backup rider card */}
              {backupRider && (
                <div className="backup-card">
                  <div style={{ fontSize:11, color:"#27ae60", fontWeight:700,
                    letterSpacing:.5, marginBottom:8 }}>✅ BACKUP RIDER DISPATCHED</div>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:40, height:40, borderRadius:"50%", background:"#27ae6022",
                      border:"2px solid #27ae60", display:"flex", alignItems:"center",
                      justifyContent:"center", fontSize:22 }}>{backupRider.avatar}</div>
                    <div>
                      <div style={{ fontWeight:800, color:"#fff" }}>{backupRider.name}</div>
                      <div style={{ fontSize:11, color:"var(--muted)", fontFamily:"var(--font-mono)" }}>
                        {backupRider.id} · {backupRider.tier} · ETA {backupRider.eta_minutes} min
                      </div>
                    </div>
                    <div style={{ marginLeft:"auto" }}>
                      <span className="badge badge-green">ACTIVE</span>
                    </div>
                  </div>
                  {assistSent && (
                    <div style={{ marginTop:10, padding:"8px 12px", borderRadius:7,
                      background:"rgba(230,126,34,.1)", border:"1px solid #e67e2244",
                      fontSize:12, color:"#e67e22", fontFamily:"var(--font-mono)" }}>
                      📡 Assistance alert dispatched to original rider's location
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
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

  const CustomDot = (props) => {
    const { cx, cy, payload } = props;
    const color = payload.rarity === "CRITICAL" ? "#c0392b" : payload.rarity === "HIGH" ? "#e67e22" : "#27ae60";
    return <circle cx={cx} cy={cy} r={5} fill={color} stroke="#0d0d14" strokeWidth={2} />;
  };

  return (
    <div className="card">
      <h3>Network Blood Supply</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
          <XAxis dataKey="group" tick={{ fill: "#666", fontSize: 11 }} />
          <YAxis tick={{ fill: "#666", fontSize: 11 }} />
          <Tooltip contentStyle={{ background: "#12121c", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 12 }} />
          <Line
            type="monotone"
            dataKey="units"
            stroke="#3d7eff"
            strokeWidth={2}
            dot={<CustomDot />}
            activeDot={{ r: 7, fill: "#3d7eff" }}
          />
        </LineChart>
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

      {/* ── Combined Hospital Blood Inventory Bar Chart ── */}
      {(() => {
        // Build one row per hospital: { name, "O-": 5, "O+": 12, ... }
        const chartData = Object.entries(hospitals).map(([, h]) => {
          const row = { name: h.name.replace(" Hospital", "").replace("Vasant Kunj", "V.Kunj").replace("Sarita Vihar", "S.Vihar") };
          BLOOD_GROUPS.forEach(g => { row[g] = h.inventory[g] || 0; });
          return row;
        });

        const GROUP_COLORS = {
          "O-":     "#c0392b",
          "O+":     "#27ae60",
          "A-":     "#e67e22",
          "A+":     "#2ecc71",
          "B-":     "#e74c3c",
          "B+":     "#1abc9c",
          "AB-":    "#ff6b6b",
          "AB+":    "#3d7eff",
          "Bombay": "#9b59b6",
        };

        return (
          <div className="card" style={{ marginTop: 8 }}>
            <h3>📊 Blood Stock by Hospital &amp; Blood Group</h3>
            <p style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--muted)", marginBottom: 16 }}>
              All blood groups across all hospitals — grouped by hospital
            </p>

            {/* Colour legend */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
              {BLOOD_GROUPS.map(g => (
                <span key={g} style={{
                  fontFamily: "var(--font-mono)", fontSize: 11, fontWeight: 700,
                  color: GROUP_COLORS[g],
                  background: GROUP_COLORS[g] + "22",
                  border: `1px solid ${GROUP_COLORS[g]}55`,
                  borderRadius: 6, padding: "2px 9px",
                }}>{g}</span>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={340}>
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: -10, bottom: 0 }}
                barCategoryGap="20%"
                barGap={2}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 11 }} />
                <YAxis tick={{ fill: "#888", fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#12121c", border: "1px solid #1e1e2e", borderRadius: 8, fontSize: 12 }}
                  formatter={(value, name) => [`${value} units`, name]}
                />
                <Legend
                  wrapperStyle={{ fontFamily: "var(--font-mono)", fontSize: 11, paddingTop: 12 }}
                />
                {BLOOD_GROUPS.map(g => (
                  <Bar key={g} dataKey={g} fill={GROUP_COLORS[g]} radius={[3, 3, 0, 0]} maxBarSize={18} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        );
      })()}
    </div>
  );
}



// ════════════════════════════════════════════════════════════════════════════
// CITY-WIDE BLOOD DEMAND & CAMP PLANNER
// ════════════════════════════════════════════════════════════════════════════

// ── Region colour palette ─────────────────────────────────────────────────
const REGION_COLORS = {
  "North Delhi":   { primary:"#3d7eff", dim:"rgba(61,126,255,.12)",  border:"#3d7eff44" },
  "South Delhi":   { primary:"#e67e22", dim:"rgba(230,126,34,.12)",  border:"#e67e2244" },
  "East Delhi":    { primary:"#27ae60", dim:"rgba(39,174,96,.12)",   border:"#27ae6044" },
  "West Delhi":    { primary:"#a855f7", dim:"rgba(168,85,247,.12)",  border:"#a855f744" },
  "Central Delhi": { primary:"#ff4466", dim:"rgba(255,68,102,.12)",  border:"#ff446644" },
  "New Delhi":     { primary:"#f0c040", dim:"rgba(240,192,64,.12)",  border:"#f0c04044" },
};
const REGION_LIST = Object.keys(REGION_COLORS);

// ── City → Region → Hospital Cluster dataset ─────────────────────────────
const CITY_DEMAND_DATA = [
  {
    region: "North Delhi",
    total_demand: 420, current_stock: 84, scarcity_index: 0.80,
    trend: "+12%",
    critical_groups: ["O-","AB-"],
    clusters: [
      { name:"Rohini Cluster",    hospitals:["Fortis Shalimar Bagh","ESIC Rohini","Batra Hospital"], demand:160 },
      { name:"Pitampura Cluster", hospitals:["Max Pitampura","Jaipur Golden Hospital"],              demand:140 },
      { name:"Model Town Cluster",hospitals:["Hindu Rao Hospital","St. Stephen's Hospital"],         demand:120 },
    ],
    historical_camps: [
      { location:"Rohini Sector 11 Ground",    date:"2025-11-10", units_collected:312 },
      { location:"GTBIT College Campus",       date:"2025-07-04", units_collected:258 },
      { location:"Pitampura Metro Station",    date:"2026-01-20", units_collected:195 },
    ],
  },
  {
    region: "South Delhi",
    total_demand: 385, current_stock: 54, scarcity_index: 0.86,
    trend: "+18%",
    critical_groups: ["O-","Bombay"],
    clusters: [
      { name:"Saket Cluster",         hospitals:["Max Saket","Fortis Saket","Holy Family"],       demand:175 },
      { name:"Hauz Khas Cluster",     hospitals:["AIIMS Delhi","Safdarjung Hospital"],             demand:135 },
      { name:"Greater Kailash Cluster",hospitals:["Moolchand Hospital","Fortis La Femme"],         demand:75  },
    ],
    historical_camps: [
      { location:"IIT Delhi Campus",          date:"2025-10-15", units_collected:410 },
      { location:"Select City Walk Mall",     date:"2025-06-28", units_collected:287 },
      { location:"Saket Court Complex",       date:"2026-02-08", units_collected:341 },
    ],
  },
  {
    region: "East Delhi",
    total_demand: 310, current_stock: 90, scarcity_index: 0.71,
    trend: "+6%",
    critical_groups: ["B-","AB-"],
    clusters: [
      { name:"Mayur Vihar Cluster", hospitals:["Apollo Cradle","Max Patparganj"],                  demand:130 },
      { name:"Shahdara Cluster",    hospitals:["GTB Hospital","Jag Pravesh Chandra Hospital"],      demand:110 },
      { name:"Preet Vihar Cluster", hospitals:["Shanti Mukand Hospital","Kailash Hospital"],        demand:70  },
    ],
    historical_camps: [
      { location:"Akshardham Complex Grounds", date:"2025-09-22", units_collected:389 },
      { location:"Mayur Vihar Phase 1 Park",   date:"2025-05-17", units_collected:222 },
      { location:"Delhi Public School Rohini", date:"2026-01-05", units_collected:178 },
    ],
  },
  {
    region: "West Delhi",
    total_demand: 295, current_stock: 78, scarcity_index: 0.74,
    trend: "+9%",
    critical_groups: ["A-","O-"],
    clusters: [
      { name:"Dwarka Cluster",       hospitals:["Venkateshwar Hospital","Manipal Dwarka"],          demand:145 },
      { name:"Janakpuri Cluster",    hospitals:["Mata Chanan Devi","DDU Hospital"],                 demand:95  },
      { name:"Rajouri Garden Cluster",hospitals:["Aakash Healthcare","Columbia Asia"],              demand:55  },
    ],
    historical_camps: [
      { location:"DLF Cyber City Gurugram",    date:"2025-08-30", units_collected:445 },
      { location:"Dwarka Sector 10 Stadium",   date:"2025-12-12", units_collected:302 },
      { location:"Janakpuri District Centre",  date:"2026-03-01", units_collected:261 },
    ],
  },
  {
    region: "Central Delhi",
    total_demand: 340, current_stock: 47, scarcity_index: 0.86,
    trend: "+22%",
    critical_groups: ["O-","O+","Bombay"],
    clusters: [
      { name:"Karol Bagh Cluster",   hospitals:["GB Pant Hospital","Hindu Rao"],                    demand:140 },
      { name:"Paharganj Cluster",    hospitals:["RML Hospital","Lok Nayak Hospital"],               demand:120 },
      { name:"Connaught Place Cluster",hospitals:["Ram Manohar Lohia","Lady Hardinge Medical"],     demand:80  },
    ],
    historical_camps: [
      { location:"Connaught Place Central Park", date:"2025-10-05", units_collected:520 },
      { location:"New Delhi Railway Station",    date:"2025-07-18", units_collected:398 },
      { location:"India Gate Lawns",             date:"2026-02-26", units_collected:475 },
    ],
  },
  {
    region: "New Delhi",
    total_demand: 260, current_stock: 68, scarcity_index: 0.74,
    trend: "+4%",
    critical_groups: ["AB-","B-"],
    clusters: [
      { name:"Diplomatic Enclave Cluster", hospitals:["AIIMS Trauma","Sir Ganga Ram"],             demand:110 },
      { name:"Lajpat Nagar Cluster",       hospitals:["Moolchand Medcity","Apollo Cradle"],         demand:90  },
      { name:"Vasant Kunj Cluster",        hospitals:["Fortis Vasant Kunj","Manipal Hospital"],     demand:60  },
    ],
    historical_camps: [
      { location:"JNU Campus",             date:"2025-09-10", units_collected:367 },
      { location:"Lajpat Nagar Market",    date:"2025-11-25", units_collected:214 },
      { location:"Nehru Place Tech Park",  date:"2026-01-30", units_collected:289 },
    ],
  },
];

// ── Suggested camp locations with partner institutes ──────────────────────
const CAMP_SUGGESTIONS = [
  {
    rank:1, region:"Central Delhi", location:"Connaught Place Central Park",
    probability:0.94, expected_units:480,
    reason:"Highest scarcity index (0.86) + peak footfall zone + prior camp yielded 520 units",
    institutes:[
      { name:"Shri Ram College of Commerce", type:"College",   lead:"Dr. Pooja Mehta",    phone:"+91-11-2766-0000", icon:"🎓" },
      { name:"HelpAge India HQ",             type:"NGO",       lead:"Mr. Sanjay Kapoor",  phone:"+91-11-4168-8955", icon:"🤝" },
      { name:"Ernst & Young LLP",            type:"Corporate", lead:"Ms. Nidhi Arora",    phone:"+91-11-6671-8000", icon:"🏢" },
      { name:"Scope Complex Corporate Hub",  type:"Corporate", lead:"Mr. Rajeev Nair",    phone:"+91-11-2436-7777", icon:"🏢" },
    ],
  },
  {
    rank:2, region:"South Delhi", location:"IIT Delhi Campus",
    probability:0.91, expected_units:420,
    reason:"2nd highest scarcity (0.86) + student population 8,000+ + historical yield 410 units",
    institutes:[
      { name:"IIT Delhi",                    type:"College",   lead:"Prof. Arvind Singh",  phone:"+91-11-2659-1000", icon:"🎓" },
      { name:"Jawaharlal Nehru University",  type:"College",   lead:"Prof. Leela Nair",    phone:"+91-11-2674-1000", icon:"🎓" },
      { name:"Blood Warriors Foundation",   type:"NGO",       lead:"Ms. Priya Sharma",    phone:"+91-98100-11111", icon:"🤝" },
      { name:"Infosys BPO Saket",           type:"Corporate", lead:"Mr. Ravi Kumar",      phone:"+91-11-4060-0000", icon:"🏢" },
    ],
  },
  {
    rank:3, region:"North Delhi", location:"GTBIT College Campus",
    probability:0.87, expected_units:310,
    reason:"Rising demand trend (+12%) + tech college pool + 258 units in last drive",
    institutes:[
      { name:"GTBIT (IP University)",        type:"College",   lead:"Dr. Suneel Garg",     phone:"+91-11-2703-7900", icon:"🎓" },
      { name:"NSIT Dwarka",                  type:"College",   lead:"Prof. Meena Tiwari",  phone:"+91-11-2505-7000", icon:"🎓" },
      { name:"Rotary Club North Delhi",      type:"NGO",       lead:"Mr. Harish Khanna",   phone:"+91-98110-22222", icon:"🤝" },
      { name:"Genpact Gurugram Campus",      type:"Corporate", lead:"Ms. Tanvi Bhatt",     phone:"+91-124-402-1000", icon:"🏢" },
    ],
  },
  {
    rank:4, region:"West Delhi", location:"DLF Cyber City Gurugram",
    probability:0.83, expected_units:370,
    reason:"Corporate density highest in NCR + 445 units collected + accessible to West cluster",
    institutes:[
      { name:"Amity University Noida",       type:"College",   lead:"Dr. Raj Malhotra",   phone:"+91-120-432-2000", icon:"🎓" },
      { name:"Give India Foundation",        type:"NGO",       lead:"Ms. Sunita Rao",     phone:"+91-22-6189-6363", icon:"🤝" },
      { name:"Wipro Technologies DLF",       type:"Corporate", lead:"Mr. Anand Verma",    phone:"+91-80-2844-0011", icon:"🏢" },
      { name:"Accenture Cyber City",         type:"Corporate", lead:"Ms. Kavya Nambiar",  phone:"+91-124-666-0000", icon:"🏢" },
    ],
  },
  {
    rank:5, region:"East Delhi", location:"Akshardham Complex Grounds",
    probability:0.79, expected_units:280,
    reason:"Religious gathering hub + 389 units historical yield + high footfall weekends",
    institutes:[
      { name:"Delhi Public School East",     type:"College",   lead:"Ms. Geeta Sharma",   phone:"+91-11-2271-0000", icon:"🎓" },
      { name:"Iskcon Delhi",                 type:"NGO",       lead:"Swami Radheshyam",   phone:"+91-11-2623-5133", icon:"🤝" },
      { name:"TCS Noida Office",             type:"Corporate", lead:"Mr. Vivek Tiwari",   phone:"+91-120-678-0000", icon:"🏢" },
      { name:"HCL Technologies Noida",       type:"Corporate", lead:"Ms. Deepika Joshi",  phone:"+91-120-590-0000", icon:"🏢" },
    ],
  },
  {
    rank:6, region:"New Delhi",  location:"JNU Campus",
    probability:0.75, expected_units:260,
    reason:"University population 15,000+ + awareness campaigns effective + 367 units yield",
    institutes:[
      { name:"Jawaharlal Nehru University",  type:"College",   lead:"Prof. Amit Dey",     phone:"+91-11-2674-1111", icon:"🎓" },
      { name:"Delhi University North Campus",type:"College",   lead:"Dr. Swati Gupta",    phone:"+91-11-2766-7000", icon:"🎓" },
      { name:"Doctors For You",              type:"NGO",       lead:"Dr. Ravi Kant",      phone:"+91-22-2772-7272", icon:"🤝" },
      { name:"IBM India Pvt Ltd",            type:"Corporate", lead:"Mr. Saurabh Singh",  phone:"+91-80-4184-0000", icon:"🏢" },
    ],
  },
];

// ── /predict-camp-location logic (frontend simulation) ───────────────────
function predictCampLocations(demandData) {
  return [...demandData]
    .sort((a,b) => (b.scarcity_index * b.total_demand) - (a.scarcity_index * a.total_demand))
    .map((region, i) => ({
      rank: i + 1,
      region: region.region,
      scarcity_score: (region.scarcity_index * 100).toFixed(0),
      demand_units: region.total_demand,
      recommended_location: CAMP_SUGGESTIONS.find(s => s.region === region.region)?.location || "TBD",
      probability: CAMP_SUGGESTIONS.find(s => s.region === region.region)?.probability || 0.5,
    }));
}

// ── Custom Pie tooltip ────────────────────────────────────────────────────
function CPPieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const col = REGION_COLORS[d.region];
  return (
    <div className="cp-tooltip-custom">
      <div style={{ color: col.primary, fontWeight:700, marginBottom:4 }}>{d.region}</div>
      <div style={{ color:"#d4d4d8" }}>Demand: <strong>{d.total_demand}</strong> units</div>
      <div style={{ color:"#d4d4d8" }}>Scarcity: <strong style={{ color: d.scarcity_index > 0.8 ? "#ff4466":"#e67e22" }}>{(d.scarcity_index*100).toFixed(0)}%</strong></div>
      <div style={{ color:"#d4d4d8" }}>Trend: <strong style={{ color:"#27ae60" }}>{d.trend}</strong></div>
    </div>
  );
}

// ── Active Pie sector renderer ────────────────────────────────────────────
function renderActiveShape(props) {
  const { cx,cy,innerRadius,outerRadius,startAngle,endAngle,fill,payload,percent,value } = props;
  return (
    <g>
      <text x={cx} y={cy-14} textAnchor="middle" fill="#fff" fontSize={15} fontWeight={800}>
        {payload.region.replace(" Delhi","")}
      </text>
      <text x={cx} y={cy+8} textAnchor="middle" fill={fill} fontSize={22} fontWeight={800}>
        {value}u
      </text>
      <text x={cx} y={cy+28} textAnchor="middle" fill="#666" fontSize={11}>
        {(percent*100).toFixed(1)}% of demand
      </text>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius+8}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius+12} outerRadius={outerRadius+16}
        startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
}

// ── Camp Card ─────────────────────────────────────────────────────────────
function CampCard({ camp, regionData, defaultOpen }) {
  const [open, setOpen] = React.useState(defaultOpen || false);
  const col = REGION_COLORS[camp.region];
  const rd  = regionData.find(r => r.region === camp.region);
  const probPct = Math.round(camp.probability * 100);

  return (
    <div className="cp-camp-card">
      {/* Card header */}
      <div style={{ padding:"14px 18px", cursor:"pointer",
        background:`linear-gradient(90deg,${col.dim},transparent)`,
        borderBottom: open ? "1px solid #1e2a3e" : "none" }}
        onClick={() => setOpen(x=>!x)}>
        <div style={{ display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          {/* Rank badge */}
          <div className="cp-rank-badge"
            style={{ background:col.dim, border:`2px solid ${col.primary}`,
              color:col.primary }}>
            #{camp.rank}
          </div>
          {/* Location + region */}
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:800, fontSize:14, color:"#fff" }}>{camp.location}</div>
            <div style={{ display:"flex", gap:8, marginTop:4, flexWrap:"wrap" }}>
              <span style={{ fontFamily:"var(--font-mono)", fontSize:10,
                color:col.primary, background:col.dim,
                border:`1px solid ${col.border}`, borderRadius:4,
                padding:"1px 8px" }}>{camp.region}</span>
              {rd && rd.critical_groups.map(g => (
                <span key={g} className="badge badge-red"
                  style={{ fontSize:10, padding:"1px 7px" }}>{g}</span>
              ))}
            </div>
          </div>
          {/* Probability */}
          <div style={{ textAlign:"right", minWidth:90 }}>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:20,
              fontWeight:800, color: probPct>=90?"#27ae60":probPct>=80?"#e67e22":"#3d7eff" }}>
              {probPct}%
            </div>
            <div style={{ fontSize:10, color:"#555", textTransform:"uppercase" }}>
              Donation Prob.
            </div>
            <div className="cp-prob-bar-track" style={{ width:90 }}>
              <div className="cp-prob-bar-fill"
                style={{ width:`${probPct}%`,
                  background:`linear-gradient(90deg,${col.primary},${col.primary}aa)` }} />
            </div>
          </div>
          {/* Expected units */}
          <div style={{ textAlign:"right", minWidth:80 }}>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:18, fontWeight:800,
              color:"#fff" }}>{camp.expected_units}</div>
            <div style={{ fontSize:10, color:"#555", textTransform:"uppercase" }}>Exp. Units</div>
          </div>
          <span style={{ color:"#444", fontSize:14 }}>{open?"▲":"▼"}</span>
        </div>
        {/* Reason */}
        <div style={{ marginTop:10, fontFamily:"var(--font-mono)", fontSize:11,
          color:"#555", paddingLeft:40, lineHeight:1.6 }}>
          💡 {camp.reason}
        </div>
      </div>

      {/* Expanded: partner institutes */}
      {open && (
        <div style={{ padding:"14px 18px" }}>
          <div style={{ fontSize:11, color:"#555", fontWeight:700, letterSpacing:.5,
            textTransform:"uppercase", marginBottom:10, fontFamily:"var(--font-mono)" }}>
            Partner Institutes for Outreach
          </div>
          {camp.institutes.map((inst, i) => (
            <div key={i} className="cp-institute-row">
              <div className="cp-inst-icon"
                style={{ background: inst.type==="College"?"rgba(61,126,255,.12)":
                  inst.type==="NGO"?"rgba(39,174,96,.12)":"rgba(230,126,34,.12)",
                  border: inst.type==="College"?"1px solid #3d7eff33":
                  inst.type==="NGO"?"1px solid #27ae6033":"1px solid #e67e2233" }}>
                {inst.icon}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, color:"#d4d4d8", fontSize:13 }}>{inst.name}</div>
                <div style={{ display:"flex", gap:10, marginTop:2, flexWrap:"wrap" }}>
                  <span style={{ color: inst.type==="College"?"#3d7eff":
                    inst.type==="NGO"?"#27ae60":"#e67e22",
                    fontSize:10, fontWeight:700, textTransform:"uppercase" }}>
                    {inst.type}
                  </span>
                  <span style={{ color:"#555", fontSize:11, fontFamily:"var(--font-mono)" }}>
                    Lead: <span style={{ color:"#888" }}>{inst.lead}</span>
                  </span>
                </div>
              </div>
              <div style={{ textAlign:"right" }}>
                <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"#555" }}>
                  {inst.phone}
                </div>
                <button onClick={() => alert(`Calling ${inst.lead} at ${inst.phone}`)}
                  style={{ marginTop:4, padding:"4px 10px", borderRadius:6,
                    border:"1px solid #27ae6033", background:"rgba(39,174,96,.08)",
                    color:"#27ae60", fontSize:11, cursor:"pointer",
                    fontFamily:"var(--font)" }}>
                  📞 Contact
                </button>
              </div>
            </div>
          ))}

          {/* Historical performance */}
          {rd && (
            <div style={{ marginTop:14, padding:"12px 14px", borderRadius:8,
              background:"#0f1420", border:"1px solid #1e2a3e" }}>
              <div style={{ fontSize:10, color:"#555", fontWeight:700, letterSpacing:.5,
                textTransform:"uppercase", marginBottom:8, fontFamily:"var(--font-mono)" }}>
                Historical Camp Performance — {camp.region}
              </div>
              {rd.historical_camps.map((hc, i) => (
                <div key={i} style={{ display:"flex", justifyContent:"space-between",
                  alignItems:"center", padding:"5px 0",
                  borderBottom: i<rd.historical_camps.length-1 ? "1px solid #181e2e":"none",
                  fontSize:12 }}>
                  <div>
                    <span style={{ color:"#888" }}>📍 {hc.location}</span>
                    <span style={{ fontFamily:"var(--font-mono)", fontSize:10,
                      color:"#444", marginLeft:10 }}>{hc.date}</span>
                  </div>
                  <span style={{ fontFamily:"var(--font-mono)", fontWeight:700,
                    color: col.primary }}>{hc.units_collected} units</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Strategy Table Row ────────────────────────────────────────────────────
function StrategyRow({ row, regionData, isHeader }) {
  if (isHeader) return (
    <div className="cp-strategy-header">
      {["Region","Need","Scarcity","Top Institute","Prob."].map(h => (
        <div key={h} style={{ fontSize:10, fontWeight:700, color:"#555",
          textTransform:"uppercase", letterSpacing:.5,
          fontFamily:"var(--font-mono)" }}>{h}</div>
      ))}
    </div>
  );
  const col = REGION_COLORS[row.region];
  const rd  = regionData.find(r => r.region === row.region);
  const camp = CAMP_SUGGESTIONS.find(s => s.region === row.region);
  const top  = camp?.institutes[0];
  const probPct = Math.round((row.probability||0)*100);
  return (
    <div className="cp-strategy-row">
      <div>
        <span style={{ fontFamily:"var(--font-mono)", fontWeight:700,
          fontSize:12, color:col.primary }}>{row.region}</span>
        {rd && <div style={{ fontSize:10, color:"#555", marginTop:2 }}>{rd.trend} trend</div>}
      </div>
      <div style={{ fontFamily:"var(--font-mono)", fontSize:13, fontWeight:700, color:"#fff" }}>
        {rd?.total_demand || 0}u
        <div style={{ fontSize:10, color:"#555", fontWeight:400 }}>stock: {rd?.current_stock}u</div>
      </div>
      <div>
        {top ? (
          <>
            <div style={{ fontSize:12, color:"#d4d4d8", fontWeight:600 }}>{top.name}</div>
            <div style={{ fontSize:10, color:"#555", fontFamily:"var(--font-mono)",
              marginTop:2 }}>{top.lead}</div>
          </>
        ) : <span style={{ color:"#444" }}>—</span>}
      </div>
      <div>
        <div style={{ display:"flex", alignItems:"center", gap:6 }}>
          <span style={{ fontFamily:"var(--font-mono)", fontSize:13, fontWeight:700,
            color: parseInt(row.scarcity_score)>=85 ? "#ff4466":
                   parseInt(row.scarcity_score)>=75 ? "#e67e22":"#27ae60" }}>
            {row.scarcity_score}%
          </span>
        </div>
        <div className="cp-prob-bar-track" style={{ width:80, marginTop:4 }}>
          <div className="cp-prob-bar-fill"
            style={{ width:`${row.scarcity_score}%`,
              background: parseInt(row.scarcity_score)>=85 ? "#ff4466":
                          parseInt(row.scarcity_score)>=75 ? "#e67e22":"#27ae60" }} />
        </div>
      </div>
      <div>
        <span style={{ fontFamily:"var(--font-mono)", fontWeight:800, fontSize:14,
          color: probPct>=90?"#27ae60":probPct>=80?"#e67e22":"#3d7eff" }}>
          {probPct}%
        </span>
        <div style={{ fontSize:10, color:"#555" }}>volume prob.</div>
      </div>
    </div>
  );
}

// ── Main CampPlanner view ─────────────────────────────────────────────────
function CampPlanner() {
  const [activeRegion, setActiveRegion]   = React.useState(null);      // pie hover
  const [activePieIdx, setActivePieIdx]   = React.useState(0);
  const [filterRegion, setFilterRegion]   = React.useState("all");
  const [simulating,   setSimulating]     = React.useState(false);
  const [simResult,    setSimResult]      = React.useState(null);
  const [view,         setView]           = React.useState("camps");    // camps | table | hierarchy

  const pieData = CITY_DEMAND_DATA.map(r => ({
    region: r.region, value: r.total_demand,
    fill: REGION_COLORS[r.region].primary,
    scarcity_index: r.scarcity_index, trend: r.trend,
  }));

  const totalDemand   = CITY_DEMAND_DATA.reduce((s,r) => s+r.total_demand, 0);
  const totalStock    = CITY_DEMAND_DATA.reduce((s,r) => s+r.current_stock, 0);
  const criticalCount = CITY_DEMAND_DATA.filter(r => r.scarcity_index >= 0.83).length;

  const rankedCamps = predictCampLocations(CITY_DEMAND_DATA);
  const filteredCamps = filterRegion === "all"
    ? CAMP_SUGGESTIONS
    : CAMP_SUGGESTIONS.filter(c => c.region === filterRegion);

  const runSimulation = async () => {
    setSimulating(true);
    await new Promise(r => setTimeout(r, 1200));
    setSimResult(rankedCamps);
    setSimulating(false);
  };

  return (
    <div className="slide-in">

      {/* ── Header ── */}
      <div className="cp-header">
        <div style={{ display:"flex", justifyContent:"space-between",
          alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"#3d7eff",
              letterSpacing:2, marginBottom:6 }}>🗺 STRATEGIC ANALYTICS</div>
            <div className="cp-title">City-Wide Blood Demand &amp; Camp Planner</div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"#555",
              marginTop:6, lineHeight:1.7 }}>
              Regional demand analysis · Predictive camp suggestions · Institutional partnerships
            </div>
          </div>
          <button className="cp-sim-btn" onClick={runSimulation} disabled={simulating}>
            {simulating ? <><span>⚙</span> Running Model…</> : <><span>🔮</span> Run Prediction Model</>}
          </button>
        </div>

        {/* ── City-level KPIs ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(6,1fr)", gap:10, marginTop:20 }}>
          {[
            { val:totalDemand,          lbl:"Total City Demand",  col:"#fff",     unit:"units" },
            { val:totalStock,           lbl:"Network Stock",      col:"#27ae60",  unit:"units" },
            { val:`${Math.round((1-totalStock/totalDemand)*100)}%`, lbl:"Scarcity Rate", col:"#ff4466", unit:"" },
            { val:criticalCount,        lbl:"Critical Regions",   col:"#e67e22",  unit:"/ 6"  },
            { val:CAMP_SUGGESTIONS.length, lbl:"Camp Sites Ready",col:"#3d7eff",  unit:""     },
            { val:CAMP_SUGGESTIONS.reduce((s,c)=>s+c.institutes.length,0),
                                         lbl:"Partner Institutes",col:"#a855f7",  unit:""     },
          ].map(k => (
            <div key={k.lbl} style={{ textAlign:"center", padding:"10px 6px",
              borderRadius:8, background:"rgba(255,255,255,.03)",
              border:"1px solid rgba(255,255,255,.06)" }}>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:19,
                fontWeight:800, color:k.col }}>
                {k.val}<span style={{ fontSize:11, color:"#444" }}>{k.unit}</span>
              </div>
              <div style={{ fontSize:10, color:"#555", marginTop:2,
                textTransform:"uppercase", letterSpacing:.4 }}>{k.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Simulation Result Banner ── */}
      {simResult && (
        <div style={{ background:"rgba(39,174,96,.08)", border:"1px solid #27ae6033",
          borderRadius:10, padding:"12px 18px", marginBottom:16,
          display:"flex", alignItems:"center", gap:12, flexWrap:"wrap" }}>
          <span style={{ fontSize:20 }}>✅</span>
          <div style={{ flex:1 }}>
            <div style={{ fontWeight:700, color:"#27ae60", fontSize:13 }}>
              /predict-camp-location — Model Complete
            </div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"#555", marginTop:2 }}>
              Top recommendation: <strong style={{ color:"#fff" }}>{simResult[0]?.recommended_location}</strong>
              {" "}· Score: {simResult[0]?.scarcity_score}% scarcity · {CAMP_SUGGESTIONS[0]?.probability*100}% donation probability
            </div>
          </div>
          <button onClick={() => setSimResult(null)}
            style={{ background:"transparent", border:"none",
              color:"#555", cursor:"pointer", fontSize:14 }}>✕</button>
        </div>
      )}

      {/* ── Main layout: Pie + View ── */}
      <div style={{ display:"grid", gridTemplateColumns:"340px 1fr",
        gap:16, marginBottom:20 }}>

        {/* Pie chart card */}
        <div className="card" style={{ padding:0, overflow:"hidden" }}>
          <div style={{ padding:"14px 18px 0", borderBottom:"1px solid var(--border)" }}>
            <div style={{ fontWeight:700, fontSize:13, color:"#fff", marginBottom:2 }}>
              🩸 Demand by Region
            </div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"#555",
              paddingBottom:12 }}>
              Total: {totalDemand} units city-wide
            </div>
          </div>
          <div style={{ padding:"10px 0" }}>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%" cy="50%"
                  innerRadius={72} outerRadius={110}
                  dataKey="value"
                  nameKey="region"
                  activeIndex={activePieIdx}
                  activeShape={renderActiveShape}
                  onMouseEnter={(_, i) => setActivePieIdx(i)}
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill}
                      stroke={entry.fill} strokeWidth={activePieIdx===i?2:0} />
                  ))}
                </Pie>
                <Tooltip content={<CPPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Region legend */}
          <div style={{ padding:"0 16px 16px", display:"flex",
            flexDirection:"column", gap:6 }}>
            {CITY_DEMAND_DATA.map((r, i) => {
              const col = REGION_COLORS[r.region];
              return (
                <div key={r.region}
                  style={{ display:"flex", alignItems:"center", gap:8,
                    padding:"5px 8px", borderRadius:7, cursor:"pointer",
                    background: activePieIdx===i ? col.dim : "transparent",
                    border: activePieIdx===i ? `1px solid ${col.border}` : "1px solid transparent",
                    transition:"all .18s" }}
                  onMouseEnter={() => setActivePieIdx(i)}>
                  <div style={{ width:10, height:10, borderRadius:"50%",
                    background:col.primary, flexShrink:0 }} />
                  <span style={{ flex:1, fontSize:12, color:"#d4d4d8" }}>{r.region}</span>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:11,
                    color:col.primary, fontWeight:700 }}>{r.total_demand}u</span>
                  <span style={{ fontFamily:"var(--font-mono)", fontSize:10,
                    color: r.scarcity_index>=0.83?"#ff4466":"#e67e22" }}>
                    {(r.scarcity_index*100).toFixed(0)}% scarce
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right panel */}
        <div>
          {/* View toggle */}
          <div style={{ display:"flex", gap:8, marginBottom:14, flexWrap:"wrap" }}>
            {[
              { key:"camps",     label:"🏕 Camp Suggestions" },
              { key:"table",     label:"📊 Strategy Table"   },
              { key:"hierarchy", label:"🏙 City Hierarchy"   },
            ].map(v => (
              <button key={v.key}
                onClick={() => setView(v.key)}
                style={{ padding:"7px 16px", borderRadius:8,
                  border: view===v.key ? "1px solid #3d7eff" : "1px solid #1e2a3e",
                  background: view===v.key ? "rgba(61,126,255,.12)" : "transparent",
                  color: view===v.key ? "#3d7eff" : "#555",
                  fontFamily:"var(--font)", fontWeight:700, fontSize:12,
                  cursor:"pointer", transition:"all .16s" }}>
                {v.label}
              </button>
            ))}
            {/* Region filter */}
            <div style={{ marginLeft:"auto", display:"flex", gap:6, flexWrap:"wrap" }}>
              <button className="cp-region-pill"
                style={{ background: filterRegion==="all"?"rgba(255,255,255,.08)":"transparent",
                  border: filterRegion==="all"?"1px solid #ffffff44":"1px solid #1e2a3e",
                  color: filterRegion==="all"?"#fff":"#555" }}
                onClick={() => setFilterRegion("all")}>All</button>
              {REGION_LIST.map(r => {
                const col = REGION_COLORS[r];
                const active = filterRegion === r;
                return (
                  <button key={r} className="cp-region-pill"
                    style={{ background: active ? col.dim : "transparent",
                      border: active ? `1px solid ${col.primary}` : "1px solid #1e2a3e",
                      color: active ? col.primary : "#555" }}
                    onClick={() => setFilterRegion(active ? "all" : r)}>
                    {r.replace(" Delhi","").replace("New ","New ")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ── CAMPS VIEW ── */}
          {view === "camps" && (
            <div style={{ maxHeight:520, overflowY:"auto",
              paddingRight:4, scrollbarWidth:"thin" }}>
              {filteredCamps.map((camp, i) => (
                <CampCard key={camp.rank} camp={camp}
                  regionData={CITY_DEMAND_DATA}
                  defaultOpen={i===0} />
              ))}
            </div>
          )}

          {/* ── TABLE VIEW ── */}
          {view === "table" && (
            <div className="card" style={{ padding:0, overflow:"hidden" }}>
              <StrategyRow isHeader />
              {rankedCamps.map((row, i) => (
                <StrategyRow key={i} row={row} regionData={CITY_DEMAND_DATA} />
              ))}
            </div>
          )}

          {/* ── HIERARCHY VIEW ── */}
          {view === "hierarchy" && (
            <div style={{ maxHeight:520, overflowY:"auto",
              paddingRight:4, scrollbarWidth:"thin" }}>
              {CITY_DEMAND_DATA
                .filter(r => filterRegion==="all" || r.region===filterRegion)
                .map(region => {
                  const col = REGION_COLORS[region.region];
                  return (
                    <div key={region.region} className="card"
                      style={{ marginBottom:12, padding:0, overflow:"hidden",
                        borderColor: col.border }}>
                      {/* Region header */}
                      <div style={{ padding:"12px 16px",
                        background:`linear-gradient(90deg,${col.dim},transparent)`,
                        borderBottom:"1px solid #1e2a3e",
                        display:"flex", alignItems:"center",
                        justifyContent:"space-between" }}>
                        <div>
                          <span style={{ fontWeight:800, color:col.primary,
                            fontSize:14 }}>🏙 {region.region}</span>
                          <div style={{ display:"flex", gap:8, marginTop:4 }}>
                            <span className="badge"
                              style={{ background:col.dim, color:col.primary,
                                border:`1px solid ${col.border}`, fontSize:10 }}>
                              {region.total_demand}u demand
                            </span>
                            <span className="badge badge-orange" style={{ fontSize:10 }}>
                              {region.trend}
                            </span>
                            {region.critical_groups.map(g =>
                              <span key={g} className="badge badge-red"
                                style={{ fontSize:10 }}>{g}</span>)}
                          </div>
                        </div>
                        <div style={{ textAlign:"right" }}>
                          <div style={{ fontFamily:"var(--font-mono)", fontSize:18,
                            fontWeight:800,
                            color: region.scarcity_index>=0.83?"#ff4466":"#e67e22" }}>
                            {(region.scarcity_index*100).toFixed(0)}%
                          </div>
                          <div style={{ fontSize:10, color:"#555" }}>scarcity</div>
                        </div>
                      </div>
                      {/* Clusters */}
                      <div style={{ padding:"10px 16px 14px" }}>
                        {region.clusters.map((cl, ci) => (
                          <div key={ci} style={{ marginBottom:10,
                            padding:"10px 12px", borderRadius:8,
                            background:"#0f1420", border:"1px solid #1a2030" }}>
                            <div style={{ fontWeight:700, color:"#d4d4d8",
                              fontSize:13, marginBottom:6 }}>
                              🏥 {cl.name}
                              <span style={{ fontFamily:"var(--font-mono)",
                                fontSize:11, color:col.primary,
                                marginLeft:10 }}>{cl.demand}u</span>
                            </div>
                            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                              {cl.hospitals.map(h => (
                                <span key={h} style={{ fontSize:11, color:"#555",
                                  background:"#161b28",
                                  border:"1px solid #1e2a3e",
                                  borderRadius:6, padding:"2px 8px",
                                  fontFamily:"var(--font-mono)" }}>{h}</span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* ── Backend endpoint hint ── */}
      <div style={{ background:"rgba(61,126,255,.05)", border:"1px solid #3d7eff22",
        borderRadius:10, padding:"14px 18px" }}>
        <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"#3d7eff",
          fontWeight:700, marginBottom:6 }}>
          📡 Backend Endpoint: POST /predict-camp-location
        </div>
        <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"#444",
          lineHeight:1.9 }}>
          {"// Request:  { blood_group?, region?, top_n: 3 }"}<br/>
          {"// Response: [ { rank, region, location, probability, expected_units, institutes[] } ]"}<br/>
          {"// Algorithm: score = scarcity_index × total_demand × historical_yield_weight"}<br/>
          {"// Sort by score DESC → return top_n suggestions with partner institute data"}
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// CODE RARE MODULE  —  Emergency Rare-Blood Donor Registry
// ════════════════════════════════════════════════════════════════════════════

// ── Blood-group colour palette ────────────────────────────────────────────
const CR_COLORS = {
  "Bombay": { primary:"#dc267f", dim:"rgba(220,38,127,.12)", border:"#dc267f44", cls:"cr-group-bombay" },
  "AB-":    { primary:"#a855f7", dim:"rgba(168,85,247,.12)",  border:"#a855f744", cls:"cr-group-ab-neg" },
  "O-":     { primary:"#ff4466", dim:"rgba(255,68,102,.12)",  border:"#ff446644", cls:"cr-group-o-neg"  },
};

// ── 25 mock donors ─────────────────────────────────────────────────────────
const CODE_RARE_DONORS = [
  {
    id:"CR-001", name:"Meera Iyer",       blood_group:"Bombay", verified:true,
    phone:"+91-98101-11201", email:"meera.iyer@gmail.com",
    address:"14-B, Lajpat Nagar II, New Delhi 110024",
    work_address:"Fortis La Femme, Greater Kailash, Delhi",
    last_donation: "2025-10-12",
    history:[
      { hospital:"AIIMS Delhi",         date:"2025-10-12", time:"09:30", month:"October",   year:2025 },
      { hospital:"Safdarjung Hospital", date:"2025-04-03", time:"11:00", month:"April",     year:2025 },
      { hospital:"RML Hospital",        date:"2024-09-20", time:"14:15", month:"September", year:2024 },
    ],
  },
  {
    id:"CR-002", name:"Aryan Kapoor",     blood_group:"Bombay", verified:true,
    phone:"+91-98101-22302", email:"aryan.kapoor@outlook.com",
    address:"7, Vasant Vihar, New Delhi 110057",
    work_address:"Max Super Specialty, Saket, Delhi",
    last_donation: "2025-08-05",
    history:[
      { hospital:"Apollo Sarita Vihar", date:"2025-08-05", time:"10:45", month:"August",   year:2025 },
      { hospital:"AIIMS Delhi",         date:"2024-12-18", time:"09:00", month:"December", year:2024 },
    ],
  },
  {
    id:"CR-003", name:"Sunita Rao",       blood_group:"Bombay", verified:true,
    phone:"+91-98101-33403", email:"sunita.rao@yahoo.com",
    address:"32-A, Defence Colony, New Delhi 110024",
    work_address:"BLK Super Speciality, Pusa Road, Delhi",
    last_donation: "2026-01-14",
    history:[
      { hospital:"BLK Super Speciality", date:"2026-01-14", time:"08:30", month:"January",  year:2026 },
      { hospital:"Safdarjung Hospital",  date:"2025-06-22", time:"11:30", month:"June",     year:2025 },
      { hospital:"RML Hospital",         date:"2024-11-08", time:"16:00", month:"November", year:2024 },
    ],
  },
  {
    id:"CR-004", name:"Kiran Nair",       blood_group:"Bombay", verified:true,
    phone:"+91-98101-44504", email:"kiran.nair@gmail.com",
    address:"5, Hauz Khas Enclave, New Delhi 110016",
    work_address:"Sir Ganga Ram Hospital, Rajinder Nagar, Delhi",
    last_donation: "2025-11-30",
    history:[
      { hospital:"Sir Ganga Ram Hospital", date:"2025-11-30", time:"10:00", month:"November", year:2025 },
      { hospital:"AIIMS Delhi",            date:"2025-05-10", time:"09:15", month:"May",      year:2025 },
    ],
  },
  {
    id:"CR-005", name:"Divya Menon",      blood_group:"Bombay", verified:false,
    phone:"+91-98101-55605", email:"divya.menon@gmail.com",
    address:"Flat 4C, Paschim Vihar, New Delhi 110063",
    work_address:"Venkateshwar Hospital, Dwarka, Delhi",
    last_donation: "2025-09-01",
    history:[
      { hospital:"Venkateshwar Hospital", date:"2025-09-01", time:"13:00", month:"September", year:2025 },
      { hospital:"Apollo Sarita Vihar",   date:"2024-10-15", time:"11:45", month:"October",   year:2024 },
    ],
  },
  {
    id:"CR-006", name:"Rohan Pillai",     blood_group:"Bombay", verified:true,
    phone:"+91-98101-66706", email:"rohan.pillai@hotmail.com",
    address:"22, Rohini Sector 11, New Delhi 110085",
    work_address:"Fortis Hospital, Shalimar Bagh, Delhi",
    last_donation: "2025-07-20",
    history:[
      { hospital:"Fortis Shalimar Bagh",  date:"2025-07-20", time:"08:00", month:"July",     year:2025 },
      { hospital:"AIIMS Delhi",           date:"2024-12-02", time:"10:30", month:"December", year:2024 },
      { hospital:"Safdarjung Hospital",   date:"2024-06-18", time:"15:00", month:"June",     year:2024 },
    ],
  },
  {
    id:"CR-007", name:"Pooja Krishnan",   blood_group:"Bombay", verified:true,
    phone:"+91-98101-77807", email:"pooja.krishnan@gmail.com",
    address:"18-B, Saket, New Delhi 110017",
    work_address:"Max Hospital, Saket, Delhi",
    last_donation: "2026-02-28",
    history:[
      { hospital:"Max Hospital Saket",    date:"2026-02-28", time:"09:45", month:"February",  year:2026 },
      { hospital:"RML Hospital",          date:"2025-08-14", time:"11:00", month:"August",    year:2025 },
    ],
  },
  {
    id:"CR-008", name:"Vikram Sharma",    blood_group:"Bombay", verified:true,
    phone:"+91-98101-88908", email:"vikram.sharma@gmail.com",
    address:"9, Pitampura, New Delhi 110034",
    work_address:"Fortis Memorial, Gurugram",
    last_donation: "2025-12-05",
    history:[
      { hospital:"Fortis Memorial Gurgaon", date:"2025-12-05", time:"07:30", month:"December",  year:2025 },
      { hospital:"AIIMS Delhi",             date:"2025-05-28", time:"10:00", month:"May",       year:2025 },
      { hospital:"Safdarjung Hospital",     date:"2024-11-22", time:"14:30", month:"November",  year:2024 },
    ],
  },
  {
    id:"CR-009", name:"Anjali Desai",     blood_group:"AB-",    verified:true,
    phone:"+91-98101-99009", email:"anjali.desai@gmail.com",
    address:"3, Janakpuri Block C, New Delhi 110058",
    work_address:"Deen Dayal Upadhyay Hospital, Hari Nagar, Delhi",
    last_donation: "2025-10-30",
    history:[
      { hospital:"DDU Hospital Delhi",    date:"2025-10-30", time:"09:00", month:"October",   year:2025 },
      { hospital:"Apollo Sarita Vihar",   date:"2025-03-11", time:"11:00", month:"March",     year:2025 },
      { hospital:"AIIMS Delhi",           date:"2024-08-05", time:"16:30", month:"August",    year:2024 },
    ],
  },
  {
    id:"CR-010", name:"Suresh Bhat",      blood_group:"AB-",    verified:true,
    phone:"+91-98101-10110", email:"suresh.bhat@yahoo.com",
    address:"45-C, Mayur Vihar Phase 1, New Delhi 110091",
    work_address:"Indraprastha Apollo Hospital, Sarita Vihar",
    last_donation: "2026-01-09",
    history:[
      { hospital:"Apollo Sarita Vihar",   date:"2026-01-09", time:"08:45", month:"January",   year:2026 },
      { hospital:"RML Hospital",          date:"2025-06-30", time:"10:15", month:"June",      year:2025 },
    ],
  },
  {
    id:"CR-011", name:"Lakshmi Reddy",    blood_group:"AB-",    verified:true,
    phone:"+91-98101-21211", email:"lakshmi.reddy@gmail.com",
    address:"7, Preet Vihar, New Delhi 110092",
    work_address:"Moolchand Hospital, Lajpat Nagar, Delhi",
    last_donation: "2025-09-14",
    history:[
      { hospital:"Moolchand Hospital",    date:"2025-09-14", time:"12:00", month:"September", year:2025 },
      { hospital:"Safdarjung Hospital",   date:"2025-01-22", time:"09:30", month:"January",   year:2025 },
      { hospital:"AIIMS Delhi",           date:"2024-07-10", time:"14:00", month:"July",      year:2024 },
    ],
  },
  {
    id:"CR-012", name:"Ramesh Pandey",    blood_group:"AB-",    verified:false,
    phone:"+91-98101-32312", email:"ramesh.pandey@hotmail.com",
    address:"12, Dwarka Sector 6, New Delhi 110075",
    work_address:"Venkateshwar Hospital, Dwarka, Delhi",
    last_donation: "2025-07-04",
    history:[
      { hospital:"Venkateshwar Hospital", date:"2025-07-04", time:"10:30", month:"July",      year:2025 },
      { hospital:"RML Hospital",          date:"2024-12-28", time:"08:30", month:"December",  year:2024 },
    ],
  },
  {
    id:"CR-013", name:"Nisha Agarwal",    blood_group:"AB-",    verified:true,
    phone:"+91-98101-43413", email:"nisha.agarwal@gmail.com",
    address:"6, Uttam Nagar, New Delhi 110059",
    work_address:"ESIC Hospital, Rohini, Delhi",
    last_donation: "2025-11-17",
    history:[
      { hospital:"ESIC Hospital Rohini",  date:"2025-11-17", time:"09:15", month:"November",  year:2025 },
      { hospital:"AIIMS Delhi",           date:"2025-04-29", time:"11:45", month:"April",     year:2025 },
      { hospital:"Safdarjung Hospital",   date:"2024-10-03", time:"15:00", month:"October",   year:2024 },
    ],
  },
  {
    id:"CR-014", name:"Anil Kumar",       blood_group:"AB-",    verified:true,
    phone:"+91-98101-54514", email:"anil.kumar@gmail.com",
    address:"28, Karol Bagh, New Delhi 110005",
    work_address:"GB Pant Hospital, Delhi",
    last_donation: "2025-08-22",
    history:[
      { hospital:"GB Pant Hospital",      date:"2025-08-22", time:"07:45", month:"August",    year:2025 },
      { hospital:"RML Hospital",          date:"2025-02-13", time:"10:00", month:"February",  year:2025 },
    ],
  },
  {
    id:"CR-015", name:"Kavita Singh",     blood_group:"AB-",    verified:true,
    phone:"+91-98101-65615", email:"kavita.singh@gmail.com",
    address:"11, Mukherjee Nagar, New Delhi 110009",
    work_address:"Hindu Rao Hospital, Malka Ganj, Delhi",
    last_donation: "2026-03-01",
    history:[
      { hospital:"Hindu Rao Hospital",    date:"2026-03-01", time:"08:00", month:"March",     year:2026 },
      { hospital:"Safdarjung Hospital",   date:"2025-08-12", time:"11:30", month:"August",    year:2025 },
      { hospital:"AIIMS Delhi",           date:"2025-01-05", time:"09:00", month:"January",   year:2025 },
    ],
  },
  {
    id:"CR-016", name:"Deepak Verma",     blood_group:"O-",     verified:true,
    phone:"+91-98101-76716", email:"deepak.verma@gmail.com",
    address:"19, Tilak Nagar, New Delhi 110018",
    work_address:"Deen Dayal Upadhyay Hospital, Hari Nagar",
    last_donation: "2025-12-19",
    history:[
      { hospital:"DDU Hospital Delhi",    date:"2025-12-19", time:"10:00", month:"December",  year:2025 },
      { hospital:"RML Hospital",          date:"2025-06-07", time:"08:30", month:"June",      year:2025 },
      { hospital:"AIIMS Delhi",           date:"2024-11-25", time:"14:00", month:"November",  year:2024 },
    ],
  },
  {
    id:"CR-017", name:"Priya Malhotra",   blood_group:"O-",     verified:true,
    phone:"+91-98101-87817", email:"priya.malhotra@gmail.com",
    address:"2-A, Model Town, New Delhi 110009",
    work_address:"Fortis Hospital, Shalimar Bagh, Delhi",
    last_donation: "2025-10-08",
    history:[
      { hospital:"Fortis Shalimar Bagh",  date:"2025-10-08", time:"11:00", month:"October",   year:2025 },
      { hospital:"Safdarjung Hospital",   date:"2025-03-25", time:"09:15", month:"March",     year:2025 },
    ],
  },
  {
    id:"CR-018", name:"Manish Tiwari",    blood_group:"O-",     verified:true,
    phone:"+91-98101-98918", email:"manish.tiwari@gmail.com",
    address:"40, Shahdara, New Delhi 110032",
    work_address:"GTB Hospital, Shahdara, Delhi",
    last_donation: "2025-06-15",
    history:[
      { hospital:"GTB Hospital Delhi",    date:"2025-06-15", time:"13:30", month:"June",      year:2025 },
      { hospital:"AIIMS Delhi",           date:"2024-12-10", time:"09:45", month:"December",  year:2024 },
      { hospital:"Apollo Sarita Vihar",   date:"2024-05-22", time:"11:00", month:"May",       year:2024 },
    ],
  },
  {
    id:"CR-019", name:"Rekha Chauhan",    blood_group:"O-",     verified:true,
    phone:"+91-98101-10119", email:"rekha.chauhan@hotmail.com",
    address:"15, Sarojini Nagar, New Delhi 110023",
    work_address:"AIIMS Trauma Centre, New Delhi",
    last_donation: "2026-02-10",
    history:[
      { hospital:"AIIMS Delhi",           date:"2026-02-10", time:"08:15", month:"February",  year:2026 },
      { hospital:"RML Hospital",          date:"2025-07-28", time:"10:45", month:"July",      year:2025 },
    ],
  },
  {
    id:"CR-020", name:"Gaurav Joshi",     blood_group:"O-",     verified:false,
    phone:"+91-98101-20120", email:"gaurav.joshi@gmail.com",
    address:"6, Patel Nagar, New Delhi 110008",
    work_address:"Sir Ganga Ram Hospital, Rajinder Nagar",
    last_donation: "2025-09-27",
    history:[
      { hospital:"Sir Ganga Ram Hospital", date:"2025-09-27", time:"12:00", month:"September", year:2025 },
      { hospital:"Safdarjung Hospital",    date:"2025-02-19", time:"09:00", month:"February",  year:2025 },
    ],
  },
  {
    id:"CR-021", name:"Sonal Gupta",      blood_group:"O-",     verified:true,
    phone:"+91-98101-31221", email:"sonal.gupta@gmail.com",
    address:"33, Vasundhara Enclave, Delhi 110096",
    work_address:"Max Hospital, Patparganj, Delhi",
    last_donation: "2025-11-03",
    history:[
      { hospital:"Max Hospital Patparganj",date:"2025-11-03", time:"09:30", month:"November",  year:2025 },
      { hospital:"AIIMS Delhi",            date:"2025-04-16", time:"11:00", month:"April",     year:2025 },
      { hospital:"RML Hospital",           date:"2024-09-08", time:"14:45", month:"September", year:2024 },
    ],
  },
  {
    id:"CR-022", name:"Tarun Bhatt",      blood_group:"O-",     verified:true,
    phone:"+91-98101-42322", email:"tarun.bhatt@gmail.com",
    address:"8, Rajouri Garden, New Delhi 110027",
    work_address:"Mata Chanan Devi Hospital, Janakpuri",
    last_donation: "2025-07-11",
    history:[
      { hospital:"Mata Chanan Devi Hosp", date:"2025-07-11", time:"08:00", month:"July",      year:2025 },
      { hospital:"Safdarjung Hospital",   date:"2024-12-30", time:"10:30", month:"December",  year:2024 },
    ],
  },
  {
    id:"CR-023", name:"Hema Nambiar",     blood_group:"O-",     verified:true,
    phone:"+91-98101-53423", email:"hema.nambiar@gmail.com",
    address:"4, Green Park, New Delhi 110016",
    work_address:"Safdarjung Hospital, New Delhi",
    last_donation: "2025-05-29",
    history:[
      { hospital:"Safdarjung Hospital",   date:"2025-05-29", time:"07:30", month:"May",       year:2025 },
      { hospital:"AIIMS Delhi",           date:"2024-11-14", time:"09:00", month:"November",  year:2024 },
      { hospital:"RML Hospital",          date:"2024-04-03", time:"14:00", month:"April",     year:2024 },
    ],
  },
  {
    id:"CR-024", name:"Farhan Sheikh",    blood_group:"Bombay", verified:true,
    phone:"+91-98101-64524", email:"farhan.sheikh@gmail.com",
    address:"16, Okhla Phase I, New Delhi 110020",
    work_address:"Holy Family Hospital, Okhla, Delhi",
    last_donation: "2025-08-18",
    history:[
      { hospital:"Holy Family Hospital",  date:"2025-08-18", time:"11:15", month:"August",    year:2025 },
      { hospital:"Apollo Sarita Vihar",   date:"2025-01-30", time:"10:00", month:"January",   year:2025 },
    ],
  },
  {
    id:"CR-025", name:"Usha Tripathi",    blood_group:"Bombay", verified:true,
    phone:"+91-98101-75625", email:"usha.tripathi@gmail.com",
    address:"21-B, Jangpura Extension, New Delhi 110014",
    work_address:"Maulana Azad Medical College, Delhi",
    last_donation: "2026-03-18",
    history:[
      { hospital:"MAMC & LN Hospital",    date:"2026-03-18", time:"09:00", month:"March",     year:2026 },
      { hospital:"AIIMS Delhi",           date:"2025-09-05", time:"11:30", month:"September", year:2025 },
      { hospital:"Safdarjung Hospital",   date:"2025-02-14", time:"08:45", month:"February",  year:2025 },
    ],
  },
];

// ── Helpers ────────────────────────────────────────────────────────────────
function daysSince(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
const DONATION_COOLDOWN = 90;  // days (standard whole-blood interval)

function crColor(group) { return CR_COLORS[group] || CR_COLORS["O-"]; }

// ── Final Confirmation Overlay ─────────────────────────────────────────────
function CRConfirmOverlay({ onConfirm, onCancel }) {
  const [typed, setTyped] = React.useState("");
  const PASSPHRASE = "CONFIRM";
  return (
    <div className="cr-confirm-overlay" onClick={onCancel}>
      <div className="cr-confirm-box" onClick={e => e.stopPropagation()}>
        <div className="cr-confirm-icon">🔐</div>
        <div style={{ fontSize:20, fontWeight:800, color:"#fff", marginBottom:8 }}>
          Code Rare — Restricted Access
        </div>
        <div style={{ fontSize:13, color:"#999", lineHeight:1.7, marginBottom:22,
          fontFamily:"var(--font-mono)" }}>
          You are about to reveal personal contact information<br/>
          of voluntary emergency donors.<br/><br/>
          <span style={{ color:"#dc267f", fontWeight:700 }}>
            This action is logged. Use only in confirmed<br/>
            zero-inventory emergency situations.
          </span>
        </div>
        <div style={{ marginBottom:16 }}>
          <div style={{ fontSize:11, color:"#666", marginBottom:8, textAlign:"left",
            fontFamily:"var(--font-mono)" }}>
            Type <strong style={{ color:"#dc267f" }}>CONFIRM</strong> to proceed:
          </div>
          <input
            value={typed}
            onChange={e => setTyped(e.target.value.toUpperCase())}
            placeholder="CONFIRM"
            style={{ textAlign:"center", letterSpacing:4, fontWeight:700,
              borderColor: typed === PASSPHRASE ? "#27ae60" : "#2a1a2e",
              color: typed === PASSPHRASE ? "#27ae60" : "#d4d4d8" }}
            autoFocus
          />
        </div>
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={onCancel} style={{ flex:1, padding:"11px 0", borderRadius:9,
            border:"1px solid #333", background:"transparent", color:"#666",
            fontFamily:"var(--font)", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            Cancel
          </button>
          <button
            onClick={() => typed === PASSPHRASE && onConfirm()}
            style={{ flex:1, padding:"11px 0", borderRadius:9,
              border:`1px solid ${typed===PASSPHRASE?"#dc267f":"#333"}`,
              background: typed===PASSPHRASE ? "rgba(220,38,127,.15)" : "transparent",
              color: typed===PASSPHRASE ? "#dc267f" : "#444",
              fontFamily:"var(--font)", fontWeight:800, fontSize:13,
              cursor: typed===PASSPHRASE ? "pointer" : "default",
              transition:"all .2s" }}>
            🔓 Unlock Registry
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Dispatch Confirmation ──────────────────────────────────────────────────
function DispatchConfirm({ donor, onClose }) {
  const col = crColor(donor.blood_group);
  return (
    <div className="cr-confirm-overlay" onClick={onClose}>
      <div className="cr-confirm-box" onClick={e => e.stopPropagation()}
        style={{ borderColor: col.primary, boxShadow:`0 0 60px ${col.primary}55` }}>
        <div style={{ fontSize:40, marginBottom:10 }}>🚨</div>
        <div style={{ fontSize:18, fontWeight:800, color:"#fff", marginBottom:6 }}>
          Emergency Dispatch Sent
        </div>
        <div style={{ padding:"14px 16px", borderRadius:10, background: col.dim,
          border:`1px solid ${col.border}`, marginBottom:18, textAlign:"left" }}>
          <div style={{ fontWeight:700, color:"#fff", marginBottom:4 }}>{donor.name}</div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"#999", lineHeight:1.8 }}>
            📞 {donor.phone}<br/>
            📍 {donor.address}<br/>
            🩸 <span style={{ color: col.primary, fontWeight:700 }}>{donor.blood_group}</span>
          </div>
        </div>
        <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"#27ae60",
          background:"rgba(39,174,96,.1)", border:"1px solid #27ae6033",
          borderRadius:8, padding:"10px 12px", marginBottom:18, textAlign:"left" }}>
          ✅ Rider alerted · Hospital notified · ETA calculating…
        </div>
        <button onClick={onClose} className="primary" style={{ width:"100%" }}>
          Close
        </button>
      </div>
    </div>
  );
}

// ── Individual Donor Card ──────────────────────────────────────────────────
function DonorCard({ donor, unlocked, onDispatch }) {
  const [expanded, setExpanded] = React.useState(false);
  const days = daysSince(donor.last_donation);
  const eligible = days >= DONATION_COOLDOWN;
  const col = crColor(donor.blood_group);

  return (
    <div className="cr-donor-card">
      {/* Card header strip */}
      <div style={{ padding:"12px 16px", borderBottom:"1px solid #1e102e",
        display:"flex", alignItems:"center", gap:12,
        background:`linear-gradient(90deg,${col.dim},transparent)` }}>
        {/* Blood group badge */}
        <div style={{ minWidth:58, textAlign:"center", padding:"6px 8px",
          borderRadius:8, background: col.dim, border:`1px solid ${col.border}` }}>
          <div style={{ fontFamily:"var(--font-mono)", fontWeight:800,
            fontSize:13, color: col.primary }}>{donor.blood_group}</div>
        </div>
        {/* Name + ID */}
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:14, color:"#fff" }}>{donor.name}</div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:10, color:"#555",
            display:"flex", gap:8, marginTop:2, flexWrap:"wrap" }}>
            <span>{donor.id}</span>
            {donor.verified
              ? <span style={{ color:"#27ae60" }}>✅ Verified</span>
              : <span style={{ color:"#e67e22" }}>⚠ Unverified</span>}
            <span className={eligible ? "cr-eligible" : "cr-ineligible"}>
              {eligible ? `✓ Eligible (${days}d ago)` : `✗ Ineligible (${days}d ago)`}
            </span>
          </div>
        </div>
        {/* Expand toggle */}
        <button onClick={() => setExpanded(x => !x)}
          style={{ background:"transparent", border:"1px solid #2a1a2e",
            borderRadius:8, color:"#666", padding:"5px 10px",
            cursor:"pointer", fontSize:12, fontFamily:"var(--font)", transition:"all .16s" }}>
          {expanded ? "▲ Less" : "▼ More"}
        </button>
      </div>

      {/* Contact info — masked if locked */}
      <div style={{ padding:"12px 16px" }}>
        <div style={{ display:"flex", gap:16, flexWrap:"wrap", marginBottom:10 }}>
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ fontSize:10, color:"#555", marginBottom:3, textTransform:"uppercase",
              letterSpacing:.4, fontFamily:"var(--font-mono)" }}>Home Address</div>
            <div style={{ fontSize:12, color: unlocked ? "#d4d4d8" : "#444",
              filter: unlocked ? "none" : "blur(5px)", userSelect: unlocked ? "auto" : "none",
              transition:"filter .3s" }}>
              {donor.address}
            </div>
          </div>
          <div style={{ flex:1, minWidth:180 }}>
            <div style={{ fontSize:10, color:"#555", marginBottom:3, textTransform:"uppercase",
              letterSpacing:.4, fontFamily:"var(--font-mono)" }}>Work / Hospital</div>
            <div style={{ fontSize:12, color: unlocked ? "#d4d4d8" : "#444",
              filter: unlocked ? "none" : "blur(5px)", userSelect: unlocked ? "auto" : "none",
              transition:"filter .3s" }}>
              {donor.work_address}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display:"flex", gap:8 }}>
          <button className="cr-call-btn"
            onClick={() => unlocked ? alert(`Calling ${donor.name}: ${donor.phone}`) : null}
            style={{ opacity: unlocked ? 1 : .35, cursor: unlocked ? "pointer" : "not-allowed" }}>
            📞 {unlocked ? donor.phone : "••••••••••"}
          </button>
          <button className="cr-dispatch-btn"
            onClick={() => unlocked && eligible && onDispatch(donor)}
            style={{ opacity: unlocked && eligible ? 1 : .35,
              cursor: unlocked && eligible ? "pointer" : "not-allowed" }}>
            🚨 Emergency Dispatch
          </button>
        </div>
      </div>

      {/* Expanded donation history */}
      {expanded && (
        <div style={{ padding:"10px 16px 14px",
          borderTop:"1px solid #1e102e", background:"#0f0b16" }}>
          <div style={{ fontSize:10, color:"#555", fontWeight:700, letterSpacing:.5,
            textTransform:"uppercase", marginBottom:8, fontFamily:"var(--font-mono)" }}>
            Donation History · Last Eligible in {Math.max(0, DONATION_COOLDOWN - days)} days
          </div>
          {donor.history.map((h, i) => (
            <div key={i} className="cr-history-row">
              <span style={{ color: col.primary, fontWeight:700 }}>●</span>
              <span>{h.hospital}</span>
              <span style={{ marginLeft:"auto", color:"#444" }}>
                {h.time} · {h.date.split("-").reverse().join(" ")}
              </span>
            </div>
          ))}
          <div style={{ marginTop:8, fontSize:11, fontFamily:"var(--font-mono)",
            color:"#555" }}>
            Days since last donation: <strong style={{ color: eligible?"#27ae60":"#c0392b" }}>
              {days} days
            </strong> {eligible ? "— Ready to donate" : `— ${DONATION_COOLDOWN - days} days remaining`}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Code Rare View ────────────────────────────────────────────────────
function CodeRare() {
  const [unlocked,       setUnlocked]       = React.useState(false);
  const [showConfirm,    setShowConfirm]     = React.useState(false);
  const [dispatchDonor,  setDispatchDonor]   = React.useState(null);
  const [filterGroup,    setFilterGroup]     = React.useState("all");
  const [searchQ,        setSearchQ]         = React.useState("");

  const filtered = CODE_RARE_DONORS.filter(d => {
    if (filterGroup !== "all" && d.blood_group !== filterGroup) return false;
    if (searchQ && !d.name.toLowerCase().includes(searchQ.toLowerCase()) &&
        !d.id.toLowerCase().includes(searchQ.toLowerCase())) return false;
    return true;
  });

  const counts = {
    "Bombay": CODE_RARE_DONORS.filter(d => d.blood_group === "Bombay").length,
    "AB-":    CODE_RARE_DONORS.filter(d => d.blood_group === "AB-").length,
    "O-":     CODE_RARE_DONORS.filter(d => d.blood_group === "O-").length,
  };
  const eligibleCount = CODE_RARE_DONORS.filter(d => daysSince(d.last_donation) >= DONATION_COOLDOWN).length;

  return (
    <div className="slide-in">
      {showConfirm && (
        <CRConfirmOverlay
          onConfirm={() => { setUnlocked(true); setShowConfirm(false); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {dispatchDonor && (
        <DispatchConfirm donor={dispatchDonor} onClose={() => setDispatchDonor(null)} />
      )}

      {/* ── Header ── */}
      <div className="cr-header">
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"#dc267f",
              letterSpacing:2, marginBottom:6 }}>⬛ RESTRICTED PROTOCOL</div>
            <div className="cr-title">⬤ Code Rare</div>
            <div style={{ fontFamily:"var(--font-mono)", fontSize:11, color:"#666",
              marginTop:6, lineHeight:1.7 }}>
              Emergency Rare-Blood Voluntary Donor Registry<br/>
              Activate only when all hospital inventories return zero.
            </div>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:8, alignItems:"flex-end" }}>
            {!unlocked ? (
              <button onClick={() => setShowConfirm(true)}
                style={{ padding:"10px 20px", borderRadius:10,
                  border:"2px solid #dc267f", background:"rgba(220,38,127,.1)",
                  color:"#dc267f", fontFamily:"var(--font)", fontWeight:800,
                  fontSize:13, cursor:"pointer", transition:"all .2s",
                  display:"flex", alignItems:"center", gap:8 }}>
                🔐 Unlock Registry
              </button>
            ) : (
              <div style={{ display:"flex", alignItems:"center", gap:8,
                padding:"8px 16px", borderRadius:10,
                background:"rgba(39,174,96,.1)", border:"1px solid #27ae6044" }}>
                <span style={{ fontSize:14 }}>🔓</span>
                <span style={{ color:"#27ae60", fontWeight:700, fontSize:13 }}>
                  Registry Unlocked
                </span>
                <button onClick={() => setUnlocked(false)}
                  style={{ background:"transparent", border:"none",
                    color:"#555", cursor:"pointer", fontSize:11, marginLeft:4 }}>
                  ✕ Lock
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(5,1fr)", gap:10, marginTop:20 }}>
          {[
            { val:CODE_RARE_DONORS.length, lbl:"Total Donors",   col:"#fff"    },
            { val:counts["Bombay"],         lbl:"Bombay",         col:"#dc267f" },
            { val:counts["AB-"],            lbl:"AB Negative",    col:"#a855f7" },
            { val:counts["O-"],             lbl:"O Negative",     col:"#ff4466" },
            { val:eligibleCount,            lbl:"Eligible Now",   col:"#27ae60" },
          ].map(s => (
            <div key={s.lbl} style={{ textAlign:"center", padding:"10px 0",
              borderRadius:8, background:"rgba(255,255,255,.03)",
              border:"1px solid rgba(255,255,255,.06)" }}>
              <div style={{ fontFamily:"var(--font-mono)", fontSize:22,
                fontWeight:800, color: s.col }}>{s.val}</div>
              <div style={{ fontSize:10, color:"#555", marginTop:2,
                textTransform:"uppercase", letterSpacing:.4 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter + Search bar ── */}
      <div style={{ display:"flex", gap:10, alignItems:"center",
        flexWrap:"wrap", marginBottom:16 }}>
        <input placeholder="Search donor name or ID…" value={searchQ}
          onChange={e => setSearchQ(e.target.value)}
          style={{ flex:1, minWidth:200 }} />
        {[
          { key:"all",    label:"All Groups", cls:"active-all"    },
          { key:"Bombay", label:"🩸 Bombay",  cls:"active-bombay" },
          { key:"AB-",    label:"🟣 AB-",     cls:"active-ab-neg" },
          { key:"O-",     label:"🔴 O-",      cls:"active-o-neg"  },
        ].map(f => (
          <button key={f.key}
            className={`cr-filter-btn ${filterGroup === f.key ? f.cls : ""}`}
            onClick={() => setFilterGroup(f.key)}>
            {f.label} {f.key !== "all" && `(${counts[f.key]||0})`}
          </button>
        ))}
      </div>

      {/* ── Lock screen watermark ── */}
      {!unlocked && (
        <div className="cr-lock-screen">
          <div style={{ fontSize:48, marginBottom:12 }}>🔒</div>
          <div style={{ fontSize:15, fontWeight:800, color:"#dc267f", marginBottom:8 }}>
            Registry Locked
          </div>
          <div style={{ fontFamily:"var(--font-mono)", fontSize:12, color:"#555",
            lineHeight:1.8, maxWidth:380, margin:"0 auto" }}>
            Donor contact details are hidden.<br/>
            Click <strong style={{ color:"#dc267f" }}>Unlock Registry</strong> above,<br/>
            type <strong style={{ color:"#dc267f" }}>CONFIRM</strong>, and proceed with extreme care.<br/><br/>
            <span style={{ color:"#333" }}>All access events are logged.</span>
          </div>
        </div>
      )}

      {/* ── Donor list ── */}
      <div style={{ marginTop: unlocked ? 0 : 16 }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign:"center", padding:"40px 20px",
            color:"var(--muted)", fontFamily:"var(--font-mono)", fontSize:13 }}>
            No donors match the current filter.
          </div>
        ) : (
          filtered.map(d => (
            <DonorCard key={d.id} donor={d} unlocked={unlocked}
              onDispatch={setDispatchDonor} />
          ))
        )}
      </div>
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
    { id: "riders",    label: "⚡ Rider Command" },
    { id: "coderare",  label: "⬛ Code Rare" },
    { id: "campplan",   label: "🗺 Camp Planner" },
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
        {tab === "coderare"  && <CodeRare />}
        {tab === "campplan"   && <CampPlanner />}
      </main>
    </>
  );
}