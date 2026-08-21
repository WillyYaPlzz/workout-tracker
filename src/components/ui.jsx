import { LANG } from "../data/strings";

export function PixelHeart() {
  const P = "#ff1493", D = "#880055", W = "#fff";
  return (
    <svg width="132" height="120" viewBox="0 0 132 120" style={{ display: "block", margin: "0 auto" }}>
      {[[2,0],[3,0],[7,0],[8,0],[1,1],[2,1],[3,1],[4,1],[6,1],[7,1],[8,1],[9,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[7,2],[8,2],[9,2],[10,2],[0,3],[1,3],[2,3],[3,3],[4,3],[5,3],[6,3],[7,3],[8,3],[9,3],[10,3],[0,4],[1,4],[2,4],[3,4],[4,4],[5,4],[6,4],[7,4],[8,4],[9,4],[10,4],[1,5],[2,5],[3,5],[4,5],[5,5],[6,5],[7,5],[8,5],[9,5],[2,6],[3,6],[4,6],[5,6],[6,6],[7,6],[8,6],[3,7],[4,7],[5,7],[6,7],[7,7],[4,8],[5,8],[6,8],[5,9]].map(([x,y]) => <rect key={`${x}-${y}`} x={x*12} y={y*12} width="12" height="12" fill={P} stroke={D} strokeWidth="0.5"/>)}
      {[[2,2],[1,3],[2,3]].map(([x,y]) => <rect key={`w${x}-${y}`} x={x*12} y={y*12} width="12" height="12" fill={W} stroke={D} strokeWidth="0.5"/>)}
    </svg>
  );
}

export function Popup({ message, onClose, lang }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", padding: 20 }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#ffb6c1", border: "3px solid #880055", borderRadius: 4, maxWidth: 320, width: "100%", boxShadow: "6px 6px 0 #880055" }}>
        <div style={{ background: "#ff69b4", padding: "6px 10px", display: "flex", alignItems: "center", gap: 6, borderBottom: "2px solid #880055" }}>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff1493", border: "1px solid #880055" }}/>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff69b4", border: "1px solid #880055" }}/>
          <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ffb6c1", border: "1px solid #880055" }}/>
          <div style={{ flex: 1, height: 3, background: "#880055", marginLeft: 8, borderRadius: 2 }}/>
        </div>
        <div style={{ padding: "28px 24px 24px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <PixelHeart/>
          <p style={{ fontSize: 20, fontWeight: 700, color: "#880055", marginTop: 20, marginBottom: 24, lineHeight: 1.4, direction: "rtl" }}>{message}</p>
          <button onClick={onClose} style={{ background: "#fff", color: "#880055", border: "2px solid #880055", borderRadius: 2, padding: "8px 40px", fontSize: 15, fontWeight: 700, cursor: "pointer", boxShadow: "3px 3px 0 #880055" }}>{LANG[lang].ok}</button>
        </div>
      </div>
    </div>
  );
}

export function CTooltip({ active, payload, label, color, maxWeight, lang }) {
  if (!active || !payload || !payload.length) return null;
  const v = payload[0].value, m = v === maxWeight;
  return (
    <div style={{ background: "rgba(0,0,0,0.85)", border: `1px solid ${m ? "#ffd700" : "rgba(255,255,255,0.1)"}`, borderRadius: 10, padding: "10px 14px" }}>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: m ? "#ffd700" : color }}>{v} kg</div>
      {m && <div style={{ fontSize: 10, color: "#ffd700", fontWeight: 600, marginTop: 2 }}>⭐ {LANG[lang].personalBest}</div>}
    </div>
  );
}

export function VBtn({ link, lang, color }) {
  if (!link) return null;
  return (
    <a href={link} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 4, background: color + "15", color, border: `1px solid ${color}30`, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill={color}><path d="M8 5v14l11-7z"/></svg>{LANG[lang].video}
    </a>
  );
}

export function SHead({ title, open, toggle, color, th, link, lang, count }) {
  return (
    <button onClick={toggle} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", background: th.card, border: `1px solid ${th.border}`, borderRadius: 10, padding: "12px 14px", cursor: "pointer", marginBottom: open ? 8 : 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ fontSize: 14, fontWeight: 700, color }}>{title}</span>
        {link && <a href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 3, background: color + "15", color, border: `1px solid ${color}30`, borderRadius: 5, padding: "2px 6px", fontSize: 10, fontWeight: 600, textDecoration: "none" }}><svg width="10" height="10" viewBox="0 0 24 24" fill={color}><path d="M8 5v14l11-7z"/></svg>{LANG[lang].video}</a>}
        {count !== undefined && <span style={{ fontSize: 11, color: th.textFaint }}>({count})</span>}
      </div>
      <span style={{ color: th.textMuted, fontSize: 12, transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}>▼</span>
    </button>
  );
}
