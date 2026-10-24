/* eslint-disable */
import React, { useState } from "react";

// Safe to expose: cloud name and an UNSIGNED preset are not secrets.
// Never put the Cloudinary API secret in frontend code.
const CLOUD_NAME    = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

export default function ProofUpload({ requestId = "UNKNOWN" }) {
  const [photos, setPhotos] = useState([]);
  const [stage,  setStage]  = useState("Pickup");
  const [busy,   setBusy]   = useState(false);
  const [error,  setError]  = useState("");

  const configured = Boolean(CLOUD_NAME && UPLOAD_PRESET);

  const onFile = async (e) => {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    if (!configured) {
      setError("Cloudinary is not configured. Set REACT_APP_CLOUDINARY_CLOUD_NAME and REACT_APP_CLOUDINARY_UPLOAD_PRESET, then restart the app.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError("Choose an image file (JPG, PNG or WebP).");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setError("Image is larger than 8 MB. Choose a smaller photo.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("upload_preset", UPLOAD_PRESET);
      fd.append("folder", "rapidred/delivery-proof");
      fd.append("tags", `rapidred,${requestId},${stage.toLowerCase()}`);
      const res  = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: fd });
      const data = await res.json();
      if (!data.secure_url) throw new Error((data.error && data.error.message) || "Upload failed.");
      const optimized = data.secure_url.replace("/upload/", "/upload/f_auto,q_auto,w_640/");
      setPhotos((p) => [{ url: optimized, stage, time: new Date().toLocaleTimeString() }, ...p]);
    } catch (ex) {
      setError(ex.message || "Upload failed. Check your connection and try again.");
    }
    setBusy(false);
  };

  return (
    <div className="card" style={{ marginTop: 16 }}>
      <div style={{ fontWeight: 800, color: "#fff", marginBottom: 4 }}>Delivery proof</div>
      <div style={{ fontSize: 12, color: "var(--muted)", marginBottom: 12 }}>
        Photograph the sealed blood box so the hospital can verify the handover for request {requestId}.
      </div>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {["Pickup", "Delivery"].map((s) => (
          <button
            key={s}
            onClick={() => setStage(s)}
            style={{
              padding: "6px 14px", borderRadius: 6, cursor: "pointer",
              background: stage === s ? "var(--red)" : "transparent",
              color: stage === s ? "#fff" : "var(--text)",
              border: "1px solid " + (stage === s ? "var(--red)" : "var(--border)"),
              fontFamily: "var(--font)", fontWeight: 700, fontSize: 12,
            }}
          >{s}</button>
        ))}

        <label
          style={{
            padding: "7px 16px", borderRadius: 6, cursor: busy ? "wait" : "pointer",
            background: "var(--blue)", color: "#fff", fontWeight: 700, fontSize: 12,
            fontFamily: "var(--font)", opacity: busy ? 0.6 : 1,
          }}
        >
          {busy ? "Uploading…" : `Upload ${stage.toLowerCase()} photo`}
          <input type="file" accept="image/*" onChange={onFile} disabled={busy} style={{ display: "none" }} />
        </label>
      </div>

      {error && (
        <div role="alert" style={{ marginTop: 10, padding: "8px 12px", borderRadius: 7, background: "rgba(192,57,43,.12)", border: "1px solid #c0392b66", color: "#e74c3c", fontSize: 12 }}>
          {error}
        </div>
      )}

      {photos.length === 0 && !error && (
        <div style={{ marginTop: 12, fontSize: 12, color: "var(--muted)" }}>
          No photos yet. Upload a pickup photo when the rider collects the box.
        </div>
      )}

      {photos.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 10, marginTop: 14 }}>
          {photos.map((p, i) => (
            <a key={i} href={p.url} target="_blank" rel="noreferrer" style={{ textDecoration: "none" }}>
              <img src={p.url} alt={`${p.stage} proof`} style={{ width: "100%", height: 110, objectFit: "cover", borderRadius: 8, border: "1px solid var(--border)" }} />
              <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{p.stage} · {p.time}</div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}