import { useCallback, useEffect, useRef, useState } from "react";
import { THEMES, isLightTheme } from "./data/themes";
import { LANG, t, fill } from "./data/strings";
import { logicalDate } from "./lib/dates";
import { exportPayload } from "./lib/storage";
import { currentWeek, weeksDone } from "./lib/stats";
import { pickGreeting } from "./lib/greeting";
import { GREETINGS } from "./data/messages";
import { Popup } from "./components/ui";
import { useAppState } from "./hooks/useAppState";
import DayView from "./components/DayView";
import Dashboard from "./components/Dashboard";
import Plan from "./components/Plan";
import Guide from "./components/Guide";
import Settings, { Setup } from "./components/Settings";

const TABS = [
  { id: "workout", labelKey: "workout", icon: <path d="M4 9h2v6H4zM7 7h2v10H7zM15 7h2v10h-2zM18 9h2v6h-2zM10 11h4v2h-4z"/> },
  { id: "dashboard", labelKey: "dashboard", icon: <path d="M4 13h4v7H4zM10 4h4v16h-4zM16 9h4v11h-4z"/> },
  { id: "plan", labelKey: "planTab", icon: <path d="M5 4h11a2 2 0 012 2v13a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2zm2 4v2h7V8H7zm0 4v2h7v-2H7zm0 4v2h4v-2H7z"/> },
  { id: "settings", labelKey: "settings", icon: <path d="M12 8a4 4 0 100 8 4 4 0 000-8zm0 6a2 2 0 110-4 2 2 0 010 4zm8.4-2a6.5 6.5 0 00-.1-1l1.7-1.3-1.8-3.1-2 .8a6.6 6.6 0 00-1.7-1l-.3-2.1H10.8l-.3 2.1a6.6 6.6 0 00-1.7 1l-2-.8L5 10l1.7 1.3a6.5 6.5 0 000 2L5 14.6l1.8 3.1 2-.8c.5.4 1.1.8 1.7 1l.3 2.1h3.4l.3-2.1c.6-.2 1.2-.6 1.7-1l2 .8 1.8-3.1-1.7-1.3c.1-.3.1-.7.1-1z"/> },
];

