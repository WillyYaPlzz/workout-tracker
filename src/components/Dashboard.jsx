import { useState } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceArea, Cell } from "recharts";
import { WORKOUTS, WORKOUT_KEYS, getExercise } from "../data/workouts";
import { t, fill } from "../data/strings";
import { chartColors, wkColor, isLightTheme } from "../data/themes";
import { fmtElapsed } from "../lib/timers";
import { progressionSeries } from "../lib/engine";
import { setsPerMuscle, muscleWarnings, weekVsLast } from "../lib/volume";
import { streak, adherence, weeksDone, skippedCount, totalGymTimeMs, overallCompletion,
         durationSeries, setsPerWeekSeries, notesTimeline, currentWeek, deloadCycle } from "../lib/stats";
import Heatmap from "./Heatmap";

// D — hero: one number, with a ring as its mark. Not a chart.
function Ring({ pct, color, th, size = 92 }) {
  const r = (size - 12) / 2, C = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={th.border} strokeWidth="7"/>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
        strokeDasharray={C} strokeDashoffset={C * (1 - pct / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`}/>
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fill={th.text} fontSize={size / 4.2} fontWeight="700">{pct}%</text>
    </svg>
  );
}

function Tile({ label, value, sub, th }) {
  return (
    <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 12, padding: "12px 10px", textAlign: "center" }}>
      <div style={{ fontSize: 19, fontWeight: 700, color: th.text, lineHeight: 1.2 }}>{value}</div>
      <div style={{ fontSize: 10, color: th.textMuted, marginTop: 3 }}>{label}</div>
      {sub && <div style={{ fontSize: 9, color: th.textFaint, marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

// D — up/down delta chip against last week.
function Delta({ pct, th, c }) {
  if (pct === null || pct === undefined) return <span style={{ fontSize: 11, color: th.textFaint }}>—</span>;
  const up = pct >= 0;
  return (
    <span style={{ fontSize: 11, fontWeight: 700, color: up ? c.accent : th.textMuted, background: (up ? c.accent : th.textMuted) + "18", borderRadius: 5, padding: "2px 6px" }}>
      {up ? "↑" : "↓"} {Math.abs(pct)}%
    </span>
  );
}

function Section({ title, th, children, right }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: th.textMuted }}>{title}</h3>
        {right}
      </div>
      <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: 14 }}>{children}</div>
    </div>
  );
}

export default function Dashboard({ data, lang, themeId, th, todayStr, onOpenDay }) {
  const c = chartColors(themeId, th);
  const isRtl = lang === "ar";
  const L = o => (typeof o === "string" ? o : o[lang] || o.en);
  const [exPick, setExPick] = useState("ub1-1");
  const [metric, setMetric] = useState("weight");

  const week = currentWeek(data, todayStr);
  const cycle = deloadCycle(data, todayStr);
  const overall = overallCompletion(data, todayStr);
  const adh = adherence(data, todayStr);
  const vs = weekVsLast(data, week);
  const duration = durationSeries(data);
  const setsWeek = setsPerWeekSeries(data, todayStr, 10);
  const muscles = setsPerMuscle(data, week);
  const warnings = muscleWarnings(data, week);
  const notes = notesTimeline(data).slice(0, 8);
  const band = data.settings.muscleBand || { min: 10, max: 20 };

  const muscleRows = Object.entries(muscles).sort((a, b) => b[1] - a[1]).map(([m, sets]) => ({ muscle: m, sets }));
  const maxMuscle = Math.max(band.max + 2, ...muscleRows.map(r => r.sets));
  const series = progressionSeries(data, exPick).map(p => ({ ...p, label: p.date.slice(5) }));
  const tip = { background: "rgba(0,0,0,0.85)", border: "none", borderRadius: 8, fontSize: 12, color: "#fff" };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
      {/* hero */}
      <div style={{ background: th.card, border: `1px solid ${th.border}`, borderRadius: 14, padding: 16, marginBottom: 14, display: "flex", alignItems: "center", gap: 16 }}>
        <Ring pct={overall.pct} color={c.accent} th={th}/>
        <div>
          <div style={{ fontSize: 13, color: th.textMuted }}>{t(lang, "overallDone")}</div>
          <div style={{ fontSize: 15, fontWeight: 700, color: th.text, marginTop: 2 }}>
            {cycle ? fill(lang, "ofWeeks", { w: week, p: cycle.position, e: cycle.every }) : `${t(lang, "week")} ${week}`}
          </div>
          <div style={{ fontSize: 11, color: th.textFaint, marginTop: 3 }}>{overall.closed}/{overall.total} {t(lang, "days")}</div>
        </div>
      </div>

      {/* stat tiles */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
        <Tile label={t(lang, "streakLabel")} value={streak(data, todayStr)} th={th}/>
        <Tile label={t(lang, "adherenceLabel")} value={adh.pct === null ? "—" : `${adh.pct}%`} sub={adh.pct === null ? "" : `${adh.done}/${adh.scheduled}`} th={th}/>
        <Tile label={t(lang, "weeksDoneLabel")} value={weeksDone(data, todayStr)} th={th}/>
        <Tile label={t(lang, "skippedLabel")} value={skippedCount(data)} th={th}/>
        <Tile label={t(lang, "gymTimeLabel")} value={fmtElapsed(totalGymTimeMs(data))} th={th}/>
        <Tile label={t(lang, "setsLabel")} value={vs.cur.sets} sub={`${t(lang, "week")} ${week}`} th={th}/>
      </div>

      {/* this week vs last */}
      <Section title={t(lang, "thisWeekVsLast")} th={th}>
        {!vs.hasPrev ? (
          <p style={{ fontSize: 12, color: th.textFaint, margin: 0, textAlign: "center", padding: "10px 0" }}>{t(lang, "nothingToCompare")}</p>
        ) : (
          [["volumeLabel", vs.cur.volume.toLocaleString(), vs.prev.volume.toLocaleString(), vs.deltas.volume, "kg"],
           ["setsLabel", vs.cur.sets, vs.prev.sets, vs.deltas.sets, ""],
           ["timeLabel", fmtElapsed(vs.cur.timeMs), fmtElapsed(vs.prev.timeMs), vs.deltas.timeMs, ""]].map(([key, cur, prev, d, unit]) => (
            <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "9px 0", borderBottom: key !== "timeLabel" ? `1px solid ${th.border}` : "none" }}>
              <span style={{ fontSize: 13, color: th.textMuted }}>{t(lang, key)}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: th.textFaint }}>{prev}{unit}</span>
                <span style={{ fontSize: 15, fontWeight: 700, color: th.text }}>{cur}{unit}</span>
                <Delta pct={d} th={th} c={c}/>
              </span>
            </div>
          ))
        )}
      </Section>

      {/* heatmap */}
      <Section title={t(lang, "heatmapTitle")} th={th}>
        <Heatmap state={data} todayStr={todayStr} th={th} themeId={themeId} lang={lang} onOpenDay={onOpenDay}/>
      </Section>

      {/* session duration */}
      <Section title={t(lang, "durationTitle")} th={th}>
        {duration.length < 2 ? <p style={{ fontSize: 12, color: th.textFaint, textAlign: "center", margin: "16px 0" }}>{t(lang, "noChartData")}</p> : (
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={130}>
              <LineChart data={duration} margin={{ top: 5, right: 6, bottom: 0, left: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.axis }} axisLine={{ stroke: c.grid }} tickLine={false} minTickGap={18}/>
                <YAxis tick={{ fontSize: 9, fill: c.axis }} axisLine={false} tickLine={false} width={26}/>
                <Tooltip contentStyle={tip} labelStyle={{ color: "#aaa" }} formatter={v => [`${v} ${t(lang, "minutes")}`, ""]}/>
                <Line type="monotone" dataKey="minutes" stroke={c.accent} strokeWidth={2} dot={{ r: 3, fill: c.accent, strokeWidth: 0 }} activeDot={{ r: 6, fill: th.text, stroke: c.accent, strokeWidth: 2 }} isAnimationActive={false}/>
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </Section>

      {/* sets per week */}
      <Section title={t(lang, "setsWeekTitle")} th={th}>
        <div dir="ltr">
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={setsWeek} margin={{ top: 5, right: 6, bottom: 0, left: 0 }} barCategoryGap="18%">
              <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.axis }} axisLine={{ stroke: c.grid }} tickLine={false}/>
              <YAxis tick={{ fontSize: 9, fill: c.axis }} axisLine={false} tickLine={false} width={26}/>
              <Tooltip cursor={{ fill: c.accent + "12" }} contentStyle={tip} labelStyle={{ color: "#aaa" }} formatter={v => [v, t(lang, "setsLabel")]}/>
              <Bar dataKey="sets" fill={c.accent} radius={[4, 4, 0, 0]} maxBarSize={30} isAnimationActive={false}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Section>

      {/* per-exercise progression */}
      <Section title={t(lang, "progressionTitle")} th={th}>
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          <select value={exPick} onChange={e => setExPick(e.target.value)} style={{ flex: 1, minWidth: 150, background: isLightTheme(themeId) ? "#f0e8ed" : th.bg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "8px 10px", fontSize: 12, outline: "none" }}>
            {WORKOUT_KEYS.map(k => (
              <optgroup key={k} label={`${k} — ${L(WORKOUTS[k].name)}`}>
                {WORKOUTS[k].exercises.map(e => <option key={e.id} value={e.id}>{L(e.name)}</option>)}
              </optgroup>
            ))}
          </select>
          <div style={{ display: "flex", gap: 3, background: th.bg, borderRadius: 8, padding: 3, border: `1px solid ${th.border}` }}>
            {[["weight", t(lang, "topSet")], ["e1rm", t(lang, "e1rmLabel")]].map(([k, lbl]) => (
              <button key={k} onClick={() => setMetric(k)} style={{ padding: "6px 10px", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", background: metric === k ? c.accent + "25" : "transparent", color: metric === k ? c.accent : th.textMuted }}>{lbl}</button>
            ))}
          </div>
        </div>
        {series.length === 0 ? <p style={{ fontSize: 12, color: th.textFaint, textAlign: "center", margin: "16px 0" }}>{t(lang, "noChartData")}</p> : (
          <div dir="ltr">
            <ResponsiveContainer width="100%" height={140}>
              <LineChart data={series} margin={{ top: 5, right: 6, bottom: 0, left: 0 }}>
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: c.axis }} axisLine={{ stroke: c.grid }} tickLine={false} minTickGap={18}/>
                <YAxis tick={{ fontSize: 9, fill: c.axis }} axisLine={false} tickLine={false} width={26} domain={["dataMin - 5", "dataMax + 5"]}/>
                <Tooltip contentStyle={tip} labelStyle={{ color: "#aaa" }} formatter={v => [`${Math.round(v * 10) / 10} kg`, metric === "e1rm" ? "e1RM" : "kg"]}/>
                <Line type="monotone" dataKey={metric === "e1rm" ? "trendE1rm" : "trendWeight"} stroke={c.accent} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} tooltipType="none"/>
                <Line type="monotone" dataKey={metric === "e1rm" ? "e1rm" : "weight"} stroke="none" isAnimationActive={false}
                  dot={({ cx, cy, payload }) => <circle key={payload.date} cx={cx} cy={cy} r={4} fill={payload.partial ? th.card : c.accent} stroke={c.accent} strokeWidth={2}/>}/>
              </LineChart>
            </ResponsiveContainer>
            {metric === "e1rm" && <p style={{ fontSize: 10, color: th.textFaint, margin: "4px 0 0", lineHeight: 1.4 }}>{t(lang, "e1rmNote")}</p>}
          </div>
        )}
      </Section>

      {/* sets per muscle vs the target band */}
      <Section title={t(lang, "muscleTitle")} th={th}
        right={<span style={{ fontSize: 10, color: th.textFaint }}>{fill(lang, "bandLabel", { min: band.min, max: band.max })}</span>}>
        {muscleRows.length === 0 ? <p style={{ fontSize: 12, color: th.textFaint, textAlign: "center", margin: "16px 0" }}>{t(lang, "noChartData")}</p> : (
          <>
            <div dir="ltr">
              <ResponsiveContainer width="100%" height={Math.max(120, muscleRows.length * 22)}>
                <BarChart data={muscleRows} layout="vertical" margin={{ top: 0, right: 26, bottom: 0, left: 4 }} barCategoryGap="22%">
                  <XAxis type="number" domain={[0, maxMuscle]} hide/>
                  <YAxis type="category" dataKey="muscle" tick={{ fontSize: 9, fill: c.axis }} axisLine={false} tickLine={false} width={72}/>
                  {/* the target band sits behind the bars as a recessive region */}
                  <ReferenceArea x1={band.min} x2={band.max} fill={c.band} stroke="none"/>
                  <Tooltip cursor={{ fill: c.accent + "10" }} contentStyle={tip} labelStyle={{ color: "#aaa" }} formatter={v => [v, t(lang, "setsLabel")]}/>
                  <Bar dataKey="sets" radius={[0, 4, 4, 0]} isAnimationActive={false} label={{ position: "right", fontSize: 9, fill: th.textMuted }}>
                    {muscleRows.map(r => <Cell key={r.muscle} fill={r.sets < band.min ? c.warn : c.accent}/>)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            {warnings.map((w, i) => (
              <div key={i} style={{ fontSize: 11, color: c.warn, marginTop: 6, lineHeight: 1.4 }}>
                ⚠ {w.type === "under" ? fill(lang, "underStimulated", { m: w.muscle, n: w.sets }) : fill(lang, "volumeJump", { m: w.muscle, p: w.pct })}
              </div>
            ))}
          </>
        )}
      </Section>

      {/* notes timeline */}
      <Section title={t(lang, "notesTitle")} th={th}>
        {notes.length === 0 ? <p style={{ fontSize: 12, color: th.textFaint, textAlign: "center", margin: "10px 0" }}>{t(lang, "noNotes")}</p> :
          notes.map(n => (
            <button key={n.date} onClick={() => onOpenDay(n.date)} style={{ display: "block", width: "100%", textAlign: isRtl ? "right" : "left", background: "transparent", border: "none", borderBottom: `1px solid ${th.border}`, padding: "8px 0", cursor: "pointer" }}>
              <span style={{ fontSize: 10, color: th.textFaint }}>{n.date}</span>
              <div style={{ fontSize: 12, color: n.skipReason ? th.textMuted : th.text, marginTop: 2 }}>
                {n.skipReason ? `${t(lang, "daySkipped")}: ${n.skipReason}` : n.note}
              </div>
            </button>
          ))}
      </Section>
    </div>
  );
}
