import { useState } from "react";
import { WORKOUTS, WORKOUT_KEYS, REST } from "../data/workouts";
import { t } from "../data/strings";
import { wkColor, isLightTheme } from "../data/themes";
import { validateWeekdayMap, weekOf } from "../lib/schedule";

export function WeekdayMapEditor({ map, onChange, lang, themeId, th }) {
  const L = o => (typeof o === "string" ? o : o[lang] || o.en);
  const isLight = isLightTheme(themeId);
  const iBg = isLight ? "#f0e8ed" : th.bg;
  const weekdays = t(lang, "weekdays");
  const valid = validateWeekdayMap(map, WORKOUT_KEYS);
  return (
    <div>
      {weekdays.map((wd, i) => {
        const v = map[i] || REST;
        const c = wkColor(themeId, v);
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={{ fontSize: 13, color: th.textMuted, width: 84, flexShrink: 0 }}>{wd}</span>
            <select value={v} onChange={e => onChange({ ...map, [i]: e.target.value })} style={{ flex: 1, background: iBg, color: c, fontWeight: 600, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "9px 10px", fontSize: 13, outline: "none", minHeight: 44 }}>
              <option value={REST}>{t(lang, "rest")}</option>
              {WORKOUT_KEYS.map(k => <option key={k} value={k}>{k} — {L(WORKOUTS[k].name)}</option>)}
            </select>
          </div>
        );
      })}
      {!valid && <p style={{ fontSize: 12, color: "#ff5252", margin: "8px 0 0" }}>{t(lang, "setupErrDup")}</p>}
    </div>
  );
}

// First-run setup: weekday plan + which week + optional back-fill.
export function Setup({ dispatch, lang, themeId, th, todayStr }) {
  const [map, setMap] = useState({ 0: REST, 1: "UB1", 2: "LB1", 3: REST, 4: "UB2", 5: "LB2", 6: REST });
  const [week, setWeek] = useState(1);
  const [backfill, setBackfill] = useState(false);
  const isLight = isLightTheme(themeId);
  const iBg = isLight ? "#f0e8ed" : th.bg;
  const valid = validateWeekdayMap(map, WORKOUT_KEYS);
  const accent = th.accent || "#00e5ff";
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
      <div style={{ background: th.card, borderRadius: 12, padding: 16, border: `1px solid ${th.border}` }}>
        <h2 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 700, color: th.text }}>{t(lang, "setupTitle")}</h2>
        <p style={{ margin: "0 0 14px", fontSize: 13, color: th.textMuted }}>{t(lang, "setupIntro")}</p>
        <WeekdayMapEditor map={map} onChange={setMap} lang={lang} themeId={themeId} th={th}/>
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, color: th.textMuted, display: "block", marginBottom: 6 }}>{t(lang, "setupWeek")}</label>
          <input type="number" min="1" value={week} onChange={e => setWeek(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: 90, background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "9px 10px", fontSize: 15, outline: "none" }}/>
        </div>
        {week > 1 && (
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13, color: th.textMuted, cursor: "pointer" }}>
            <input type="checkbox" checked={backfill} onChange={e => setBackfill(e.target.checked)} style={{ width: 18, height: 18 }}/>
            {t(lang, "setupBackfill")}
          </label>
        )}
        <button disabled={!valid} onClick={() => dispatch({ type: "SETUP_PROGRAM", weekdayMap: map, week, todayStr, backfill, now: Date.now() })} style={{ width: "100%", marginTop: 18, padding: "14px 0", background: valid ? accent : th.border, color: isLight ? "#fff" : th.bg, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: valid ? "pointer" : "default" }}>{t(lang, "setupStart")}</button>
      </div>
    </div>
  );
}

export default function Settings({ data, dispatch, lang, themeId, th, todayStr }) {
  const currentWeek = weekOf(todayStr, data.program, data.settings.weekStart);
  const [actualWeek, setActualWeek] = useState(currentWeek);
  const [backfill, setBackfill] = useState(false);
  const [draftMap, setDraftMap] = useState(data.program.weekdayMap);
  const isLight = isLightTheme(themeId);
  const iBg = isLight ? "#f0e8ed" : th.bg;

  const card = { background: th.card, borderRadius: 12, padding: 16, border: `1px solid ${th.border}`, marginBottom: 12 };
  const h = { margin: "0 0 12px", fontSize: 15, fontWeight: 700, color: th.text };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
      {/* schedule */}
      <div style={card}>
        <h3 style={h}>{t(lang, "weekdayMap")}</h3>
        <WeekdayMapEditor map={draftMap} onChange={m => { setDraftMap(m); if (validateWeekdayMap(m, WORKOUT_KEYS)) dispatch({ type: "SET_WEEKDAY_MAP", weekdayMap: m }); }} lang={lang} themeId={themeId} th={th}/>
      </div>

      {/* rollover hour */}
      <div style={card}>
        <h3 style={h}>{t(lang, "rolloverHour")}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select value={data.settings.rolloverHour} onChange={e => dispatch({ type: "SET_SETTING", key: "rolloverHour", value: parseInt(e.target.value) })} style={{ background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none", minHeight: 44 }}>
            {[0, 1, 2, 3, 4, 5, 6].map(hr => <option key={hr} value={hr}>{String(hr).padStart(2, "0")}:00</option>)}
          </select>
          <span style={{ fontSize: 12, color: th.textFaint }}>{t(lang, "rolloverHint")}</span>
        </div>
      </div>

      {/* wrong week fix */}
      <div style={card}>
        <h3 style={h}>{t(lang, "fixWeekTitle")}</h3>
        <p style={{ fontSize: 13, color: th.textMuted, margin: "0 0 10px" }}>{t(lang, "currentWeekIs")}: <b style={{ color: th.text }}>{currentWeek}</b></p>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontSize: 13, color: th.textMuted }}>{t(lang, "fixWeekPick")}</span>
          <input type="number" min="1" value={actualWeek} onChange={e => setActualWeek(Math.max(1, parseInt(e.target.value) || 1))} style={{ width: 80, background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, outline: "none" }}/>
          <button disabled={actualWeek === currentWeek} onClick={() => { dispatch({ type: "FIX_WEEK", todayStr, actualWeek, backfill, now: Date.now() }); }} style={{ background: th.card, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "9px 16px", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: actualWeek === currentWeek ? 0.4 : 1, minHeight: 44 }}>{t(lang, "apply")}</button>
        </div>
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 13, color: th.textMuted, cursor: "pointer" }}>
          <input type="checkbox" checked={backfill} onChange={e => setBackfill(e.target.checked)} style={{ width: 18, height: 18 }}/>
          {t(lang, "backfillFix")}
        </label>
      </div>
    </div>
  );
}
