import { t, fill } from "../data/strings";
import { stepWeight } from "../lib/timers";
import { checkLoadJump, lastTopWeight } from "../lib/engine";

const READY_COLOR = { green: "#3fb950", amber: "#ffab40", grey: "#7d8590" };

// One loggable set row: tick + weight (with the exercise's own +/- step) + reps
// + optional RIR. Warm-up rows are dashed, muted and removable (F.3).
function SetRow({ s, label, isWU, color, th, iBg, inc, repsPlaceholder, showRir, targetRir, onTick, onField, onRemove }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center", direction: "ltr" }}>
      <button onClick={onTick} style={{ width: 28, height: 28, borderRadius: 8, border: `2px ${isWU ? "dashed" : "solid"} ${s.done ? color : th.borderLight}`, background: s.done ? color : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}>
        {s.done && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, mixBlendMode: "difference" }}>✓</span>}
      </button>
      <span style={{ fontSize: 10, color: isWU ? color : th.textFaint, width: 22, textAlign: "center", flexShrink: 0, fontWeight: isWU ? 700 : 400 }}>{label}</span>
      <button onClick={() => onField("weight", stepWeight(s.weight, inc, -1))} style={{ width: 28, height: 34, borderRadius: 8, border: `1px solid ${th.borderLight}`, background: iBg, color: th.textMuted, fontSize: 15, cursor: "pointer", flexShrink: 0, padding: 0 }}>−</button>
      <div style={{ position: "relative", flex: 1.2, minWidth: 54 }}>
        <input type="number" inputMode="decimal" placeholder="kg" value={s.weight} onChange={e => onField("weight", e.target.value)} style={{ width: "100%", background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "7px 4px", fontSize: 14, outline: "none", boxSizing: "border-box", textAlign: "center" }}/>
      </div>
      <button onClick={() => onField("weight", stepWeight(s.weight, inc, +1))} style={{ width: 28, height: 34, borderRadius: 8, border: `1px solid ${th.borderLight}`, background: iBg, color: th.textMuted, fontSize: 15, cursor: "pointer", flexShrink: 0, padding: 0 }}>+</button>
      <div style={{ position: "relative", flex: 1, minWidth: 46 }}>
        <input type="number" inputMode="numeric" placeholder={repsPlaceholder} value={s.reps} onChange={e => onField("reps", e.target.value)} style={{ width: "100%", background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "7px 4px", fontSize: 14, outline: "none", boxSizing: "border-box", textAlign: "center" }}/>
      </div>
      {/* F.2 — optional RIR per working set; warm-ups never carry one */}
      {showRir && !isWU && (
        <select value={s.rir ?? ""} onChange={e => onField("rir", e.target.value === "" ? null : Number(e.target.value))}
          title={fill("en", "rirTarget", { a: targetRir.min, b: targetRir.max })}
          style={{ width: 50, height: 34, background: iBg, color: s.rir == null ? th.textFaint : (Number(s.rir) < targetRir.min ? "#ffab40" : th.text), border: `1px solid ${th.borderLight}`, borderRadius: 8, fontSize: 12, outline: "none", flexShrink: 0, textAlign: "center", padding: "0 2px" }}>
          <option value="">RIR</option>
          {[0, 1, 2, 3, 4, 5].map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      )}
      {isWU && <button onClick={onRemove} style={{ width: 22, height: 24, border: "none", background: "transparent", color: th.textFaint, fontSize: 13, cursor: "pointer", flexShrink: 0, padding: 0 }}>✕</button>}
    </div>
  );
}

