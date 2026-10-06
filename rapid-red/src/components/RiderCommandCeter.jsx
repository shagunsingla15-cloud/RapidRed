 /**
 * RapidRed — Rider Command Center
 * Elite Dispatcher & Rider Hierarchy Module
 *
 * Tabs:
 *  1. Live Map      — 15 rider icons + radius overlays (Leaflet)
 *  2. Leaderboard   — Ranked hierarchy with tier badges
 *  3. Rate Rider    — Hospital-to-rider feedback form
 *  4. Dashboard     — Performance analytics
 */

import { useState, useEffect, useRef } from "react";

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const API = process.env.REACT_APP_API_URL || "http://localhost:8000";

// ─── MOCK DATA (mirrors backend RIDERS exactly, used when API is offline) ────
const MOCK_RIDERS = [
  { rider_id:"R001", name:"Arjun Kapoor",    avatar:"AK", status:"Available", lat:28.5720, lng:77.2050, service_radius_km:10, total_deliveries:312, avg_delivery_time_min:8.2,  star_rating:4.9,  rating_count:280, feedback_tags:{"Friendly Nature":210,"Handled with Care":265,"Hospital Staff Engagement":198}, specialization:"Critical / Bombay Blood",  tier:"Platinum", tier_color:"#E5C07B", badge:"⚡ PLATINUM", reputation_score:185.4 },
  { rider_id:"R002", name:"Meena Rathi",     avatar:"MR", status:"Busy",      lat:28.5800, lng:77.2200, service_radius_km:9,  total_deliveries:289, avg_delivery_time_min:8.9,  star_rating:4.85, rating_count:260, feedback_tags:{"Friendly Nature":240,"Handled with Care":255,"Hospital Staff Engagement":220}, specialization:"Rare Blood Types",         tier:"Platinum", tier_color:"#E5C07B", badge:"⚡ PLATINUM", reputation_score:174.9 },
  { rider_id:"R003", name:"Vijay Sharma",    avatar:"VS", status:"Available", lat:28.5610, lng:77.1950, service_radius_km:8,  total_deliveries:256, avg_delivery_time_min:9.5,  star_rating:4.75, rating_count:230, feedback_tags:{"Friendly Nature":180,"Handled with Care":230,"Hospital Staff Engagement":170}, specialization:"Emergency Response",       tier:"Platinum", tier_color:"#E5C07B", badge:"⚡ PLATINUM", reputation_score:161.2 },
  { rider_id:"R004", name:"Sita Patel",      avatar:"SP", status:"Available", lat:28.5900, lng:77.2300, service_radius_km:9,  total_deliveries:241, avg_delivery_time_min:9.8,  star_rating:4.80, rating_count:215, feedback_tags:{"Friendly Nature":200,"Handled with Care":210,"Hospital Staff Engagement":195}, specialization:"Multi-Hospital Runs",      tier:"Gold",     tier_color:"#F0A500", badge:"🥇 GOLD",     reputation_score:153.8 },
  { rider_id:"R005", name:"Rajan Mehta",     avatar:"RM", status:"Available", lat:28.5500, lng:77.2000, service_radius_km:8,  total_deliveries:220, avg_delivery_time_min:10.1, star_rating:4.70, rating_count:198, feedback_tags:{"Friendly Nature":165,"Handled with Care":198,"Hospital Staff Engagement":155}, specialization:"Night Shifts",             tier:"Gold",     tier_color:"#F0A500", badge:"🥇 GOLD",     reputation_score:143.6 },
  { rider_id:"R006", name:"Anita Desai",     avatar:"AD", status:"Busy",      lat:28.5650, lng:77.2400, service_radius_km:7,  total_deliveries:198, avg_delivery_time_min:10.5, star_rating:4.65, rating_count:178, feedback_tags:{"Friendly Nature":160,"Handled with Care":175,"Hospital Staff Engagement":148}, specialization:"Pediatric Hospitals",      tier:"Gold",     tier_color:"#F0A500", badge:"🥇 GOLD",     reputation_score:134.7 },
  { rider_id:"R007", name:"Suresh Nair",     avatar:"SN", status:"Available", lat:28.5750, lng:77.1850, service_radius_km:7,  total_deliveries:185, avg_delivery_time_min:11.0, star_rating:4.60, rating_count:165, feedback_tags:{"Friendly Nature":140,"Handled with Care":162,"Hospital Staff Engagement":130}, specialization:"Cross-City Transfers",     tier:"Gold",     tier_color:"#F0A500", badge:"🥇 GOLD",     reputation_score:127.1 },
  { rider_id:"R008", name:"Priya Iyer",      avatar:"PI", status:"Available", lat:28.5480, lng:77.2150, service_radius_km:7,  total_deliveries:172, avg_delivery_time_min:11.3, star_rating:4.55, rating_count:152, feedback_tags:{"Friendly Nature":138,"Handled with Care":150,"Hospital Staff Engagement":125}, specialization:"Government Hospitals",     tier:"Silver",   tier_color:"#A8B2D8", badge:"🥈 SILVER",   reputation_score:119.4 },
  { rider_id:"R009", name:"Deepak Joshi",    avatar:"DJ", status:"Available", lat:28.5850, lng:77.2500, service_radius_km:6,  total_deliveries:156, avg_delivery_time_min:11.8, star_rating:4.50, rating_count:138, feedback_tags:{"Friendly Nature":120,"Handled with Care":138,"Hospital Staff Engagement":110}, specialization:"Standard Delivery",        tier:"Silver",   tier_color:"#A8B2D8", badge:"🥈 SILVER",   reputation_score:111.2 },
  { rider_id:"R010", name:"Kavya Reddy",     avatar:"KR", status:"Busy",      lat:28.5600, lng:77.1780, service_radius_km:6,  total_deliveries:140, avg_delivery_time_min:12.2, star_rating:4.45, rating_count:124, feedback_tags:{"Friendly Nature":110,"Handled with Care":122,"Hospital Staff Engagement":98},  specialization:"South Delhi Zone",         tier:"Silver",   tier_color:"#A8B2D8", badge:"🥈 SILVER",   reputation_score:103.4 },
  { rider_id:"R011", name:"Nikhil Gupta",    avatar:"NG", status:"Available", lat:28.5380, lng:77.2350, service_radius_km:6,  total_deliveries:128, avg_delivery_time_min:12.8, star_rating:4.35, rating_count:112, feedback_tags:{"Friendly Nature":95, "Handled with Care":110,"Hospital Staff Engagement":88},  specialization:"Private Clinic Network",   tier:"Standard", tier_color:"#6C8EBF", badge:"🔵 STANDARD", reputation_score:94.0  },
  { rider_id:"R012", name:"Sunita Rao",      avatar:"SR", status:"Available", lat:28.5950, lng:77.1950, service_radius_km:5,  total_deliveries:110, avg_delivery_time_min:13.5, star_rating:4.25, rating_count:98,  feedback_tags:{"Friendly Nature":85, "Handled with Care":96, "Hospital Staff Engagement":78},  specialization:"North Delhi Zone",         tier:"Standard", tier_color:"#6C8EBF", badge:"🔵 STANDARD", reputation_score:83.0  },
  { rider_id:"R013", name:"Amit Tiwari",     avatar:"AT", status:"Available", lat:28.5430, lng:77.1680, service_radius_km:5,  total_deliveries:95,  avg_delivery_time_min:14.0, star_rating:4.15, rating_count:84,  feedback_tags:{"Friendly Nature":72, "Handled with Care":82, "Hospital Staff Engagement":65},  specialization:"West Delhi Zone",          tier:"Standard", tier_color:"#6C8EBF", badge:"🔵 STANDARD", reputation_score:73.8  },
  { rider_id:"R014", name:"Rekha Pillai",    avatar:"RP", status:"Busy",      lat:28.5780, lng:77.2620, service_radius_km:5,  total_deliveries:78,  avg_delivery_time_min:14.8, star_rating:4.05, rating_count:70,  feedback_tags:{"Friendly Nature":60, "Handled with Care":68, "Hospital Staff Engagement":55},  specialization:"East Delhi Zone",          tier:"Standard", tier_color:"#6C8EBF", badge:"🔵 STANDARD", reputation_score:63.4  },
  { rider_id:"R015", name:"Karan Bhatia",    avatar:"KB", status:"Available", lat:28.5520, lng:77.2500, service_radius_km:5,  total_deliveries:62,  avg_delivery_time_min:15.5, star_rating:3.95, rating_count:55,  feedback_tags:{"Friendly Nature":45, "Handled with Care":54, "Hospital Staff Engagement":40},  specialization:"General Dispatch",         tier:"Standard", tier_color:"#6C8EBF", badge:"🔵 STANDARD", reputation_score:52.7  },
];

