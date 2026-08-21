import { t } from "../data/strings";
import { fmtElapsed } from "../lib/timers";

export function BottomSheet({ onClose, th, children }) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 900, display: "flex", alignItems: "flex-end", background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: th.card, borderRadius: "16px 16px 0 0", width: "100%", maxWidth: 600, margin: "0 auto", padding: "8px 16px calc(20px + env(safe-area-inset-bottom))", border: `1px solid ${th.border}`, borderBottom: "none", maxHeight: "80vh", overflowY: "auto" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: th.borderLight, margin: "6px auto 14px" }}/>
        {children}
      </div>
    </div>
  );
}

export function SessionSummary({ onClose, th, lang, color, durationMs, setsDone, note, onNote }) {
  const isLight = th.id === "light" || th.id === "blossom";
  const iBg = isLight ? "#f0e8ed" : th.bg;
  return (
    <BottomSheet onClose={onClose} th={th}>
      <h3 style={{ margin: "0 0 14px", fontSize: 17, fontWeight: 700, color: th.text, textAlign: "center" }}>{t(lang, "summaryTitle")}</h3>
      <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
        {[[t(lang, "duration"), fmtElapsed(durationMs)], [t(lang, "setsDone"), String(setsDone)]].map(([label, value]) => (
          <div key={label} style={{ flex: 1, background: iBg, borderRadius: 12, padding: "14px 10px", textAlign: "center", border: `1px solid ${th.border}` }}>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{value}</div>
            <div style={{ fontSize: 11, color: th.textMuted, marginTop: 4 }}>{label}</div>
          </div>
        ))}
      </div>
      <textarea placeholder={t(lang, "dayNotePlaceholder")} value={note} onChange={e => onNote(e.target.value)} rows={2} style={{ width: "100%", background: iBg, color: th.text, border: `1px solid ${th.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}/>
      <button onClick={onClose} style={{ width: "100%", marginTop: 12, padding: "13px 0", background: color, color: isLight ? "#fff" : th.bg, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{t(lang, "close")}</button>
    </BottomSheet>
  );
}
