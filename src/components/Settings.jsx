import { useRef, useState } from "react";
import { WORKOUTS, WORKOUT_KEYS, REST } from "../data/workouts";
import { t, fill } from "../data/strings";
import { THEMES, wkColor, isLightTheme } from "../data/themes";
import { validateWeekdayMap, weekOf, programStart } from "../lib/schedule";
import { storageBytes, exportPayload, importPayload, defaultState } from "../lib/storage";

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
  const [startDate, setStartDate] = useState(todayStr);
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
        <div style={{ marginTop: 16 }}>
          <label style={{ fontSize: 13, color: th.textMuted, display: "block", marginBottom: 6 }}>{t(lang, "setupStartDate")}</label>
          <input type="date" value={startDate} max={todayStr} onChange={e => setStartDate(e.target.value || todayStr)} style={{ background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "9px 10px", fontSize: 15, outline: "none", minHeight: 44 }}/>
          <p style={{ fontSize: 11, color: th.textFaint, margin: "6px 0 0", lineHeight: 1.4 }}>{t(lang, "startDateHint")}</p>
        </div>
        {startDate < todayStr && (
          <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12, fontSize: 13, color: th.textMuted, cursor: "pointer" }}>
            <input type="checkbox" checked={backfill} onChange={e => setBackfill(e.target.checked)} style={{ width: 18, height: 18 }}/>
            {t(lang, "setupBackfill")}
          </label>
        )}
        <button disabled={!valid} onClick={() => dispatch({ type: "SETUP_PROGRAM", weekdayMap: map, week, todayStr, startDate, backfill, now: Date.now() })} style={{ width: "100%", marginTop: 18, padding: "14px 0", background: valid ? accent : th.border, color: isLight ? "#fff" : th.bg, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: valid ? "pointer" : "default" }}>{t(lang, "setupStart")}</button>
      </div>
    </div>
  );
}