const HOSPITALS_LIST = [
  { id: "H001", name: "AIIMS Delhi" },
  { id: "H002", name: "Safdarjung Hospital" },
  { id: "H003", name: "RML Hospital" },
  { id: "H004", name: "Apollo Sarita Vihar" },
  { id: "H005", name: "Fortis Vasant Kunj" },
];

const TIER_COLORS = { Platinum: "#E5C07B", Gold: "#F0A500", Silver: "#A8B2D8", Standard: "#6C8EBF" };
const TIER_BG    = { Platinum: "rgba(229,192,123,.15)", Gold: "rgba(240,165,0,.12)", Silver: "rgba(168,178,216,.12)", Standard: "rgba(108,142,191,.10)" };

// ─── STAR COMPONENT ───────────────────────────────────────────────────────────
function Stars({ value, max = 5, size = 14 }) {
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i + 1 <= Math.floor(value);
        const half   = !filled && i < value;
        return (
          <span key={i} style={{ fontSize: size, color: filled || half ? "#F0A500" : "#444", lineHeight: 1 }}>
            {filled ? "★" : half ? "⯨" : "☆"}
          </span>
        );
      })}
    </span>
  );
}

// ─── TIER BADGE ───────────────────────────────────────────────────────────────
function TierBadge({ tier }) {
  const icons = { Platinum: "⚡", Gold: "🥇", Silver: "🥈", Standard: "🔵" };
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "2px 8px", borderRadius: 20, fontSize: 11, fontWeight: 700,
      background: TIER_BG[tier], color: TIER_COLORS[tier],
      border: `1px solid ${TIER_COLORS[tier]}44`, letterSpacing: ".5px",
    }}>
      {icons[tier]} {tier.toUpperCase()}
    </span>
  );
}