export default function ExerciseCard({
  ex, dEx, index, advice, state, date, color, th, lang, isLight, iBg,
  isOpen, isCurrent, done, cardRef, dispatch, onToggle, onTickSet, onOpenHistory, onOpenStall, onJump,
}) {
  const L = o => (typeof o === "string" ? o : o[lang] || o.en);
  const opts = L(ex.options);
  const link = ex.links[dEx.equipment] || ex.links[0];
  const cfg = advice.config;
  const repsPh = `${cfg.repRangeMin}-${cfg.repRangeMax}`;
  const upd = (field, value) => dispatch({ type: "UPDATE_EX", date, exId: ex.id, field, value, now: Date.now() });
  const notComparable = !!(dEx.substitution && dEx.substitution.trim());

  // F.5 — a set is only logged after a >10% jump is confirmed.
  function tickWork(si, next) {
    if (next && !dEx.jumpConfirmedAt) {
      const check = checkLoadJump(dEx.work[si]?.weight, lastTopWeight(state, ex.id, date));
      if (check.jump) { onJump({ exId: ex.id, si, pct: check.pct, weight: dEx.work[si]?.weight }); return; }
    }
    onTickSet(ex.id, "work", si, next);
  }

  const promptText = () => {
    const p = advice.prompt;
    if (!p) return null;
    if (p.type === "add-load") return fill(lang, "promptAddLoad", { w: p.fromWeight, kg: p.kg });
    if (p.type === "add-rep") return fill(lang, "promptAddRep", { w: p.fromWeight, max: p.repRangeMax });
    if (p.type === "add-set") return t(lang, "promptAddSet");
    return fill(lang, "promptPushEffort", { a: cfg.targetRir.min, b: cfg.targetRir.max });
  };

  return (
    <div ref={cardRef} style={{ background: done ? th.card + "80" : th.card, borderRadius: 12, marginBottom: 8, border: isCurrent ? `2px solid ${color}` : done ? `1px solid ${color}30` : `1px solid ${th.border}`, opacity: done ? 0.7 : 1, overflow: "hidden", boxShadow: isCurrent ? `0 0 0 3px ${color}20` : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, cursor: "pointer" }} onClick={onToggle}>
        <button onClick={e => { e.stopPropagation(); upd("bulkTick", !done); }} style={{ width: 28, height: 28, borderRadius: 8, border: `2px solid ${done ? color : th.borderLight}`, background: done ? color : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {done && <span style={{ color: isLight ? "#fff" : th.bg, fontSize: 14, fontWeight: 700 }}>✓</span>}
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 600, color: done ? th.textMuted : th.text, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
            <span style={{ color: th.textFaint, fontSize: 12 }}>{index + 1}.</span>
            {/* F.13 — one readiness badge per exercise */}
            <span title={t(lang, advice.readiness === "green" ? "readyGreen" : advice.readiness === "amber" ? "readyAmber" : "readyGrey")}
              style={{ width: 9, height: 9, borderRadius: "50%", background: READY_COLOR[advice.readiness], flexShrink: 0 }}/>
            <span onClick={e => { e.stopPropagation(); onOpenHistory(ex.id); }} style={{ textDecoration: "underline", textDecorationStyle: "dotted", textUnderlineOffset: 3, textDecorationColor: th.textFaint }}>{L(ex.name)}</span>
            <a href={link} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-flex", alignItems: "center", gap: 4, background: color + "15", color, border: `1px solid ${color}30`, borderRadius: 6, padding: "3px 8px", fontSize: 11, fontWeight: 600, textDecoration: "none", flexShrink: 0 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill={color}><path d="M8 5v14l11-7z"/></svg>{t(lang, "video")}
            </a>
          </div>
          {!isOpen && dEx.work.some(s => s.done || s.weight) && (
            <div style={{ fontSize: 11, color: th.textFaint, marginTop: 3 }}>
              {dEx.work.filter(s => s.weight || s.done).map(s => `${s.done ? "✓" : ""}${s.weight || "?"}kg×${s.reps || repsPh}`).join(" · ")}
            </div>
          )}
          {isOpen && <div style={{ fontSize: 11, color: th.textFaint, marginTop: 2 }}>{L(ex.target)}</div>}
          {/* status chips */}
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5 }}>
            {notComparable && <span style={{ fontSize: 10, color: th.textMuted, background: th.bg, border: `1px solid ${th.borderLight}`, borderRadius: 5, padding: "1px 6px" }}>{t(lang, "notComparable")}</span>}
            {advice.stalled && (
              <button onClick={e => { e.stopPropagation(); onOpenStall(ex.id); }} style={{ fontSize: 10, fontWeight: 700, color: "#ff5252", background: "#ff525218", border: "1px solid #ff525240", borderRadius: 5, padding: "2px 7px", cursor: "pointer" }}>{t(lang, "stalledChip")} →</button>
            )}
            {advice.effortInflation && <span style={{ fontSize: 10, color: "#ffab40", background: "#ffab4018", border: "1px solid #ffab4040", borderRadius: 5, padding: "1px 6px" }}>{t(lang, "effortDriven")}</span>}
            {advice.flatIsNormal && !advice.stalled && <span style={{ fontSize: 10, color: th.textFaint }}>{t(lang, "flatNormal")}</span>}
          </div>
        </div>
        <span style={{ color: th.textMuted, fontSize: 11, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>▼</span>
      </div>

      {/* F.4 — the overload prompt, or the visible reason it is being held back (F.8/F.11) */}
      {!done && (advice.prompt || advice.suppressed) && (
        <div style={{ margin: "0 14px 10px", background: advice.suppressed ? th.bg : color + "12", border: `1px solid ${advice.suppressed ? th.borderLight : color + "35"}`, borderRadius: 9, padding: "8px 10px", fontSize: 11.5, lineHeight: 1.45, color: advice.suppressed ? th.textMuted : color, fontWeight: advice.suppressed ? 500 : 600, opacity: advice.insistence === "low" && !advice.suppressed ? 0.75 : 1 }}>
          {advice.suppressed ? t(lang, advice.suppressed.reason === "deload" ? "suppressedDeload" : "suppressedFatigue") : promptText()}
        </div>
      )}

      {isOpen && (
        <div style={{ padding: "0 14px 14px" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
            <select value={dEx.equipment} onChange={e => upd("equipment", e.target.value)} style={{ flex: 1, minWidth: 120, background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, outline: "none", direction: "ltr" }}>
              {opts.map((o, oi) => <option key={oi} value={oi}>{o}</option>)}
            </select>
            <div style={{ display: "flex", background: iBg, borderRadius: 8, border: `1px solid ${th.borderLight}`, overflow: "hidden" }}>
              {[2, 3, 4].map(n => (
                <button key={n} onClick={() => upd("sets", n)} style={{ width: 36, height: 34, border: "none", background: dEx.sets === n ? color + "30" : "transparent", color: dEx.sets === n ? color : th.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", borderRight: n < 4 ? `1px solid ${th.borderLight}` : "none" }}>{n}s</button>
              ))}
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {dEx.warmups.map((s, si) => (
              <SetRow key={`wu${si}`} s={s} label={t(lang, "wu")} isWU color={color} th={th} iBg={iBg} inc={cfg.loadIncrement} repsPlaceholder="" showRir={false} targetRir={cfg.targetRir}
                onTick={() => onTickSet(ex.id, "wu", si, !s.done)}
                onField={(prop, v) => upd(`wu-${si}-${prop}`, v)}
                onRemove={() => dispatch({ type: "REMOVE_WU", date, exId: ex.id, si })}/>
            ))}
            {dEx.work.map((s, si) => (
              <SetRow key={si} s={s} label={`S${si + 1}`} color={color} th={th} iBg={iBg} inc={cfg.loadIncrement} repsPlaceholder={repsPh}
                showRir={state.settings.logRir !== false} targetRir={cfg.targetRir}
                onTick={() => tickWork(si, !s.done)}
                onField={(prop, v) => upd(`set-${si}-${prop}`, v)}/>
            ))}
          </div>

          <button onClick={() => dispatch({ type: "ADD_WU", date, exId: ex.id })} style={{ marginTop: 8, background: "transparent", color: th.textMuted, border: `1px dashed ${th.borderLight}`, borderRadius: 8, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>{t(lang, "addWarmupSet")}</button>

          {/* F.1 — a substitution makes the session non-comparable, on purpose and visibly */}
          <input type="text" placeholder={t(lang, "substitutionLabel")} value={dEx.substitution || ""} onChange={e => upd("substitution", e.target.value)} style={{ width: "100%", background: iBg, color: th.text, border: `1px solid ${notComparable ? th.borderLight : th.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, outline: "none", marginTop: 8, boxSizing: "border-box" }}/>
          {notComparable && <p style={{ fontSize: 10, color: th.textFaint, margin: "4px 2px 0", lineHeight: 1.4 }}>{t(lang, "comparableWhy")}</p>}

          <input type="text" placeholder={t(lang, "notes")} value={dEx.notes} onChange={e => upd("notes", e.target.value)} style={{ width: "100%", background: iBg, color: th.text, border: `1px solid ${th.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, outline: "none", marginTop: 8, boxSizing: "border-box" }}/>

          {/* F.7 — per-exercise progression lever, changed deliberately */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: 11, color: th.textMuted }}>{t(lang, "leverLabel")}</span>
            <select value={cfg.progressionLever} onChange={e => { if (window.confirm(t(lang, "leverConfirm"))) dispatch({ type: "SET_LEVER", exId: ex.id, lever: e.target.value, date, now: Date.now() }); }}
              style={{ background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "6px 8px", fontSize: 11, outline: "none" }}>
              <option value="double">{t(lang, "leverDouble")}</option>
              <option value="load">{t(lang, "leverLoad")}</option>
              <option value="reps">{t(lang, "leverReps")}</option>
              <option value="sets">{t(lang, "leverSets")}</option>
              <option value="effort">{t(lang, "leverEffort")}</option>
            </select>
            <span style={{ fontSize: 11, color: th.textMuted }}>{t(lang, "repRangeLabel")}</span>
            <input type="number" inputMode="numeric" value={cfg.repRangeMin} onChange={e => dispatch({ type: "SET_EX_CONFIG", exId: ex.id, patch: { repRangeMin: Math.max(1, parseInt(e.target.value) || 1) } })} style={{ width: 44, background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "6px 4px", fontSize: 11, textAlign: "center", outline: "none" }}/>
            <span style={{ fontSize: 11, color: th.textFaint }}>–</span>
            <input type="number" inputMode="numeric" value={cfg.repRangeMax} onChange={e => dispatch({ type: "SET_EX_CONFIG", exId: ex.id, patch: { repRangeMax: Math.max(1, parseInt(e.target.value) || 1) } })} style={{ width: 44, background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "6px 4px", fontSize: 11, textAlign: "center", outline: "none" }}/>
            <span style={{ fontSize: 11, color: th.textMuted }}>{t(lang, "incrementLabel")}</span>
            <input type="number" inputMode="decimal" step="0.5" value={cfg.loadIncrement} onChange={e => dispatch({ type: "SET_EX_CONFIG", exId: ex.id, patch: { loadIncrement: Math.max(0.5, parseFloat(e.target.value) || 0.5) } })} style={{ width: 52, background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "6px 4px", fontSize: 11, textAlign: "center", outline: "none" }}/>
          </div>
        </div>
      )}
    </div>
  );
}