export default function Settings({ data, dispatch, lang, setLang, themeId, setTheme, th, todayStr, onExport, onImport, onReset }) {
  const currentWeek = weekOf(todayStr, data.program, data.settings.weekStart);
  const [actualWeek, setActualWeek] = useState(currentWeek);
  const [backfill, setBackfill] = useState(false);
  const [draftMap, setDraftMap] = useState(data.program.weekdayMap);
  const [showWhy, setShowWhy] = useState(false);
  const [importMsg, setImportMsg] = useState(null);
  const fileRef = useRef(null);
  const accent = th.accent || "#00e5ff";

  // E — importing asks explicitly whether to merge or replace before touching anything.
  function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const mode = window.confirm(`${t(lang, "importChoose")}\n\nOK = ${t(lang, "importMerge")}\nCancel = ${t(lang, "importReplace")}`) ? "merge" : "replace";
      const result = importPayload(String(reader.result), data, mode);
      if (!result.ok) { setImportMsg({ ok: false, text: t(lang, "importFailed") }); return; }
      onImport(result.state);
      setImportMsg({ ok: true, text: result.stats.replaced ? t(lang, "importedOk").replace(/\{\w+\}/g, "") : fill(lang, "importedOk", result.stats) });
    };
    reader.readAsText(file);
  }
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

      {/* F.10 + F.2 — progression expectations */}
      <div style={card}>
        <h3 style={h}>{t(lang, "trainingAgeLabel")}</h3>
        <div style={{ display: "flex", gap: 6 }}>
          {["novice", "intermediate", "advanced"].map(v => (
            <button key={v} onClick={() => dispatch({ type: "SET_SETTING", key: "trainingAge", value: v })} style={{ flex: 1, minHeight: 44, borderRadius: 10, cursor: "pointer", fontSize: 12, fontWeight: 600, background: data.settings.trainingAge === v ? (th.accent || "#00e5ff") + "20" : "transparent", color: data.settings.trainingAge === v ? (th.accent || "#00e5ff") : th.textMuted, border: `1px solid ${data.settings.trainingAge === v ? (th.accent || "#00e5ff") + "50" : th.borderLight}` }}>{t(lang, v)}</button>
          ))}
        </div>
        <p style={{ fontSize: 11, color: th.textFaint, margin: "8px 0 0", lineHeight: 1.4 }}>{t(lang, "trainingAgeHint")}</p>
        <label style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0 0", marginTop: 10, borderTop: `1px solid ${th.border}`, fontSize: 14, color: th.text, cursor: "pointer" }}>
          {t(lang, "logRirLabel")}
          <input type="checkbox" checked={data.settings.logRir !== false} onChange={e => dispatch({ type: "SET_SETTING", key: "logRir", value: e.target.checked })} style={{ width: 20, height: 20 }}/>
        </label>
      </div>

      {/* session & timers */}
      <div style={card}>
        <h3 style={h}>{t(lang, "timersSection")}</h3>
        {[["sound", "soundOn"], ["autoRest", "autoRest"], ["wakeLock", "keepAwake"]].map(([key, label]) => (
          <label key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", fontSize: 14, color: th.text, cursor: "pointer", borderBottom: key !== "wakeLock" ? `1px solid ${th.border}` : "none" }}>
            {t(lang, label)}
            <input type="checkbox" checked={!!data.settings[key]} onChange={e => dispatch({ type: "SET_SETTING", key, value: e.target.checked })} style={{ width: 20, height: 20 }}/>
          </label>
        ))}
      </div>

      {/* appearance: theme + language now live here, not in the header */}
      <div style={card}>
        <h3 style={h}>{t(lang, "appearance")}</h3>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
          {Object.values(THEMES).map(tm => (
            <button key={tm.id} onClick={() => setTheme(tm.id)} style={{ flex: 1, minWidth: 58, padding: "10px 4px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: themeId === tm.id ? (tm.accent || "#00e5ff") + "20" : tm.card, border: themeId === tm.id ? `2px solid ${tm.accent || "#00e5ff"}` : `1px solid ${tm.border}`, color: themeId === tm.id ? (tm.accent || "#00e5ff") : tm.text, fontSize: 11, fontWeight: 600, minHeight: 44 }}>
              {lang === "ar" ? tm.labelAr : tm.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          {[["en", "English"], ["ar", "العربية"]].map(([code, label]) => (
            <button key={code} onClick={() => setLang(code)} style={{ flex: 1, minHeight: 44, borderRadius: 10, cursor: "pointer", fontSize: 13, fontWeight: 600, background: lang === code ? accent + "20" : "transparent", color: lang === code ? accent : th.textMuted, border: `1px solid ${lang === code ? accent + "50" : th.borderLight}` }}>{label}</button>
          ))}
        </div>
      </div>

      {/* how much space the data is using */}
      <div style={card}>
        <h3 style={h}>{t(lang, "storageUsed")}</h3>
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 22, fontWeight: 700, color: th.text }}>{(storageBytes(window.localStorage) / 1024).toFixed(0)} KB</span>
          <span style={{ fontSize: 12, color: th.textFaint }}>{t(lang, "storageOf")}</span>
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

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${th.border}` }}>
          <label style={{ fontSize: 13, color: th.textMuted, display: "block", marginBottom: 6 }}>{t(lang, "startDateLabel")}</label>
          <input type="date" value={programStart(data.program) || todayStr} max={todayStr}
            onChange={e => e.target.value && dispatch({ type: "SET_START_DATE", date: e.target.value })}
            style={{ background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, outline: "none", minHeight: 44 }}/>
          <p style={{ fontSize: 11, color: th.textFaint, margin: "6px 0 0", lineHeight: 1.4 }}>{t(lang, "startDateHint")}</p>
        </div>
      </div>

      {/* recovery advice text used when fatigue is low */}
      <div style={card}>
        <h3 style={h}>{t(lang, "fatigueAdviceLabel")}</h3>
        <input type="text" placeholder={t(lang, "fatigueAdvicePlaceholder")}
          value={data.settings.fatigueAdviceText?.[lang] || ""}
          onChange={e => dispatch({ type: "SET_SETTING", key: "fatigueAdviceText", value: { ...data.settings.fatigueAdviceText, [lang]: e.target.value } })}
          style={{ width: "100%", background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, outline: "none", boxSizing: "border-box" }}/>
        <h3 style={{ ...h, marginTop: 16 }}>{t(lang, "muscleBandLabel")}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {["min", "max"].map(k => (
            <input key={k} type="number" inputMode="numeric" value={data.settings.muscleBand?.[k] ?? (k === "min" ? 10 : 20)}
              onChange={e => dispatch({ type: "SET_SETTING", key: "muscleBand", value: { ...data.settings.muscleBand, [k]: Math.max(1, parseInt(e.target.value) || 1) } })}
              style={{ width: 70, background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "9px 10px", fontSize: 14, textAlign: "center", outline: "none" }}/>
          ))}
          <span style={{ fontSize: 12, color: th.textFaint }}>{t(lang, "setsLabel")}</span>
        </div>
      </div>

      {/* data & backup */}
      <div style={card}>
        <h3 style={h}>{t(lang, "dataSection")}</h3>
        <button onClick={onExport} style={{ width: "100%", minHeight: 46, borderRadius: 10, border: `1px solid ${th.borderLight}`, background: "transparent", color: th.text, fontSize: 14, fontWeight: 600, cursor: "pointer", marginBottom: 8 }}>{t(lang, "exportData")}</button>
        <button onClick={() => fileRef.current?.click()} style={{ width: "100%", minHeight: 46, borderRadius: 10, border: `1px solid ${th.borderLight}`, background: "transparent", color: th.text, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{t(lang, "importData")}</button>
        <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={onFile}/>
        {importMsg && <p style={{ fontSize: 12, color: importMsg.ok ? accent : "#ff5252", margin: "10px 0 0", lineHeight: 1.4 }}>{importMsg.text}</p>}
        <button onClick={onReset} style={{ width: "100%", minHeight: 46, borderRadius: 10, border: "1px solid #ff525240", background: "#ff525212", color: "#ff5252", fontSize: 14, fontWeight: 600, cursor: "pointer", marginTop: 14 }}>{t(lang, "resetAll")}</button>
      </div>

      {/* F.15 — where the defaults come from, so they are auditable */}
      <div style={card}>
        <button onClick={() => setShowWhy(!showWhy)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "transparent", border: "none", color: th.text, fontSize: 15, fontWeight: 700, cursor: "pointer", padding: 0, minHeight: 32 }}>
          {t(lang, "whyTitle")}
          <span style={{ color: th.textMuted, fontSize: 12, transform: showWhy ? "rotate(180deg)" : "none" }}>▼</span>
        </button>
        {showWhy && (
          <div style={{ marginTop: 12 }}>
            {[["infoReps", "infoRepsNote", "https://pubmed.ncbi.nlm.nih.gov/38286426/"],
              ["infoVolume", "infoVolumeNote", "https://link.springer.com/article/10.1007/s40279-025-02344-w"],
              ["infoLever", "infoLeverNote", "https://www.strongerbyscience.com/progressive-overload-strategies/"],
              ["infoGuard", "infoGuardNote", null]].map(([body, note, url]) => (
              <div key={body} style={{ paddingBottom: 12, marginBottom: 12, borderBottom: `1px solid ${th.border}` }}>
                <p style={{ margin: 0, fontSize: 12.5, color: th.text, lineHeight: 1.5 }}>{t(lang, body)}</p>
                {url ? (
                  <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, color: accent, textDecoration: "none" }}>{t(lang, note)} ↗</a>
                ) : (
                  <span style={{ fontSize: 11, color: th.textFaint }}>{t(lang, note)}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