// ─── STATUS DOT ───────────────────────────────────────────────────────────────
function StatusDot({ status }) {
  const color = status === "Available" ? "#4CAF50" : "#FF5722";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: color,
        boxShadow: `0 0 6px ${color}`, display: "inline-block" }} />
      <span style={{ fontSize: 12, color }}>{status}</span>
    </span>
  );
}

// ─── LIVE MAP (Leaflet) ───────────────────────────────────────────────────────
function LiveMap({ riders, selectedRider, onSelectRider }) {
  const mapRef   = useRef(null);
  const leafRef  = useRef(null);
  const markersRef = useRef([]);
  const circlesRef = useRef([]);

  useEffect(() => {
    if (leafRef.current) return;
    const L = window.L;
    if (!L) return;
    const map = L.map(mapRef.current, { center: [28.5672, 77.2100], zoom: 13, zoomControl: true });
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
    }).addTo(map);
    // AIIMS marker
    L.marker([28.5672, 77.2100], {
      icon: L.divIcon({ className: "", html: `<div style="background:#c0392b;color:#fff;font-size:10px;font-weight:700;padding:3px 6px;border-radius:4px;white-space:nowrap;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.4)">🏥 AIIMS</div>` }),
    }).addTo(map);
    leafRef.current = map;
  }, []);

  useEffect(() => {
    const L = window.L;
    if (!L || !leafRef.current) return;
    markersRef.current.forEach(m => m.remove());
    circlesRef.current.forEach(c => c.remove());
    markersRef.current = [];
    circlesRef.current = [];

    riders.forEach(r => {
      const color   = TIER_COLORS[r.tier] || "#6C8EBF";
      const isBusy  = r.status === "Busy";
      const isSelected = selectedRider?.rider_id === r.rider_id;
      const html = `
        <div style="
          width:${isSelected ? 38 : 32}px;height:${isSelected ? 38 : 32}px;
          border-radius:50%;background:${isBusy ? "#333" : color};
          color:#111;font-size:10px;font-weight:800;
          display:flex;align-items:center;justify-content:center;
          border:${isSelected ? "3px solid #fff" : "2px solid rgba(255,255,255,.6)"};
          box-shadow:0 0 ${isSelected ? 14 : 8}px ${color};
          cursor:pointer;opacity:${isBusy ? .6 : 1};
          transition:all .2s;
        ">${r.avatar}</div>`;
      const icon   = L.divIcon({ className: "", html, iconSize: [isSelected?38:32, isSelected?38:32], iconAnchor: [isSelected?19:16, isSelected?19:16] });
      const marker = L.marker([r.lat, r.lng], { icon })
        .addTo(leafRef.current)
        .on("click", () => onSelectRider(r));
      marker.bindTooltip(`<b>${r.name}</b><br/>${r.badge} · ${r.status}<br/>⭐ ${r.star_rating} · ${r.total_deliveries} deliveries`, { direction: "top" });
      markersRef.current.push(marker);

      const circle = L.circle([r.lat, r.lng], {
        radius: r.service_radius_km * 1000,
        color, fillColor: color,
        fillOpacity: isSelected ? .12 : .05,
        weight: isSelected ? 2 : 1,
        dashArray: isBusy ? "5,5" : null,
      }).addTo(leafRef.current);
      circlesRef.current.push(circle);
    });
  }, [riders, selectedRider]);

  return (
    <div style={{ position: "relative" }}>
      {/* Map Legend */}
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1000,
        background: "rgba(18,18,24,.9)", border: "1px solid #333", borderRadius: 8,
        padding: "10px 14px", backdropFilter: "blur(8px)" }}>
        <div style={{ color: "#888", fontSize: 11, fontWeight: 700, marginBottom: 6, letterSpacing: 1 }}>TIER LEGEND</div>
        {["Platinum","Gold","Silver","Standard"].map(t => (
          <div key={t} style={{ display:"flex", alignItems:"center", gap: 6, marginBottom: 4 }}>
            <div style={{ width:10, height:10, borderRadius:"50%", background: TIER_COLORS[t], boxShadow:`0 0 4px ${TIER_COLORS[t]}` }} />
            <span style={{ color: TIER_COLORS[t], fontSize: 11, fontWeight: 600 }}>{t}</span>
          </div>
        ))}
        <hr style={{ borderColor:"#333", margin:"8px 0" }} />
        <div style={{ color:"#888", fontSize:10 }}>Click rider to inspect</div>
      </div>
      <div ref={mapRef} style={{ width: "100%", height: 480, borderRadius: 12, overflow: "hidden" }} />
    </div>
  );
}

