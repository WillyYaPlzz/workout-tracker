import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { t, fill } from "../data/strings";
import { fmtElapsed } from "../lib/timers";
import { historyRows, bestWorkingWeight, progressionSeries, stallOptions, exerciseConfig } from "../lib/engine";

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

export function SessionSummary({ onClose, th, lang, color, durationMs, setsDone, note, onNote, prs = [], exName }) {
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
      {prs.length > 0 && (
        <div style={{ background: "#ffd70012", border: "1px solid #ffd70040", borderRadius: 12, padding: "12px 14px", marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#ffd700", marginBottom: 6 }}>⭐ {t(lang, "prsLabel")}</div>
          {prs.map(pr => (
            <div key={pr.exId} style={{ fontSize: 12, color: th.text, padding: "2px 0" }}>
              {exName(pr.exId)} — <b>{pr.weight} kg</b>{pr.previous > 0 ? <span style={{ color: th.textMuted }}> (was {pr.previous})</span> : null}
            </div>
          ))}
        </div>
      )}
      <textarea placeholder={t(lang, "dayNotePlaceholder")} value={note} onChange={e => onNote(e.target.value)} rows={2} style={{ width: "100%", background: iBg, color: th.text, border: `1px solid ${th.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 13, outline: "none", resize: "none", boxSizing: "border-box", fontFamily: "inherit" }}/>
      <button onClick={onClose} style={{ width: "100%", marginTop: 12, padding: "13px 0", background: color, color: isLight ? "#fff" : th.bg, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{t(lang, "close")}</button>
    </BottomSheet>
  );
}

// ---------------------------------------------------------------------------
// Phase 3 sheets: stall menu, exercise history, fatigue check-in, jump confirm
// ---------------------------------------------------------------------------
// F.6 — the three-option stall menu. Whatever is chosen lands on the timeline.
export function StallMenu({ onClose, onPick, th, lang, color, state, exId }) {
  const options = stallOptions(state, exId);
  const label = o => {
    if (o.action === "deload") return fill(lang, "stallDeload", { w: o.weight });
    if (o.action === "rep-range") return fill(lang, "stallRange", { a: o.to[0], b: o.to[1] });
    return t(lang, "stallSwap");
  };
  return (
    <BottomSheet onClose={onClose} th={th}>
      <h3 style={{ margin: "0 0 4px", fontSize: 17, fontWeight: 700, color: th.text }}>{t(lang, "stallTitle")}</h3>
      <p style={{ margin: "0 0 14px", fontSize: 12, color: th.textMuted, lineHeight: 1.5 }}>{t(lang, "stallSub")}</p>
      {options.map(o => (
        <button key={o.action} onClick={() => { onPick(o); onClose(); }} style={{ width: "100%", textAlign: "start", background: "transparent", color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 12, padding: "14px 14px", fontSize: 14, cursor: "pointer", marginBottom: 8, minHeight: 48 }}>
          {label(o)}
        </button>
      ))}
      <button onClick={onClose} style={{ width: "100%", marginTop: 6, padding: "12px 0", background: "transparent", color: th.textMuted, border: "none", fontSize: 13, cursor: "pointer" }}>{t(lang, "cancel")}</button>
    </BottomSheet>
  );
}

// F.5 — the load-jump guard. Confirmable, never blocking.
export function JumpConfirm({ pct, onConfirm, onCancel, th, lang, color }) {
  const isLight = th.id === "light" || th.id === "blossom";
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", padding: 20 }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{ background: th.card, border: `1px solid ${th.borderLight}`, borderRadius: 16, maxWidth: 340, width: "100%", padding: 20 }}>
        <h3 style={{ margin: "0 0 8px", fontSize: 17, fontWeight: 700, color: "#ffab40" }}>{fill(lang, "jumpTitle", { n: pct })}</h3>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: th.textMuted, lineHeight: 1.5 }}>{t(lang, "jumpBody")}</p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "12px 0", background: "transparent", color: th.textMuted, border: `1px solid ${th.borderLight}`, borderRadius: 10, fontSize: 14, cursor: "pointer", minHeight: 44 }}>{t(lang, "cancel")}</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: "12px 0", background: color, color: isLight ? "#fff" : th.bg, border: "none", borderRadius: 10, fontSize: 14, fontWeight: 700, cursor: "pointer", minHeight: 44 }}>{t(lang, "confirm")}</button>
        </div>
      </div>
    </div>
  );
}

// F.11 — weekly recovery check-in; a score of 1-2 holds loads for the week.
export function FatigueCheckin({ week, value, onPick, th, lang, color }) {
  return (
    <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 12, padding: 14, marginBottom: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: th.text, marginBottom: 10 }}>{t(lang, "fatigueTitle")}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {[1, 2, 3, 4, 5].map(v => (
          <button key={v} onClick={() => onPick(v)} style={{ flex: 1, minHeight: 44, borderRadius: 10, cursor: "pointer", fontSize: 15, fontWeight: 700, background: value === v ? color + "25" : "transparent", color: value === v ? color : th.textMuted, border: `1px solid ${value === v ? color + "50" : th.borderLight}` }}>{v}</button>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: th.textFaint }}>
        <span>1 · {t(lang, "fatigueLow")}</span><span>5 · {t(lang, "fatigueHigh")}</span>
      </div>
    </div>
  );
}

// C + F.12 — per-exercise history: every session, honestly flagged, plus the two
// progression charts (top-set weight and Epley e1RM) and the decision timeline.
export function ExerciseHistory({ onClose, th, lang, color, state, exId, exName, timeline }) {
  const [metric, setMetric] = useState("weight");
  const rows = historyRows(state, exId);
  const best = bestWorkingWeight(state, exId);
  const series = progressionSeries(state, exId).map(p => ({ ...p, label: p.date.slice(5) }));
  const cfg = exerciseConfig(state, exId);
  const isE1rm = metric === "e1rm";
  const dataKey = isE1rm ? "e1rm" : "weight";
  const trendKey = isE1rm ? "trendE1rm" : "trendWeight";

  const tlLabel = e => e.type === "stall-action" ? `${t(lang, "tlStallAction")}: ${e.detail?.action}`
    : e.type === "lever-change" ? `${t(lang, "tlLeverChange")}: ${e.detail?.from} → ${e.detail?.to}`
    : `${t(lang, "tlJump")}: +${e.detail?.pct}%`;

  return (
    <BottomSheet onClose={onClose} th={th}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: th.text }}>{exName}</h3>
          <div style={{ fontSize: 11, color: th.textFaint, marginTop: 2 }}>{t(lang, "historyTitle")} · {fill(lang, "rirTarget", { a: cfg.targetRir.min, b: cfg.targetRir.max })}</div>
        </div>
        {best > 0 && (
          <div style={{ textAlign: "end" }}>
            <div style={{ fontSize: 10, color: th.textMuted }}>{t(lang, "bestWorking")}</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#ffd700" }}>{best}<span style={{ fontSize: 11, fontWeight: 400, color: th.textMuted }}> kg</span></div>
          </div>
        )}
      </div>

      {series.length > 0 && (
        <>
          <div style={{ display: "flex", gap: 4, marginBottom: 8, background: th.bg, borderRadius: 8, padding: 3, border: `1px solid ${th.border}` }}>
            {[["weight", t(lang, "topSet")], ["e1rm", t(lang, "e1rmLabel")]].map(([k, lbl]) => (
              <button key={k} onClick={() => setMetric(k)} style={{ flex: 1, padding: "7px 0", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", background: metric === k ? color + "25" : "transparent", color: metric === k ? color : th.textMuted }}>{lbl}</button>
            ))}
          </div>
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={series} margin={{ top: 5, right: 8, bottom: 5, left: -22 }}>
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: th.textFaint }} axisLine={{ stroke: th.border }} tickLine={false}/>
                <YAxis tick={{ fontSize: 10, fill: th.textFaint }} axisLine={false} tickLine={false} domain={["dataMin - 5", "dataMax + 5"]}/>
                <Tooltip contentStyle={{ background: "rgba(0,0,0,0.85)", border: "none", borderRadius: 8, fontSize: 12 }} labelStyle={{ color: "#aaa" }} formatter={v => [`${Math.round(v * 10) / 10} kg`, isE1rm ? "e1RM" : "kg"]}/>
                {/* trend line skips partial sessions entirely */}
                <Line type="monotone" dataKey={trendKey} stroke={color} strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} tooltipType="none"/>
                {/* every session as a point: hollow when the session was partial */}
                <Line type="monotone" dataKey={dataKey} stroke="none" isAnimationActive={false}
                  dot={({ cx, cy, payload }) => (
                    <circle key={payload.date} cx={cx} cy={cy} r={4} fill={payload.partial ? th.card : color} stroke={color} strokeWidth={2}/>
                  )}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
          {isE1rm && <p style={{ fontSize: 10, color: th.textFaint, margin: "2px 0 10px", lineHeight: 1.4 }}>{t(lang, "e1rmNote")}</p>}
        </>
      )}

      {timeline?.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: th.textMuted, margin: "8px 0 6px" }}>{t(lang, "timelineTitle")}</div>
          {timeline.slice().reverse().slice(0, 6).map((e, i) => (
            <div key={i} style={{ fontSize: 11, color: th.textFaint, padding: "3px 0" }}>{e.date} · {tlLabel(e)}</div>
          ))}
        </div>
      )}

      {rows.length === 0 ? (
        <p style={{ fontSize: 13, color: th.textFaint, textAlign: "center", padding: "20px 0" }}>{t(lang, "noHistory")}</p>
      ) : rows.map(r => (
        <div key={r.date} style={{ borderTop: `1px solid ${th.border}`, padding: "10px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: th.text }}>{t(lang, "week")} {r.week} · {r.date.slice(5)}</span>
            {r.partial && <span style={{ fontSize: 10, color: "#ffab40", background: "#ffab4018", border: "1px solid #ffab4040", borderRadius: 5, padding: "1px 6px" }}>{t(lang, "wsShort")} {r.doneSets}/{r.totalSets}</span>}
            {!r.comparable && <span style={{ fontSize: 10, color: th.textMuted, background: th.bg, border: `1px solid ${th.borderLight}`, borderRadius: 5, padding: "1px 6px" }}>{t(lang, "notComparable")}</span>}
            {r.isDeload && <span style={{ fontSize: 10, color: "#b388ff", background: "#b388ff18", border: "1px solid #b388ff40", borderRadius: 5, padding: "1px 6px" }}>{t(lang, "deload")}</span>}
          </div>
          <div style={{ fontSize: 12, color: th.textMuted, direction: "ltr", textAlign: "start" }}>
            {r.sets.map((s, i) => `${s.weight || "?"}×${s.reps || "?"}${s.rir != null ? ` @${s.rir}` : ""}`).join(" · ")}
          </div>
          {r.warmups.length > 0 && (
            <div style={{ fontSize: 11, color: th.textFaint, direction: "ltr", textAlign: "start", marginTop: 2 }}>
              {t(lang, "warmupTag")}: {r.warmups.map(w => `${w.weight || "?"}×${w.reps || "?"}`).join(" · ")}
            </div>
          )}
          {r.substitution && <div style={{ fontSize: 11, color: th.textFaint, marginTop: 2, fontStyle: "italic" }}>“{r.substitution}”</div>}
        </div>
      ))}
      <button onClick={onClose} style={{ width: "100%", marginTop: 14, padding: "13px 0", background: th.bg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{t(lang, "close")}</button>
    </BottomSheet>
  );
}