export default function WorkoutTracker() {
  const [data, dispatch, storage] = useAppState();
  const [themeId, setThemeId] = useState(() => {
    try { const v = localStorage.getItem("wt-theme"); return v && THEMES[v] ? v : "dark"; } catch { return "dark"; }
  });
  const [lang, setLangState] = useState(() => {
    try { const v = localStorage.getItem("wt-lang"); return v === "en" || v === "ar" ? v : "en"; } catch { return "en"; }
  });
  const [view, setView] = useState("workout");
  const [todayStr, setTodayStr] = useState(() => logicalDate(new Date(), 4));
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [nudgeWeek, setNudgeWeek] = useState(null);
  const [greeting, setGreeting] = useState(null);

  useEffect(() => {
    const tick = () => setTodayStr(logicalDate(new Date(), data.settings.rolloverHour));
    tick();
    const id = setInterval(tick, 60 * 1000);
    return () => clearInterval(id);
  }, [data.settings.rolloverHour]);

  const prevToday = useRef(todayStr);
  useEffect(() => {
    if (selectedDate === prevToday.current) setSelectedDate(todayStr);
    prevToday.current = todayStr;
  }, [todayStr]); // eslint-disable-line react-hooks/exhaustive-deps

  const th = THEMES[themeId] || THEMES.dark;
  const isLight = isLightTheme(themeId);
  const accent = th.accent || "#00e5ff";

  const setLang = useCallback(n => {
    setLangState(n);
    try { localStorage.setItem("wt-lang", n); } catch {}
  }, []);
  const setTheme = useCallback(id => {
    setThemeId(id);
    try { localStorage.setItem("wt-theme", id); } catch {}
  }, []);

  const needsSetup = !data.program;

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

  // E — a gentle nudge to back up, once, each time a week closes.
  const week = needsSetup ? 1 : currentWeek(data, todayStr);
  const done = needsSetup ? 0 : weeksDone(data, todayStr);
  useEffect(() => {
    if (needsSetup) return;
    const last = data.meta.lastBackupNudgeWeek ?? 0;
    if (done > 0 && done > last) {
      setNudgeWeek(done);
      dispatch({ type: "SET_META", key: "lastBackupNudgeWeek", value: done });
    }
  }, [done, needsSetup, data.meta.lastBackupNudgeWeek, dispatch]);

  // Greet once a day, the first time the app is opened. The completion popup
  // lives in DayView and only fires on finishing a workout, so the two never
  // land together.
  useEffect(() => {
    if (needsSetup) return;
    const g = pickGreeting({
      now: new Date(),
      rolloverHour: data.settings.rolloverHour,
      lastGreetedDate: data.meta.lastGreetedDate ?? null,
      index: data.meta.greetIndex ?? 0,
      greetings: GREETINGS,
    });
    if (!g.show) return;
    setGreeting(g.message);
    dispatch({ type: "SET_META", key: "lastGreetedDate", value: g.date });
    dispatch({ type: "SET_META", key: "greetIndex", value: (data.meta.greetIndex ?? 0) + 1 });
  }, [needsSetup]);   // eslint-disable-line react-hooks/exhaustive-deps

  function openDay(date) {
    setSelectedDate(date);
    setView("workout");
  }

  const TAB_H = 56;

  return (
    <div dir={LANG[lang].dir} style={{ background: th.bg, color: th.text, minHeight: "100vh", fontFamily: "'Inter', system-ui, sans-serif", paddingBottom: needsSetup ? 40 : `calc(${TAB_H}px + env(safe-area-inset-bottom) + 12px)` }}>
      {greeting && <Popup message={greeting} onClose={() => setGreeting(null)} lang={lang} dir={/^[A-Za-z]/.test(greeting) ? "ltr" : "rtl"}/>}

      {/* a failed write takes over the top of the screen until it is resolved */}
      {storage.saveError && (
        <div style={{ position: "sticky", top: 0, zIndex: 700, background: "#ff5252", color: "#fff", padding: "10px 16px" }}>
          <div style={{ maxWidth: 600, margin: "0 auto" }}>
            <div style={{ fontSize: 13, fontWeight: 700 }}>⚠ {t(lang, storage.saveError.reason === "quota" ? "saveFailedQuota" : "saveFailedBlocked")}</div>
            <div style={{ fontSize: 12, marginTop: 4, opacity: 0.95, lineHeight: 1.4 }}>{t(lang, "saveFailedHint")}</div>
            <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
              <button onClick={downloadBackup} style={{ background: "#fff", color: "#ff5252", border: "none", borderRadius: 8, padding: "9px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", minHeight: 40 }}>{t(lang, "downloadBackup")}</button>
              <button onClick={storage.retrySave} style={{ background: "transparent", color: "#fff", border: "1px solid rgba(255,255,255,0.6)", borderRadius: 8, padding: "9px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer", minHeight: 40 }}>{t(lang, "retrySave")}</button>
            </div>
          </div>
        </div>
      )}

      {/* iOS-style large title */}
      <div style={{ padding: "calc(env(safe-area-inset-top) + 18px) 16px 12px", maxWidth: 600, margin: "0 auto" }}>
        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, letterSpacing: -0.5 }}>
          {needsSetup ? t(lang, "title")
            : view === "workout" ? t(lang, "title")
            : view === "dashboard" ? t(lang, "dashboard")
            : view === "plan" ? t(lang, "planTitle")
            : view === "guide" ? t(lang, "guideTitle")
            : t(lang, "settings")}
        </h1>
      </div>

      {/* backup nudge on a completed week */}
      {nudgeWeek && !needsSetup && (
        <div style={{ maxWidth: 600, margin: "0 auto 10px", padding: "0 16px" }}>
          <div style={{ background: accent + "12", border: `1px solid ${accent}35`, borderRadius: 12, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ flex: 1, fontSize: 12, color: th.text }}>{fill(lang, "backupNudge", { w: nudgeWeek })}</span>
            <button onClick={() => { downloadBackup(); setNudgeWeek(null); }} style={{ background: accent, color: isLight ? "#fff" : th.bg, border: "none", borderRadius: 8, padding: "8px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{t(lang, "exportData")}</button>
            <button onClick={() => setNudgeWeek(null)} style={{ background: "transparent", color: th.textMuted, border: "none", fontSize: 16, cursor: "pointer", padding: "0 4px" }}>✕</button>
          </div>
        </div>
      )}

      {needsSetup ? (
        <Setup dispatch={dispatch} lang={lang} themeId={themeId} th={th} todayStr={todayStr}/>
      ) : view === "workout" ? (
        <DayView data={data} dispatch={dispatch} lang={lang} themeId={themeId} th={th} todayStr={todayStr} selectedDate={selectedDate} setSelectedDate={setSelectedDate} gotoSettings={() => setView("settings")}/>
      ) : view === "dashboard" ? (
        <Dashboard data={data} dispatch={dispatch} lang={lang} themeId={themeId} th={th} todayStr={todayStr} onOpenDay={openDay}/>
      ) : view === "plan" ? (
        <Plan data={data} lang={lang} themeId={themeId} th={th} todayStr={todayStr}/>
      ) : view === "guide" ? (
        <Guide lang={lang} th={th} themeId={themeId} onBack={() => setView("settings")}/>
      ) : (
        <Settings data={data} dispatch={dispatch} lang={lang} setLang={setLang} themeId={themeId} setTheme={setTheme} th={th} todayStr={todayStr}
          onOpenGuide={() => setView("guide")}
          onExport={downloadBackup}
          onImport={state => dispatch({ type: "REPLACE_STATE", state })}
          onReset={() => {
            if (!window.confirm(t(lang, "resetConfirm1"))) return;
            if (!window.confirm(t(lang, "resetConfirm2"))) return;
            dispatch({ type: "RESET_ALL" });
            setView("workout");
          }}/>
      )}

      <div style={{ textAlign: "center", padding: "30px 16px 16px", maxWidth: 600, margin: "0 auto" }}>
        <p style={{ fontSize: 13, color: th.textFaint, fontWeight: 500 }}>For my LOVLY Leen❤️ @ 2026</p>
      </div>

      {/* iOS-style bottom tab bar */}
      {!needsSetup && (
        <nav style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 750,
          background: isLight ? "rgba(255,255,255,0.88)" : th.card + "e6",
          backdropFilter: "saturate(180%) blur(20px)", WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderTop: `1px solid ${th.border}`, paddingBottom: "env(safe-area-inset-bottom)" }}>
          <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", height: TAB_H }}>
            {TABS.map(tab => {
              const active = view === tab.id || (tab.id === "settings" && view === "guide");
              return (
                <button key={tab.id} onClick={() => setView(tab.id)} style={{
                  flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
                  background: "transparent", border: "none", cursor: "pointer", padding: 0,
                  color: active ? accent : th.textMuted, WebkitTapHighlightColor: "transparent",
                }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">{tab.icon}</svg>
                  <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{t(lang, tab.labelKey)}</span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}