// ─── RIDER CARD (sidebar) ─────────────────────────────────────────────────────
function RiderCard({ rider, onRate }) {
  if (!rider) return null;
  const tags = rider.feedback_tags || {};
  const total = Object.values(tags).reduce((a, b) => a + b, 0);
  return (
    <div style={{ background: "#1a1a24", border: `1px solid ${TIER_COLORS[rider.tier]}44`,
      borderRadius: 12, padding: 20, marginTop: 16 }}>
      <div style={{ display:"flex", alignItems:"center", gap: 12, marginBottom: 14 }}>
        <div style={{ width:48, height:48, borderRadius:"50%",
          background: TIER_COLORS[rider.tier], color:"#111",
          fontWeight:800, fontSize:16, display:"flex", alignItems:"center", justifyContent:"center",
          boxShadow:`0 0 16px ${TIER_COLORS[rider.tier]}88` }}>
          {rider.avatar}
        </div>
        <div>
          <div style={{ fontWeight:800, fontSize:16, color:"#eee" }}>{rider.name}</div>
          <TierBadge tier={rider.tier} />
        </div>
        <div style={{ marginLeft:"auto" }}><StatusDot status={rider.status} /></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 8, marginBottom:14 }}>
        {[
          ["🚀 Deliveries", rider.total_deliveries],
          ["⏱ Avg Time", `${rider.avg_delivery_time_min} min`],
          ["📏 Radius", `${rider.service_radius_km} km`],
          ["🏆 Score", rider.reputation_score],
        ].map(([label, val]) => (
          <div key={label} style={{ background:"#0d0d14", borderRadius:8, padding:"8px 10px" }}>
            <div style={{ color:"#666", fontSize:10 }}>{label}</div>
            <div style={{ color:"#ddd", fontWeight:700, fontSize:14, marginTop:2 }}>{val}</div>
          </div>
        ))}
      </div>
      <div style={{ marginBottom:12 }}>
        <Stars value={rider.star_rating} size={18} />
        <span style={{ color:"#888", fontSize:12, marginLeft:6 }}>{rider.star_rating} ({rider.rating_count} ratings)</span>
      </div>
      {/* Engagement Tags */}
      <div style={{ marginBottom:14 }}>
        <div style={{ color:"#666", fontSize:11, marginBottom:6, fontWeight:700, letterSpacing:.5 }}>ENGAGEMENT TAGS</div>
        {Object.entries(tags).map(([tag, count]) => (
          <div key={tag} style={{ marginBottom:6 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:11, color:"#aaa", marginBottom:3 }}>
              <span>{tag}</span><span style={{ color: TIER_COLORS[rider.tier] }}>{count}</span>
            </div>
            <div style={{ height:4, background:"#222", borderRadius:2 }}>
              <div style={{ height:4, borderRadius:2, width:`${Math.round(count/Math.max(total,1)*100)}%`,
                background: TIER_COLORS[rider.tier], transition:"width .4s" }} />
            </div>
          </div>
        ))}
      </div>
      <div style={{ color:"#555", fontSize:11 }}>🎯 {rider.specialization}</div>
      <button onClick={() => onRate(rider)}
        style={{ marginTop:12, width:"100%", padding:"9px 0", borderRadius:8,
          background: TIER_COLORS[rider.tier], color:"#111", fontWeight:800,
          fontSize:13, border:"none", cursor:"pointer" }}>
        ⭐ Rate This Rider
      </button>
    </div>
  );
}

