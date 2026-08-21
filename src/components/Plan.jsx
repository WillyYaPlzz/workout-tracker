import { useState } from "react";
import { WORKOUTS, WORKOUT_KEYS, WARMUP, COOLDOWN, getExercise } from "../data/workouts";
import { t, fill } from "../data/strings";
import { wkColor } from "../data/themes";
import { exerciseConfig, bestWorkingWeight, getExerciseAdvice } from "../lib/engine";
import { VBtn, SHead } from "./ui";
import { ExerciseHistory } from "./Sheets";

const READY_COLOR = { green: "#3fb950", amber: "#ffab40", grey: "#7d8590" };

// A browsable reference for the whole programme: every workout, every exercise,
// with the numbers the engine actually uses. Tapping one opens its full history.
export default function Plan({ data, lang, themeId, th, todayStr }) {
  const [open, setOpen] = useState({ [WORKOUT_KEYS[0]]: true });
  const [historyExId, setHistoryExId] = useState(null);
  const L = o => (typeof o === "string" ? o : o[lang] || o.en);
  const weekdays = t(lang, "weekdays");
  const exName = exId => { const e = getExercise(exId); return e ? L(e.name) : exId; };

  // Which weekday each workout falls on, straight from the weekday plan.
  const dayOf = key => {
    const entry = Object.entries(data.program?.weekdayMap || {}).find(([, v]) => v === key);
    return entry ? weekdays[Number(entry[0])] : null;
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
      {historyExId && (
        <ExerciseHistory onClose={() => setHistoryExId(null)} th={th} lang={lang}
          color={wkColor(themeId, WORKOUT_KEYS.find(k => WORKOUTS[k].exercises.some(e => e.id === historyExId)))}
          state={data} exId={historyExId} exName={exName(historyExId)} timeline={data.exercises[historyExId]?.timeline}/>
      )}

      <p style={{ fontSize: 13, color: th.textMuted, margin: "0 0 4px" }}>{t(lang, "planIntro")}</p>
      <p style={{ fontSize: 11, color: th.textFaint, margin: "0 0 14px" }}>{t(lang, "tapForHistory")}</p>

      {WORKOUT_KEYS.map(key => {
        const wo = WORKOUTS[key];
        const color = wkColor(themeId, key);
        const day = dayOf(key);
        const isOpen = open[key] ?? false;
        return (
          <div key={key} style={{ marginBottom: 10 }}>
            <button onClick={() => setOpen(p => ({ ...p, [key]: !isOpen }))} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: th.card, border: `1px solid ${th.border}`, borderRadius: 12, padding: "14px 14px", cursor: "pointer", textAlign: "start" }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color }}>{key} — {L(wo.name)}</div>
                <div style={{ fontSize: 12, color: th.textMuted, marginTop: 3 }}>{L(wo.subtitle)}</div>
                <div style={{ fontSize: 11, color: th.textFaint, marginTop: 3 }}>
                  {day ? fill(lang, "onDay", { d: day }) : t(lang, "notScheduled")} · {fill(lang, "exercisesCount", { n: wo.exercises.length })}
                </div>
              </div>
              <span style={{ color: th.textMuted, fontSize: 12, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>▼</span>
            </button>

            {isOpen && (
              <div style={{ marginTop: 8 }}>
                {wo.exercises.map((ex, i) => {
                  const cfg = exerciseConfig(data, ex.id);
                  const best = bestWorkingWeight(data, ex.id);
                  const advice = getExerciseAdvice(data, ex.id, { date: todayStr });
                  return (
                    <button key={ex.id} onClick={() => setHistoryExId(ex.id)} style={{ width: "100%", textAlign: "start", background: th.card, border: `1px solid ${th.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 6, cursor: "pointer" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontSize: 11, color: th.textFaint }}>{i + 1}.</span>
                        <span style={{ width: 8, height: 8, borderRadius: "50%", background: READY_COLOR[advice.readiness], flexShrink: 0 }}/>
                        <span style={{ fontSize: 14, fontWeight: 600, color: th.text }}>{L(ex.name)}</span>
                        <VBtn link={ex.links[0]} lang={lang} color={color}/>
                        {best > 0 && (
                          <span style={{ marginInlineStart: "auto", fontSize: 11, color: th.textMuted }}>
                            {t(lang, "bestSoFar")} <b style={{ color: "#ffd700" }}>{best} kg</b>
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: th.textFaint, marginTop: 4 }}>{L(ex.target)}</div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 6 }}>
                        <span style={{ fontSize: 10, color: th.textMuted, background: th.bg, border: `1px solid ${th.border}`, borderRadius: 5, padding: "2px 7px" }}>
                          {fill(lang, "repsRange", { a: cfg.repRangeMin, b: cfg.repRangeMax })}
                        </span>
                        <span style={{ fontSize: 10, color: th.textMuted, background: th.bg, border: `1px solid ${th.border}`, borderRadius: 5, padding: "2px 7px" }}>
                          {fill(lang, "stepKg", { n: cfg.loadIncrement })}
                        </span>
                        {L(ex.options).map(o => (
                          <span key={o} style={{ fontSize: 10, color: th.textFaint, background: th.bg, border: `1px solid ${th.border}`, borderRadius: 5, padding: "2px 7px" }}>{o}</span>
                        ))}
                      </div>
                      <div style={{ fontSize: 10, color: th.textFaint, marginTop: 5 }}>
                        {t(lang, "primary")}: {cfg.muscles.primary.join(", ")}
                        {cfg.muscles.secondary.length > 0 && ` · ${t(lang, "secondary")}: ${cfg.muscles.secondary.join(", ")}`}
                      </div>
                    </button>
                  );
                })}

                {/* the warm-up and cool-down are part of the plan too */}
                {[["warmup", WARMUP[wo.warmupType].items, WARMUP[wo.warmupType].link], ["cooldown", COOLDOWN.items, null]].map(([k, items, link]) => (
                  <div key={k} style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 12, padding: "12px 14px", marginBottom: 6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>{t(lang, k === "warmup" ? "warmup" : "cooldown")}</span>
                      {link && <VBtn link={link} lang={lang} color={color}/>}
                    </div>
                    {L(items).map((item, ii) => (
                      <div key={ii} style={{ fontSize: 11, color: th.textMuted, padding: "2px 0" }}>· {item}</div>
                    ))}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
