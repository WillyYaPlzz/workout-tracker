import { useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { WORKOUTS, WORKOUT_KEYS } from "../data/workouts";
import { t } from "../data/strings";
import { wkColor } from "../data/themes";
import { addDays } from "../lib/dates";
import { CTooltip } from "./ui";

const TIME_RANGES = [{ label: "1W", days: 7 }, { label: "1M", days: 30 }, { label: "3M", days: 90 }, { label: { en: "All", ar: "الكل" }, days: 9999 }];

// Sessions of a workout: day records with that workoutKey and any logged work.
function sessionsOf(data, wk) {
  return Object.entries(data.days)
    .filter(([, d]) => d.workoutKey === wk && d.status !== "skipped")
    .sort(([a], [b]) => (a < b ? -1 : 1));
}

function topWeight(dayEx) {
  if (!dayEx?.work) return 0;
  return Math.max(0, ...dayEx.work.map(s => parseFloat(s.weight) || 0));
}

export default function Dashboard({ data, lang, themeId, th, todayStr }) {
  const [dashWorkout, setDashWorkout] = useState(null);
  const [dashExercise, setDashExercise] = useState(null);
  const [timeRange, setTimeRange] = useState(90);
  const isRtl = lang === "ar";
  const L = o => (typeof o === "string" ? o : o[lang] || o.en);

  function chartData(wk, exId) {
    const cutoff = timeRange >= 9999 ? "0000-00-00" : addDays(todayStr, -timeRange);
    return sessionsOf(data, wk)
      .filter(([date]) => date >= cutoff)
      .map(([date, d]) => {
        const w = topWeight(d.exercises?.[exId]);
        return w > 0 ? { date: date.slice(5), weight: w } : null;
      })
      .filter(Boolean);
  }

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
      {!dashWorkout ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ fontSize: 14, color: th.textMuted, margin: "0 0 4px" }}>{t(lang, "pickWorkout")}</p>
          {WORKOUT_KEYS.map(tb => {
            const wk = WORKOUTS[tb], c2 = wkColor(themeId, tb), ts = sessionsOf(data, tb).length;
            return (
              <button key={tb} onClick={() => { setDashWorkout(tb); setDashExercise(null); }} style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 12, padding: "18px 16px", cursor: "pointer", textAlign: isRtl ? "right" : "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: c2 }}>{tb} — {L(wk.name)}</div>
                  <div style={{ fontSize: 12, color: th.textMuted, marginTop: 4 }}>{L(wk.subtitle)}</div>
                </div>
                <div style={{ textAlign: isRtl ? "left" : "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 700, color: th.text }}>{ts}</div>
                  <div style={{ fontSize: 10, color: th.textFaint }}>{t(lang, "sessions")}</div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
            <button onClick={() => { setDashWorkout(null); setDashExercise(null); }} style={{ background: "none", border: "none", color: th.textMuted, fontSize: 18, cursor: "pointer", padding: "4px 8px" }}>{isRtl ? "→" : "←"}</button>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: wkColor(themeId, dashWorkout) }}>{dashWorkout} — {L(WORKOUTS[dashWorkout].name)}</h2>
          </div>
          <div style={{ display: "flex", gap: 4, marginBottom: 16, background: th.card, borderRadius: 8, padding: 3, border: `1px solid ${th.border}` }}>
            {TIME_RANGES.map(tr => (
              <button key={tr.days} onClick={() => setTimeRange(tr.days)} style={{ flex: 1, padding: "7px 0", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: "pointer", background: timeRange === tr.days ? wkColor(themeId, dashWorkout) + "25" : "transparent", color: timeRange === tr.days ? wkColor(themeId, dashWorkout) : th.textMuted }}>
                {typeof tr.label === "string" ? tr.label : L(tr.label)}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
            <button onClick={() => setDashExercise(null)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${th.borderLight}`, fontSize: 12, cursor: "pointer", fontWeight: 500, background: !dashExercise ? wkColor(themeId, dashWorkout) + "20" : th.card, color: !dashExercise ? wkColor(themeId, dashWorkout) : th.textMuted }}>{t(lang, "all")}</button>
            {WORKOUTS[dashWorkout].exercises.map(ex => (
              <button key={ex.id} onClick={() => setDashExercise(ex.id)} style={{ padding: "6px 12px", borderRadius: 20, border: `1px solid ${th.borderLight}`, fontSize: 12, cursor: "pointer", fontWeight: 500, background: dashExercise === ex.id ? wkColor(themeId, dashWorkout) + "20" : th.card, color: dashExercise === ex.id ? wkColor(themeId, dashWorkout) : th.textMuted }}>{L(ex.name)}</button>
            ))}
          </div>
          {WORKOUTS[dashWorkout].exercises.filter(ex => !dashExercise || dashExercise === ex.id).map(ex => {
            const cd = chartData(dashWorkout, ex.id), mw = cd.length > 0 ? Math.max(...cd.map(d => d.weight)) : 0, c2 = wkColor(themeId, dashWorkout);
            return (
              <div key={ex.id} style={{ background: th.card, borderRadius: 12, padding: 16, marginBottom: 10, border: `1px solid ${th.border}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: th.text }}>{L(ex.name)}</div>
                    <div style={{ fontSize: 11, color: th.textFaint, marginTop: 2 }}>{L(ex.target)}</div>
                  </div>
                  {mw > 0 && (
                    <div style={{ textAlign: isRtl ? "left" : "right" }}>
                      <div style={{ fontSize: 10, color: th.textMuted }}>{t(lang, "best")}</div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: "#ffd700" }}>{mw}<span style={{ fontSize: 11, fontWeight: 400, color: th.textMuted }}> kg</span></div>
                    </div>
                  )}
                </div>
                {cd.length > 0 ? (
                  <div dir="ltr">
                    <ResponsiveContainer width="100%" height={140}>
                      <LineChart data={cd} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                        <XAxis dataKey="date" tick={{ fontSize: 10, fill: th.textFaint }} axisLine={{ stroke: th.border }} tickLine={false}/>
                        <YAxis tick={{ fontSize: 10, fill: th.textFaint }} axisLine={false} tickLine={false} domain={["dataMin - 5", "dataMax + 5"]}/>
                        <Tooltip content={<CTooltip color={c2} maxWeight={mw} lang={lang}/>} cursor={{ stroke: th.borderLight, strokeDasharray: "4 4" }}/>
                        <ReferenceLine y={mw} stroke="#ffd70040" strokeDasharray="3 3"/>
                        <Line type="monotone" dataKey="weight" stroke={c2} strokeWidth={2.5} dot={{ fill: c2, r: 4, strokeWidth: 0 }} activeDot={{ fill: th.text, stroke: c2, strokeWidth: 2, r: 6 }}/>
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div style={{ height: 100, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ fontSize: 12, color: th.textFaint }}>{t(lang, "noData")}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