// ─── RATE RIDER MODAL ─────────────────────────────────────────────────────────
function RateModal({ rider, onClose, onSubmit }) {
  const [stars, setStars]       = useState(5);
  const [hovered, setHovered]   = useState(0);
  const [tags, setTags]         = useState([]);
  const [hospitalId, setHospId] = useState("H001");
  const [comment, setComment]   = useState("");
  const [loading, setLoading]   = useState(false);
  const [result, setResult]     = useState(null);

  const TAGS = ["Friendly Nature", "Handled with Care", "Hospital Staff Engagement"];

  const toggleTag = t => setTags(prev => prev.includes(t) ? prev.filter(x=>x!==t) : [...prev, t]);

  const submit = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/rate-rider`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ rider_id: rider.rider_id, hospital_id: hospitalId, stars, feedback_tags: tags, comment }),
      });
      const data = await res.json();
      setResult(data);
      onSubmit(data);
    } catch {
      // API offline — simulate response
      const newRating = parseFloat(((rider.star_rating * rider.rating_count + stars) / (rider.rating_count + 1)).toFixed(2));
      setResult({ success:true, rider_name: rider.name, previous_rating: rider.star_rating, new_rating: newRating, total_ratings: rider.rating_count+1, tier: rider.tier, badge: rider.badge });
    }
    setLoading(false);
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:9999,
      display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#1a1a24", border:"1px solid #333", borderRadius:16,
        padding:28, width:"100%", maxWidth:420, position:"relative" }}>
        <button onClick={onClose} style={{ position:"absolute", top:14, right:16,
          background:"none", border:"none", color:"#888", fontSize:20, cursor:"pointer" }}>✕</button>
        <div style={{ fontWeight:800, fontSize:18, color:"#eee", marginBottom:4 }}>Rate Rider</div>
        <div style={{ color:"#888", fontSize:13, marginBottom:18 }}>{rider.name} · <TierBadge tier={rider.tier} /></div>

        {result ? (
          <div style={{ textAlign:"center", padding:"20px 0" }}>
            <div style={{ fontSize:40, marginBottom:8 }}>✅</div>
            <div style={{ color:"#4CAF50", fontWeight:800, fontSize:16 }}>Rating Submitted!</div>
            <div style={{ color:"#aaa", fontSize:13, marginTop:8 }}>
              {result.previous_rating} ⭐ → <span style={{ color:TIER_COLORS[result.tier]}}>{result.new_rating} ⭐</span>
            </div>
            <div style={{ marginTop:8 }}><TierBadge tier={result.tier} /></div>
            <button onClick={onClose} style={{ marginTop:16, padding:"10px 28px",
              background:"#c0392b", color:"#fff", border:"none", borderRadius:8, fontWeight:700, cursor:"pointer" }}>
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Hospital */}
            <div style={{ marginBottom:14 }}>
              <label style={{ color:"#888", fontSize:12, display:"block", marginBottom:4 }}>Hospital</label>
              <select value={hospitalId} onChange={e=>setHospId(e.target.value)}
                style={{ width:"100%", background:"#0d0d14", color:"#ddd", border:"1px solid #333",
                  borderRadius:8, padding:"8px 10px", fontSize:13 }}>
                {HOSPITALS_LIST.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
              </select>
            </div>

            {/* Stars */}
            <div style={{ marginBottom:14 }}>
              <label style={{ color:"#888", fontSize:12, display:"block", marginBottom:6 }}>Star Rating</label>
              <div style={{ display:"flex", gap:6 }}>
                {[1,2,3,4,5].map(s => (
                  <button key={s}
                    onMouseEnter={()=>setHovered(s)} onMouseLeave={()=>setHovered(0)}
                    onClick={()=>setStars(s)}
                    style={{ background:"none", border:"none", cursor:"pointer", fontSize:28,
                      color: s <= (hovered || stars) ? "#F0A500" : "#444", transition:"color .15s" }}>★</button>
                ))}
                <span style={{ color:"#888", fontSize:13, alignSelf:"center", marginLeft:4 }}>{stars}/5</span>
              </div>
            </div>

            {/* Tags */}
            <div style={{ marginBottom:14 }}>
              <label style={{ color:"#888", fontSize:12, display:"block", marginBottom:6 }}>Feedback Tags</label>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {TAGS.map(t => (
                  <button key={t} onClick={()=>toggleTag(t)}
                    style={{ padding:"8px 12px", borderRadius:8, textAlign:"left", cursor:"pointer", fontSize:12,
                      border:`1px solid ${tags.includes(t) ? "#c0392b" : "#333"}`,
                      background: tags.includes(t) ? "rgba(192,57,43,.15)" : "#0d0d14",
                      color: tags.includes(t) ? "#ff6b6b" : "#aaa", fontWeight: tags.includes(t) ? 700 : 400 }}>
                    {tags.includes(t) ? "✓ " : ""}{t}
                  </button>
                ))}
              </div>
            </div>

            {/* Comment */}
            <div style={{ marginBottom:18 }}>
              <label style={{ color:"#888", fontSize:12, display:"block", marginBottom:4 }}>Comment (optional)</label>
              <textarea value={comment} onChange={e=>setComment(e.target.value)} rows={2}
                placeholder="Add a note..."
                style={{ width:"100%", background:"#0d0d14", color:"#ddd", border:"1px solid #333",
                  borderRadius:8, padding:"8px 10px", fontSize:13, resize:"none", boxSizing:"border-box" }} />
            </div>

            <button onClick={submit} disabled={loading}
              style={{ width:"100%", padding:"11px 0", borderRadius:8,
                background: loading ? "#333" : "#c0392b", color:"#fff", fontWeight:800,
                fontSize:14, border:"none", cursor: loading ? "default":"pointer" }}>
              {loading ? "Submitting…" : "Submit Rating"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── LEADERBOARD TAB ─────────────────────────────────────────────────────────
function Leaderboard({ riders, onSelectRider, onRate }) {
  return (
    <div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        {["Platinum","Gold","Silver","Standard"].map(tier => {
          const count = riders.filter(r=>r.tier===tier).length;
          return (
            <div key={tier} style={{ background: TIER_BG[tier], border:`1px solid ${TIER_COLORS[tier]}44`,
              borderRadius:10, padding:"14px 16px", textAlign:"center" }}>
              <div style={{ fontSize:22, fontWeight:800, color: TIER_COLORS[tier] }}>{count}</div>
              <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{tier} Riders</div>
            </div>
          );
        })}
      </div>
      <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:"0 4px" }}>
        <thead>
          <tr>
            {["Rank","Rider","Tier","Deliveries","Avg Time","Rating","Score","Status",""].map(h => (
              <th key={h} style={{ color:"#555", fontSize:11, fontWeight:700, textAlign:"left",
                padding:"6px 10px", letterSpacing:.5 }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {riders.map((r, i) => (
            <tr key={r.rider_id} onClick={()=>onSelectRider(r)}
              style={{ cursor:"pointer", transition:"background .15s" }}
              onMouseEnter={e=>e.currentTarget.style.background="#1f1f2e"}
              onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
              <td style={{ padding:"10px 10px", color: i<3?"#F0A500":"#555", fontWeight:700, fontSize:13 }}>
                {i===0?"🥇":i===1?"🥈":i===2?"🥉":`#${i+1}`}
              </td>
              <td style={{ padding:"10px 10px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <div style={{ width:30, height:30, borderRadius:"50%",
                    background: TIER_COLORS[r.tier], color:"#111",
                    fontWeight:800, fontSize:11, display:"flex", alignItems:"center", justifyContent:"center",
                    boxShadow:`0 0 8px ${TIER_COLORS[r.tier]}66` }}>
                    {r.avatar}
                  </div>
                  <div>
                    <div style={{ fontWeight:700, fontSize:13, color:"#ddd" }}>{r.name}</div>
                    <div style={{ fontSize:10, color:"#555" }}>{r.specialization}</div>
                  </div>
                </div>
              </td>
              <td style={{ padding:"10px 10px" }}><TierBadge tier={r.tier} /></td>
              <td style={{ padding:"10px 10px", color:"#aaa", fontSize:13 }}>{r.total_deliveries}</td>
              <td style={{ padding:"10px 10px", color:"#aaa", fontSize:13 }}>{r.avg_delivery_time_min} min</td>
              <td style={{ padding:"10px 10px" }}><Stars value={r.star_rating} size={13} /><span style={{color:"#888",fontSize:11,marginLeft:4}}>{r.star_rating}</span></td>
              <td style={{ padding:"10px 10px", color: TIER_COLORS[r.tier], fontWeight:800, fontSize:14 }}>{r.reputation_score}</td>
              <td style={{ padding:"10px 10px" }}><StatusDot status={r.status} /></td>
              <td style={{ padding:"10px 10px" }}>
                <button onClick={e=>{e.stopPropagation();onRate(r);}}
                  style={{ background:"rgba(192,57,43,.15)", border:"1px solid #c0392b44", color:"#ff6b6b",
                    padding:"4px 10px", borderRadius:6, fontSize:11, cursor:"pointer", fontWeight:700 }}>
                  Rate
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── DASHBOARD TAB ───────────────────────────────────────────────────────────
function Dashboard({ riders }) {
  const available   = riders.filter(r=>r.status==="Available").length;
  const busy        = riders.filter(r=>r.status==="Busy").length;
  const totalDel    = riders.reduce((a,r)=>a+r.total_deliveries,0);
  const avgRating   = (riders.reduce((a,r)=>a+r.star_rating,0)/riders.length).toFixed(2);
  const platinum    = riders.filter(r=>r.tier==="Platinum");
  const top         = riders[0];

  // Engagement totals
  const engTotals = riders.reduce((acc, r) => {
    Object.entries(r.feedback_tags||{}).forEach(([t,c])=>{ acc[t]=(acc[t]||0)+c; });
    return acc;
  }, {});

  return (
    <div>
      {/* KPI Row */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:12, marginBottom:24 }}>
        {[
          { label:"Total Deliveries", val:totalDel, icon:"🚀", color:"#4CAF50" },
          { label:"Avg Network Rating", val:`⭐ ${avgRating}`, icon:"⭐", color:"#F0A500" },
          { label:"Available Now", val:available, icon:"🟢", color:"#4CAF50" },
          { label:"On Mission", val:busy, icon:"🔴", color:"#FF5722" },
        ].map(kpi => (
          <div key={kpi.label} style={{ background:"#1a1a24", border:`1px solid ${kpi.color}22`,
            borderRadius:12, padding:"16px 20px" }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{kpi.icon}</div>
            <div style={{ fontSize:26, fontWeight:800, color:kpi.color }}>{kpi.val}</div>
            <div style={{ fontSize:11, color:"#666", marginTop:2 }}>{kpi.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:20 }}>
        {/* Top Performer Spotlight */}
        {top && (
          <div style={{ background:"rgba(229,192,123,.08)", border:"1px solid #E5C07B44", borderRadius:12, padding:20 }}>
            <div style={{ color:"#E5C07B", fontSize:12, fontWeight:700, letterSpacing:1, marginBottom:12 }}>⚡ TOP PERFORMER</div>
            <div style={{ display:"flex", alignItems:"center", gap:12 }}>
              <div style={{ width:50, height:50, borderRadius:"50%", background:"#E5C07B", color:"#111",
                fontWeight:800, fontSize:18, display:"flex", alignItems:"center", justifyContent:"center",
                boxShadow:"0 0 20px #E5C07B88" }}>
                {top.avatar}
              </div>
              <div>
                <div style={{ fontWeight:800, color:"#eee", fontSize:16 }}>{top.name}</div>
                <div style={{ color:"#888", fontSize:12 }}>{top.specialization}</div>
                <div style={{ marginTop:4 }}><Stars value={top.star_rating} size={16} /></div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, marginTop:14 }}>
              <div style={{ background:"rgba(0,0,0,.3)", borderRadius:8, padding:"8px 10px" }}>
                <div style={{ color:"#666", fontSize:10 }}>Reputation Score</div>
                <div style={{ color:"#E5C07B", fontWeight:800, fontSize:18 }}>{top.reputation_score}</div>
              </div>
              <div style={{ background:"rgba(0,0,0,.3)", borderRadius:8, padding:"8px 10px" }}>
                <div style={{ color:"#666", fontSize:10 }}>Total Deliveries</div>
                <div style={{ color:"#eee", fontWeight:800, fontSize:18 }}>{top.total_deliveries}</div>
              </div>
            </div>
          </div>
        )}

        {/* Bombay Blood Auto-Assign */}
        <div style={{ background:"rgba(192,57,43,.08)", border:"1px solid #c0392b44", borderRadius:12, padding:20 }}>
          <div style={{ color:"#ff6b6b", fontSize:12, fontWeight:700, letterSpacing:1, marginBottom:12 }}>🩸 BOMBAY BLOOD PROTOCOL</div>
          <div style={{ color:"#aaa", fontSize:13, lineHeight:1.6, marginBottom:12 }}>
            For <span style={{ color:"#ff6b6b", fontWeight:700 }}>Bombay Blood (hh)</span> — the rarest blood type —
            the dispatch algorithm restricts rider selection to <strong>Platinum & Gold</strong> tiers only,
            ensuring the most vital resources are in the safest hands.
          </div>
          {platinum.slice(0,2).map(r => (
            <div key={r.rider_id} style={{ display:"flex", alignItems:"center", gap:8,
              background:"rgba(0,0,0,.3)", borderRadius:8, padding:"8px 10px", marginBottom:6 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background: TIER_COLORS[r.tier],
                color:"#111", fontWeight:800, fontSize:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
                {r.avatar}
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13, color:"#ddd" }}>{r.name}</div>
                <div style={{ fontSize:10, color:"#888" }}>{r.avg_delivery_time_min} min avg · {r.total_deliveries} deliveries</div>
              </div>
              <StatusDot status={r.status} />
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Totals */}
      <div style={{ background:"#1a1a24", border:"1px solid #333", borderRadius:12, padding:20, marginBottom:20 }}>
        <div style={{ color:"#888", fontSize:12, fontWeight:700, letterSpacing:1, marginBottom:14 }}>NETWORK ENGAGEMENT TOTALS</div>
        {Object.entries(engTotals).map(([tag, count]) => {
          const max = Math.max(...Object.values(engTotals));
          return (
            <div key={tag} style={{ marginBottom:12 }}>
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13, color:"#aaa", marginBottom:4 }}>
                <span>{tag}</span>
                <span style={{ color:"#F0A500", fontWeight:700 }}>{count.toLocaleString()}</span>
              </div>
              <div style={{ height:6, background:"#222", borderRadius:3 }}>
                <div style={{ height:6, borderRadius:3, width:`${Math.round(count/max*100)}%`,
                  background:"linear-gradient(90deg,#c0392b,#F0A500)", transition:"width .5s" }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Rider Delivery History Table */}
      <div style={{ background:"#1a1a24", border:"1px solid #333", borderRadius:12, padding:20 }}>
        <div style={{ color:"#888", fontSize:12, fontWeight:700, letterSpacing:1, marginBottom:14 }}>RIDER DELIVERY HISTORY & ENGAGEMENT SCORES</div>
        <div style={{ overflowX:"auto" }}>
          <table style={{ width:"100%", borderCollapse:"separate", borderSpacing:"0 3px", minWidth:600 }}>
            <thead>
              <tr>
                {["Rider","Tier","Deliveries","Avg Time","Rating","Friendly","Handled","Engaged","Score"].map(h => (
                  <th key={h} style={{ color:"#555", fontSize:10, padding:"4px 8px", textAlign:"left", letterSpacing:.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {riders.map(r => {
                const tags = r.feedback_tags || {};
                return (
                  <tr key={r.rider_id}>
                    <td style={{ padding:"7px 8px" }}>
                      <div style={{ fontWeight:700, fontSize:12, color:"#ddd" }}>{r.name}</div>
                    </td>
                    <td style={{ padding:"7px 8px" }}><TierBadge tier={r.tier} /></td>
                    <td style={{ padding:"7px 8px", color:"#aaa", fontSize:12 }}>{r.total_deliveries}</td>
                    <td style={{ padding:"7px 8px", color:"#aaa", fontSize:12 }}>{r.avg_delivery_time_min}m</td>
                    <td style={{ padding:"7px 8px" }}><Stars value={r.star_rating} size={11} /></td>
                    <td style={{ padding:"7px 8px", color:"#888", fontSize:12 }}>{tags["Friendly Nature"] || 0}</td>
                    <td style={{ padding:"7px 8px", color:"#888", fontSize:12 }}>{tags["Handled with Care"] || 0}</td>
                    <td style={{ padding:"7px 8px", color:"#888", fontSize:12 }}>{tags["Hospital Staff Engagement"] || 0}</td>
                    <td style={{ padding:"7px 8px", color: TIER_COLORS[r.tier], fontWeight:800, fontSize:13 }}>{r.reputation_score}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function RiderCommandCenter() {
  const [tab, setTab]           = useState("map");
  const [riders, setRiders]     = useState(MOCK_RIDERS);
  const [selected, setSelected] = useState(null);
  const [rateTarget, setRate]   = useState(null);
  const [leafletLoaded, setLL]  = useState(false);
  const [apiStatus, setApiStatus] = useState("offline");

  // Load Leaflet CSS + JS
  useEffect(() => {
    if (window.L) { setLL(true); return; }
    const link = document.createElement("link");
    link.rel = "stylesheet"; link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
    document.head.appendChild(link);
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
    script.onload = () => setLL(true);
    document.head.appendChild(script);
  }, []);

  // Try to fetch live data
  useEffect(() => {
    fetch(`${API}/rider-hierarchy`)
      .then(r => r.json())
      .then(data => {
        if (data.hierarchy) { setRiders(data.hierarchy); setApiStatus("online"); }
      })
      .catch(() => setApiStatus("offline"));
  }, []);

  const handleRateSubmit = (result) => {
    // Optimistically update local rider rating
    setRiders(prev => prev.map(r =>
      r.rider_id === result.rider_id
        ? { ...r, star_rating: result.new_rating, rating_count: result.total_ratings, tier: result.tier, tier_color: TIER_COLORS[result.tier] }
        : r
    ));
  };

  const TABS = [
    { id:"map",       label:"🗺 Live Map" },
    { id:"board",     label:"🏆 Leaderboard" },
    { id:"dashboard", label:"📊 Dashboard" },
  ];

  return (
    <div style={{ minHeight:"100vh", background:"#0d0d14", color:"#e0e0e0",
      fontFamily:"'DM Mono', 'Fira Code', 'Courier New', monospace", padding: 0 }}>

      {/* Header */}
      <div style={{ background:"linear-gradient(135deg,#1a0a0a 0%,#0d0d14 60%)",
        borderBottom:"1px solid #c0392b44", padding:"18px 28px",
        display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <span style={{ fontSize:24 }}>⚡</span>
            <span style={{ fontWeight:800, fontSize:20, color:"#fff", letterSpacing:.5 }}>
              Rider <span style={{ color:"#c0392b" }}>Command</span> Center
            </span>
          </div>
          <div style={{ color:"#555", fontSize:11, marginTop:2 }}>
            RapidRed · Elite Dispatcher & Rider Hierarchy · {riders.length} Verified Riders
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
          <div style={{ display:"flex", gap:6 }}>
            <span style={{ background:"rgba(76,175,80,.15)", color:"#4CAF50", border:"1px solid #4CAF5044",
              borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>
              🟢 {riders.filter(r=>r.status==="Available").length} Available
            </span>
            <span style={{ background:"rgba(255,87,34,.12)", color:"#FF5722", border:"1px solid #FF572244",
              borderRadius:20, padding:"3px 10px", fontSize:11, fontWeight:700 }}>
              🔴 {riders.filter(r=>r.status==="Busy").length} On Mission
            </span>
          </div>
          <div style={{ fontSize:10, color: apiStatus==="online"?"#4CAF50":"#666" }}>
            {apiStatus==="online" ? "● API LIVE" : "● DEMO MODE"}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:0, borderBottom:"1px solid #222", background:"#0d0d14", padding:"0 28px" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{ padding:"13px 20px", background:"none", border:"none",
              borderBottom: tab===t.id ? "2px solid #c0392b" : "2px solid transparent",
              color: tab===t.id ? "#fff" : "#555", fontWeight: tab===t.id ? 700 : 400,
              fontSize:13, cursor:"pointer", transition:"all .2s" }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding:"24px 28px", maxWidth:1280, margin:"0 auto" }}>

        {/* MAP TAB */}
        {tab === "map" && (
          <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:20, alignItems:"start" }}>
            <div>
              {leafletLoaded
                ? <LiveMap riders={riders} selectedRider={selected} onSelectRider={setSelected} />
                : <div style={{ height:480, background:"#1a1a24", borderRadius:12, display:"flex",
                    alignItems:"center", justifyContent:"center", color:"#444" }}>Loading map…</div>
              }
              <div style={{ color:"#444", fontSize:11, marginTop:8, textAlign:"center" }}>
                Circles show each rider's Quick-Response Zone · Click a rider icon to inspect
              </div>
            </div>
            <div>
              <div style={{ color:"#555", fontSize:11, fontWeight:700, letterSpacing:.5, marginBottom:10 }}>RIDER ROSTER</div>
              <div style={{ maxHeight:480, overflowY:"auto", display:"flex", flexDirection:"column", gap:4 }}>
                {riders.map(r => (
                  <div key={r.rider_id} onClick={()=>setSelected(r)}
                    style={{ background: selected?.rider_id===r.rider_id ? TIER_BG[r.tier] : "#1a1a24",
                      border:`1px solid ${selected?.rider_id===r.rider_id ? TIER_COLORS[r.tier]+"44":"#222"}`,
                      borderRadius:8, padding:"8px 10px", cursor:"pointer",
                      display:"flex", alignItems:"center", gap:8, transition:"all .15s" }}>
                    <div style={{ width:28, height:28, borderRadius:"50%", background: TIER_COLORS[r.tier],
                      color:"#111", fontWeight:800, fontSize:10, display:"flex", alignItems:"center",
                      justifyContent:"center", flexShrink:0, opacity: r.status==="Busy" ? .5:1 }}>
                      {r.avatar}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontWeight:700, fontSize:12, color:"#ddd", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{r.name}</div>
                      <div style={{ fontSize:10, color:"#555" }}>{r.service_radius_km}km · {r.total_deliveries} del.</div>
                    </div>
                    <StatusDot status={r.status} />
                  </div>
                ))}
              </div>
              {selected && <RiderCard rider={selected} onRate={setRate} />}
            </div>
          </div>
        )}

        {/* LEADERBOARD TAB */}
        {tab === "board" && (
          <Leaderboard riders={riders} onSelectRider={r=>{setSelected(r);setTab("map");}} onRate={setRate} />
        )}

        {/* DASHBOARD TAB */}
        {tab === "dashboard" && <Dashboard riders={riders} />}
      </div>

      {/* Algorithm Footer */}
      <div style={{ borderTop:"1px solid #1a1a24", padding:"14px 28px",
        display:"flex", alignItems:"center", justifyContent:"center", gap:8 }}>
        <span style={{ color:"#333", fontSize:10 }}>REPUTATION ALGORITHM:</span>
        <span style={{ color:"#444", fontSize:10 }}>
          Score = (Deliveries × 0.40) + (Stars × 12.0) + (Speed × 0.30) + (Engagement × 0.10)
        </span>
        <span style={{ color:"#333", fontSize:10 }}>· Platinum ≥ 160 · Gold ≥ 130 · Silver ≥ 100</span>
      </div>

      {/* Rate Modal */}
      {rateTarget && (
        <RateModal rider={rateTarget} onClose={()=>setRate(null)} onSubmit={handleRateSubmit} />
      )}
    </div>
  );
}
