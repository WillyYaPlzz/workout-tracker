import { useEffect, useRef, useState } from "react";
import { THEMES } from "./data/themes";
import { LANG, t } from "./data/strings";
import { logicalDate } from "./lib/dates";
import { exportPayload } from "./lib/storage";
import { useAppState } from "./hooks/useAppState";
import DayView from "./components/DayView";
import Dashboard from "./components/Dashboard";
import Settings, { Setup } from "./components/Settings";

export default function WorkoutTracker() {
  const [data, dispatch, storage] = useAppState();
  const [themeId, setThemeId] = useState(() => {
    try { const v = localStorage.getItem("wt-theme"); return v && THEMES[v] ? v : "dark"; } catch { return "dark"; }
  });
  const [lang, setLang] = useState(() => {
    try { const v = localStorage.getItem("wt-lang"); return v === "en" || v === "ar" ? v : "en"; } catch { return "en"; }
  });
  const [view, setView] = useState("workout");
  const [showTP, setShowTP] = useState(false);
  const [todayStr, setTodayStr] = useState(() => logicalDate(new Date(), 4));
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Keep the logical "today" fresh (rollover hour, app left open across midnight).
  useEffect(() => {
    const tick = () => setTodayStr(logicalDate(new Date(), data.settings.rolloverHour));
    tick();
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, [data.settings.rolloverHour]);

  // When "today" flips while the user is viewing it, follow along.
  const prevToday = useRef(todayStr);
  useEffect(() => {
    if (selectedDate === prevToday.current) setSelectedDate(todayStr);
    prevToday.current = todayStr;
  }, [todayStr]); // eslint-disable-line react-hooks/exhaustive-deps

  const th = THEMES[themeId] || THEMES.dark;
  const isRtl = lang === "ar";

  function toggleLang() {
    const n = lang === "en" ? "ar" : "en";
    setLang(n);
    try { localStorage.setItem("wt-lang", n); } catch {}
  }
  function setTheme(id) {
    setThemeId(id);
    setShowTP(false);
    try { localStorage.setItem("wt-theme", id); } catch {}
  }

  const needsSetup = !data.program;

  // A failed write is never silent: it takes over the top of the screen and
  // offers the one thing that actually rescues the data — a backup file.
  function downloadBackup() {
    try {
      const blob = new Blob([exportPayload(data)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `workout-backup-${todayStr}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {}
  }

  return (
    <div dir={LANG[lang].dir} style={{ background: th.bg, color: th.text, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: 80 }}>
      <div style={{ minHeight: 24 }}/>
      {storage.saveError && (
        <div style={{ position: "sticky", top: 0, zIndex: 700, background: "#ff5252", color: "#fff", padding: "10px 16px calc(10px)", marginBottom: 8 }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>
              ⚠ {t(lang, storage.saveError.reason === "quota" ? "saveFailedQuota" : "saveFailedBlocked")}
            </div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.95, lineHeight: 1.4 }}>{t(lang, "saveFailedHint")}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <button onClick={downloadBackup} style={{ background: "#fff", color: "#ff5252", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", minHeight: 40 }}>{t(lang, "downloadBackup")}</button>
              <button onClick={storage.retrySave} style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 8, padding: "9px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", minHeight: 40 }}>{t(lang, "retrySave")}</button>
            </div>
          </div>
        </div>
      )}
      <div style={{ padding: "16px 16px 0", maxWidth: 600, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 8 }}>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700 }}>{t(lang, "title")}</h1>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <button onClick={() => setShowTP(!showTP)} style={{ background: th.border, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "6px 8px", fontSize: 14, cursor: "pointer", lineHeight: 1, minHeight: 32 }}>🎨</button>
            <button onClick={toggleLang} style={{ background: th.border, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "6px 10px", fontSize: 12, cursor: "pointer", fontWeight: 700, minHeight: 32 }}>{lang === "en" ? "عربي" : "EN"}</button>
            {!needsSetup && ["workout", "dashboard", "settings"].map(v => (
              <button key={v} onClick={() => setView(v)} style={{ background: view === v ? th.border : "transparent", color: view === v ? th.text : th.textMuted, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "6px 10px", fontSize: 13, cursor: "pointer", fontWeight: 500, minHeight: 32 }}>
                {v === "workout" ? t(lang, "workout") : v === "dashboard" ? t(lang, "dashboard") : "⚙︎"}
              </button>
            ))}
          </div>
        </div>
        {showTP && (
          <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
            {Object.values(THEMES).map(tm => (
              <button key={tm.id} onClick={() => setTheme(tm.id)} style={{ flex: 1, minWidth: 55, padding: "10px 4px", borderRadius: 10, cursor: "pointer", textAlign: "center", background: themeId === tm.id ? (tm.accent || "#00e5ff") + "20" : tm.card, border: themeId === tm.id ? `2px solid ${tm.accent || "#00e5ff"}` : `1px solid ${tm.border}`, color: themeId === tm.id ? (tm.accent || "#00e5ff") : tm.text, fontSize: 11, fontWeight: 600 }}>
                {lang === "ar" ? tm.labelAr : tm.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {needsSetup ? (
        <Setup dispatch={dispatch} lang={lang} themeId={themeId} th={th} todayStr={todayStr}/>
      ) : view === "workout" ? (
        <DayView data={data} dispatch={dispatch} lang={lang} themeId={themeId} th={th} todayStr={todayStr} selectedDate={selectedDate} setSelectedDate={setSelectedDate} gotoSettings={() => setView("settings")}/>
      ) : view === "dashboard" ? (
        <Dashboard data={data} lang={lang} themeId={themeId} th={th} todayStr={todayStr}/>
      ) : (
        <Settings data={data} dispatch={dispatch} lang={lang} themeId={themeId} th={th} todayStr={todayStr}/>
      )}

      <div style={{ textAlign: "center", padding: "40px 16px 20px", maxWidth: 600, margin: "0 auto" }}>
        <p style={{ fontSize: 13, color: th.textFaint, fontWeight: 500 }}>For my LOVLY Leen❤️ @ 2026</p>
      </div>
    </div>
  );
}
