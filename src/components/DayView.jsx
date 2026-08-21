import { useEffect, useRef, useState } from "react";
import { WORKOUTS, WARMUP, COOLDOWN } from "../data/workouts";
import { COMPLETION_MESSAGES } from "../data/messages";
import { t } from "../data/strings";
import { wkColor, isLightTheme } from "../data/themes";
import { addDays } from "../lib/dates";
import { resolveDay, firstOpenDay } from "../lib/schedule";
import { dayStatus, exerciseDone } from "../lib/completion";
import { restSecFor } from "../lib/reducer";
import { swElapsed, fmtElapsed, parseElapsed, stepWeight } from "../lib/timers";
import { useRestTimer, useWakeLock } from "../hooks/useTimers";
import { Popup, VBtn, SHead } from "./ui";
import { SessionSummary } from "./Sheets";

const defaultEx = sticky => ({ equipment: sticky?.equipment ?? 0, sets: 3, work: [0, 1, 2].map(i => ({ weight: sticky?.weights?.[i] ?? "", reps: "", rir: null, done: false })), warmups: [], notes: "", substitution: "" });

function fmtNice(dateStr) {
  const [, m, d] = dateStr.split("-");
  return `${Number(d)}/${Number(m)}`;
}

// One loggable set row: tick + weight (with ± steppers) + reps. WU rows are
// visually distinct (dashed, muted) and removable.
function SetRow({ s, label, isWU, color, th, iBg, inc, repsPlaceholder, onTick, onField, onRemove }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center", direction: "ltr", opacity: isWU && !s.done ? 0.85 : 1 }}>
      <button onClick={onTick} style={{ width: 28, height: 28, borderRadius: 8, border: `2px solid ${s.done ? color : th.borderLight}`, borderStyle: isWU ? "dashed" : "solid", background: s.done ? color : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, padding: 0 }}>
        {s.done && <span style={{ color: "#fff", fontSize: 13, fontWeight: 700, mixBlendMode: "difference" }}>✓</span>}
      </button>
      <span style={{ fontSize: 10, color: isWU ? color : th.textFaint, width: 24, textAlign: "center", flexShrink: 0, fontWeight: isWU ? 700 : 400 }}>{label}</span>
      <button onClick={() => onField("weight", stepWeight(s.weight, inc, -1))} style={{ width: 30, height: 34, borderRadius: 8, border: `1px solid ${th.borderLight}`, background: iBg, color: th.textMuted, fontSize: 15, cursor: "pointer", flexShrink: 0, padding: 0 }}>−</button>
      <div style={{ position: "relative", flex: 1.2, minWidth: 62 }}>
        <input type="number" inputMode="decimal" placeholder="kg" value={s.weight} onChange={e => onField("weight", e.target.value)} style={{ width: "100%", background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "7px 24px 7px 8px", fontSize: 14, outline: "none", boxSizing: "border-box", textAlign: "center" }}/>
        <span style={{ position: "absolute", right: 7, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: th.textFaint, pointerEvents: "none" }}>kg</span>
      </div>
      <button onClick={() => onField("weight", stepWeight(s.weight, inc, +1))} style={{ width: 30, height: 34, borderRadius: 8, border: `1px solid ${th.borderLight}`, background: iBg, color: th.textMuted, fontSize: 15, cursor: "pointer", flexShrink: 0, padding: 0 }}>+</button>
      <div style={{ position: "relative", flex: 1, minWidth: 54 }}>
        <input type="number" inputMode="numeric" placeholder={repsPlaceholder} value={s.reps} onChange={e => onField("reps", e.target.value)} style={{ width: "100%", background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "7px 8px", fontSize: 14, outline: "none", boxSizing: "border-box", textAlign: "center" }}/>
      </div>
      {isWU && <button onClick={onRemove} style={{ width: 24, height: 24, border: "none", background: "transparent", color: th.textFaint, fontSize: 13, cursor: "pointer", flexShrink: 0, padding: 0 }}>✕</button>}
    </div>
  );
}

function RestBar({ rest, remaining, color, th, lang, onAdjust, onSkip }) {
  const frac = rest.totalSec > 0 ? remaining / rest.totalSec : 0;
  const R = 16, C = 2 * Math.PI * R;
  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 800, background: th.card, borderTop: `1px solid ${th.borderLight}`, padding: "10px 16px calc(10px + env(safe-area-inset-bottom))" }}>
      <div style={{ maxWidth: 600, margin: "0 auto", display: "flex", alignItems: "center", gap: 12, direction: "ltr" }}>
        <svg width="40" height="40" viewBox="0 0 40 40" style={{ flexShrink: 0 }}>
          <circle cx="20" cy="20" r={R} fill="none" stroke={th.border} strokeWidth="4"/>
          <circle cx="20" cy="20" r={R} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - frac)} transform="rotate(-90 20 20)" style={{ transition: "stroke-dashoffset 0.5s linear" }}/>
        </svg>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 11, color: th.textMuted }}>{t(lang, "restLabel")}</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: th.text, fontVariantNumeric: "tabular-nums" }}>{Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, "0")}</div>
        </div>
        <button onClick={() => onAdjust(-30)} style={{ minWidth: 44, minHeight: 40, borderRadius: 10, border: `1px solid ${th.borderLight}`, background: "transparent", color: th.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>−30s</button>
        <button onClick={() => onAdjust(30)} style={{ minWidth: 44, minHeight: 40, borderRadius: 10, border: `1px solid ${th.borderLight}`, background: "transparent", color: th.text, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+30s</button>
        <button onClick={onSkip} style={{ minWidth: 44, minHeight: 40, borderRadius: 10, border: "none", background: color + "25", color, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{t(lang, "skip")}</button>
      </div>
    </div>
  );
}

export default function DayView({ data, dispatch, lang, themeId, th, todayStr, selectedDate, setSelectedDate, gotoSettings }) {
  const [openSec, setOpenSec] = useState({ warmup: false, workout: true, cooldown: false });
  const [expandedEx, setExpandedEx] = useState({});
  const [popup, setPopup] = useState(null);
  const [pendingSummary, setPendingSummary] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSkip, setShowSkip] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [showSwap, setShowSwap] = useState(false);
  const [swapA, setSwapA] = useState(null);
  const [swapB, setSwapB] = useState(null);
  const [, tickRender] = useState(0);
  const exRefs = useRef({});

  const isRtl = lang === "ar", isLight = isLightTheme(themeId);
  const L = o => (typeof o === "string" ? o : o[lang] || o.en);
  const iBg = isLight ? "#f0e8ed" : th.bg, bBg = isLight ? "#f0e8ed" : th.border;
  const weekStart = data.settings.weekStart;

  const slot = resolveDay(selectedDate, data.program, data.weeks, weekStart);
  const day = data.days[selectedDate];
  const workoutKey = day?.workoutKey ?? slot.workoutKey;
  const isRest = workoutKey === "REST";
  const wo = isRest ? null : WORKOUTS[workoutKey];
  const exIds = wo ? wo.exercises.map(e => e.id) : [];
  const status = isRest ? "open" : dayStatus(day, exIds);
  const color = wkColor(themeId, workoutKey);
  const isToday = selectedDate === todayStr;
  const dayClosed = status === "done" || status === "skipped" || status === "assumed";

  const statusFn = d => dayStatus(data.days[d], (WORKOUTS[data.days[d]?.workoutKey ?? resolveDay(d, data.program, data.weeks, weekStart).workoutKey]?.exercises || []).map(e => e.id));
  const behindDay = firstOpenDay(todayStr, data.program, data.weeks, statusFn, weekStart);

  const getEx = ex => day?.exercises?.[ex.id] ?? defaultEx(data.exercises[ex.id]?.sticky);
  const doneCount = wo ? wo.exercises.filter(ex => exerciseDone(getEx(ex))).length : 0;
  const prog = wo ? Math.round((doneCount / wo.exercises.length) * 100) : 0;
  const setsDoneCount = wo ? wo.exercises.reduce((n, ex) => n + getEx(ex).work.filter(s => s.done).length, 0) : 0;
  const warmup = wo ? WARMUP[wo.warmupType] : null;
  const upd = (exId, field, value) => dispatch({ type: "UPDATE_EX", date: selectedDate, exId, field, value, now: Date.now() });

  // --- session stopwatch (ticking display) + wake lock
  const sw = day?.stopwatch || { elapsedMs: 0, runningSince: null };
  const swRunning = !!sw.runningSince;
  useEffect(() => {
    if (!swRunning) return;
    const id = setInterval(() => tickRender(x => x + 1), 1000);
    return () => clearInterval(id);
  }, [swRunning]);
  useWakeLock(swRunning && data.settings.wakeLock);

  // --- rest timer
  const restTimer = useRestTimer({ soundOn: data.settings.sound });
  useEffect(() => { if (dayClosed && restTimer.rest) restTimer.skip(); }, [dayClosed]); // eslint-disable-line react-hooks/exhaustive-deps

  function tickSet(exId, kind, si, done) {
    dispatch({ type: "TICK_SET", date: selectedDate, exId, kind, si, done, now: Date.now() });
    if (done && data.settings.autoRest) restTimer.start(exId, restSecFor(data, exId));
  }
  function adjustRest(delta) {
    const exId = restTimer.rest?.exId;
    restTimer.adjust(delta);
    if (exId) dispatch({ type: "SET_REST", exId, sec: Math.max(15, (restTimer.rest?.totalSec || 0) + delta) });
  }

  // --- flow mode: highlight + scroll to the first unfinished exercise while active
  const firstUnfinishedId = wo && swRunning && !dayClosed ? wo.exercises.find(ex => !exerciseDone(getEx(ex)))?.id : null;
  const prevFirst = useRef(firstUnfinishedId);
  useEffect(() => {
    if (firstUnfinishedId && prevFirst.current && firstUnfinishedId !== prevFirst.current) {
      exRefs.current[firstUnfinishedId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    prevFirst.current = firstUnfinishedId;
  }, [firstUnfinishedId]);

  // --- celebration + summary: fire once per open→done transition (stamp-guarded)
  useEffect(() => {
    if (status === "done" && day && !day.celebratedAt) {
      const idx = data.meta.msgIndex || 0;
      setPopup(COMPLETION_MESSAGES[idx % COMPLETION_MESSAGES.length]);
      setPendingSummary(true);
      dispatch({ type: "CELEBRATED", date: selectedDate, now: Date.now() });
      dispatch({ type: "BUMP_MSG_INDEX", count: COMPLETION_MESSAGES.length });
    }
  }, [status, day, data.meta.msgIndex, dispatch, selectedDate]);
  function closePopup() {
    setPopup(null);
    if (pendingSummary) { setShowSummary(true); setPendingSummary(false); }
  }

  function editTime() {
    const cur = fmtElapsed(swElapsed(sw, Date.now()));
    const answer = window.prompt(t(lang, "editTimePrompt"), cur);
    if (answer === null) return;
    const ms = parseElapsed(answer);
    if (ms !== null) dispatch({ type: "STOPWATCH", date: selectedDate, op: "edit", value: ms, now: Date.now() });
  }

  const chip = (txt, c) => <span style={{ fontSize: 10, fontWeight: 700, color: c, background: c + "18", border: `1px solid ${c}40`, borderRadius: 6, padding: "2px 8px" }}>{txt}</span>;
  const wdShort = t(lang, "weekdaysShort");
  const swap = data.weeks[slot.week]?.swaps?.[0];
  const navBtn = { background: th.card, color: th.textMuted, border: `1px solid ${th.border}`, borderRadius: 10, padding: "8px 14px", fontSize: 15, cursor: "pointer", minWidth: 44, minHeight: 44 };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px", paddingBottom: restTimer.rest ? 90 : 0 }}>
      {popup && <Popup message={popup} onClose={closePopup} lang={lang}/>}
      {restTimer.flash && <div style={{ position: "fixed", inset: 0, zIndex: 950, background: color, opacity: 0.55, pointerEvents: "none", animation: "none" }}/>}
      {showSummary && day && (
        <SessionSummary onClose={() => setShowSummary(false)} th={th} lang={lang} color={color}
          durationMs={swElapsed(day.stopwatch, Date.now())} setsDone={setsDoneCount}
          note={day.note || ""} onNote={v => dispatch({ type: "SET_DAY_NOTE", date: selectedDate, value: v })}/>
      )}

      {/* behind-schedule banner */}
      {behindDay && behindDay !== selectedDate && (
        <button onClick={() => setSelectedDate(behindDay)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "#ffab4018", border: "1px solid #ffab4040", borderRadius: 10, padding: "10px 14px", marginBottom: 12, cursor: "pointer" }}>
          <span style={{ fontSize: 12, color: "#ffab40", fontWeight: 600 }}>{t(lang, "behindBanner")} {wdShort[new Date(behindDay + "T12:00").getDay()]} {fmtNice(behindDay)}</span>
          <span style={{ fontSize: 12, color: "#ffab40", fontWeight: 700 }}>{t(lang, "goThere")} {isRtl ? "←" : "→"}</span>
        </button>
      )}

      {/* day navigator */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} style={navBtn}>{isRtl ? "›" : "‹"}</button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: th.text }}>
            {wdShort[slot.weekday]} · {fmtNice(selectedDate)}
            {isToday && <span style={{ color, fontWeight: 700 }}> · {t(lang, "today")}</span>}
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 4, flexWrap: "wrap" }}>
            {chip(`${t(lang, "week")} ${slot.week}`, th.textMuted)}
            {slot.isDeload && chip(t(lang, "deloadWeek"), "#b388ff")}
            {slot.swapped && chip(t(lang, "swapped"), "#ffab40")}
          </div>
        </div>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} style={navBtn}>{isRtl ? "‹" : "›"}</button>
      </div>
      {!isToday && (
        <button onClick={() => setSelectedDate(todayStr)} style={{ width: "100%", background: "transparent", color: th.textMuted, border: `1px dashed ${th.borderLight}`, borderRadius: 10, padding: "8px 0", fontSize: 12, cursor: "pointer", marginBottom: 12 }}>{t(lang, "jumpToday")}</button>
      )}

      {/* week tools */}
      <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={() => dispatch({ type: "TOGGLE_DELOAD", week: slot.week, isDeloadNow: slot.isDeload })} style={{ background: slot.isDeload ? "#b388ff20" : th.card, color: slot.isDeload ? "#b388ff" : th.textMuted, border: `1px solid ${slot.isDeload ? "#b388ff40" : th.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
          {slot.isDeload ? t(lang, "makeNormal") : t(lang, "makeDeload")}
        </button>
        {swap ? (
          <button onClick={() => dispatch({ type: "SET_SWAP", week: slot.week, pair: null })} style={{ background: "#ffab4018", color: "#ffab40", border: "1px solid #ffab4040", borderRadius: 8, padding: "6px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>
            {t(lang, "removeSwap")}: {wdShort[swap[0]]}↔{wdShort[swap[1]]} ✕
          </button>
        ) : (
          <button onClick={() => setShowSwap(!showSwap)} style={{ background: th.card, color: th.textMuted, border: `1px solid ${th.border}`, borderRadius: 8, padding: "6px 10px", fontSize: 11, cursor: "pointer", fontWeight: 600 }}>{t(lang, "swapDays")}</button>
        )}
        <button onClick={gotoSettings} style={{ marginInlineStart: "auto", background: "none", border: "none", color: th.textFaint, fontSize: 11, cursor: "pointer", textDecoration: "underline" }}>{t(lang, "wrongWeek")}</button>
      </div>
      {showSwap && !swap && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12, alignItems: "center" }}>
          {[["A", swapA, setSwapA], ["B", swapB, setSwapB]].map(([k, v, set]) => (
            <select key={k} value={v ?? ""} onChange={e => set(e.target.value === "" ? null : Number(e.target.value))} style={{ flex: 1, background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "8px 10px", fontSize: 13 }}>
              <option value="">{t(lang, "swapWith")}</option>
              {wdShort.map((w, i) => <option key={i} value={i}>{w}</option>)}
            </select>
          ))}
          <button disabled={swapA === null || swapB === null || swapA === swapB} onClick={() => { dispatch({ type: "SET_SWAP", week: slot.week, pair: [swapA, swapB] }); setShowSwap(false); setSwapA(null); setSwapB(null); }} style={{ background: th.card, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "8px 14px", fontSize: 13, cursor: "pointer", opacity: swapA === null || swapB === null || swapA === swapB ? 0.4 : 1 }}>{t(lang, "apply")}</button>
        </div>
      )}

      {isRest ? (
        <div style={{ background: th.card, borderRadius: 12, padding: 32, marginBottom: 12, border: `1px solid ${th.border}`, textAlign: "center" }}>
          <div style={{ fontSize: 34 }}>🌙</div>
          <h2 style={{ margin: "10px 0 4px", fontSize: 18, fontWeight: 700, color: th.text }}>{t(lang, "restDay")}</h2>
          <p style={{ margin: 0, fontSize: 13, color: th.textMuted }}>{t(lang, "restDaySub")}</p>
        </div>
      ) : (
        <>
          {/* workout header card */}
          <div style={{ background: th.card, borderRadius: 12, padding: 16, marginBottom: 12, border: `1px solid ${th.border}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color }}>{L(wo.name)}</h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: th.textMuted }}>{L(wo.subtitle)}</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: th.textFaint }}>{t(lang, "setsReps")}</p>
                <div style={{ marginTop: 6 }}>
                  {status === "done" && chip("✓ " + t(lang, "dayDone"), color)}
                  {status === "skipped" && chip(t(lang, "daySkipped"), "#ff5252")}
                  {status === "assumed" && chip(t(lang, "dayAssumed"), th.textMuted)}
                  {status === "partial" && chip(t(lang, "dayPartial"), "#ffab40")}
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 28, fontWeight: 700, color }}>{prog}%</div>
                <div style={{ fontSize: 11, color: th.textFaint }}>{doneCount}/{wo.exercises.length}</div>
              </div>
            </div>
            <div style={{ marginTop: 12, background: th.border, borderRadius: 4, height: 6, overflow: "hidden" }}>
              <div style={{ width: `${prog}%`, height: "100%", background: color, borderRadius: 4, transition: "width 0.3s" }}/>
            </div>
            {/* session stopwatch */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, direction: "ltr" }}>
              <span style={{ fontSize: 11, color: th.textMuted }}>⏱ {t(lang, "sessionTime")}</span>
              <button onClick={editTime} style={{ background: "transparent", border: "none", color: th.text, fontSize: 18, fontWeight: 700, cursor: "pointer", fontVariantNumeric: "tabular-nums", padding: 0 }}>
                {fmtElapsed(swElapsed(sw, Date.now()))}
              </button>
              {!dayClosed && (
                <button onClick={() => dispatch({ type: "STOPWATCH", date: selectedDate, op: swRunning ? "pause" : "start", now: Date.now() })} style={{ marginLeft: "auto", background: swRunning ? bBg : color + "20", color: swRunning ? th.textMuted : color, border: `1px solid ${swRunning ? th.borderLight : color + "40"}`, borderRadius: 8, padding: "7px 16px", fontSize: 12, fontWeight: 700, cursor: "pointer", minHeight: 36 }}>
                  {swRunning ? t(lang, "pause") : sw.elapsedMs > 0 ? t(lang, "resume") : t(lang, "startSession")}
                </button>
              )}
            </div>
          </div>

          {/* warm up checklist */}
          <div style={{ marginBottom: 8 }}>
            <SHead title={t(lang, "warmup")} open={openSec.warmup} toggle={() => setOpenSec(p => ({ ...p, warmup: !p.warmup }))} color={color} th={th} link={warmup.link} lang={lang}/>
            {openSec.warmup && <div style={{ background: th.card, borderRadius: 10, padding: 12, border: `1px solid ${th.border}` }}>{L(warmup.items).map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < L(warmup.items).length - 1 ? `1px solid ${th.border}` : "none" }}>
                <span style={{ fontSize: 12, color: th.textFaint, width: 18, textAlign: "center" }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: th.text }}>{item}</span>
              </div>
            ))}</div>}
          </div>

          {/* exercises */}
          <div style={{ marginBottom: 8 }}>
            <div style={{ position: "relative" }}>
              <SHead title={t(lang, "mainWorkout")} open={openSec.workout} toggle={() => setOpenSec(p => ({ ...p, workout: !p.workout }))} color={color} th={th} count={wo.exercises.length} lang={lang}/>
              {openSec.workout && !dayClosed && (
                <button onClick={() => dispatch({ type: "TICK_ALL", date: selectedDate, now: Date.now() })} style={{ position: "absolute", top: 8, insetInlineEnd: 40, background: color + "15", color, border: `1px solid ${color}30`, borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>{t(lang, "tickAll")}</button>
              )}
            </div>
            {openSec.workout && wo.exercises.map((ex, i) => {
              const dEx = getEx(ex), opts = L(ex.options), cl = ex.links[dEx.equipment] || ex.links[0];
              const done = exerciseDone(dEx);
              const isCurrent = ex.id === firstUnfinishedId;
              const isOpen = expandedEx[ex.id] ?? false;
              const repsPh = `${ex.repRangeMin}-${ex.repRangeMax}`;
              return (
                <div key={ex.id} ref={el => { exRefs.current[ex.id] = el; }} style={{ background: done ? th.card + "80" : th.card, borderRadius: 12, marginBottom: 8, border: isCurrent ? `2px solid ${color}` : done ? `1px solid ${color}30` : `1px solid ${th.border}`, opacity: done ? 0.7 : 1, overflow: "hidden", boxShadow: isCurrent ? `0 0 0 3px ${color}20` : "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 14, cursor: "pointer" }} onClick={() => setExpandedEx(p => ({ ...p, [ex.id]: !isOpen }))}>
                    <button onClick={e => { e.stopPropagation(); upd(ex.id, "bulkTick", !done); }} style={{ width: 28, height: 28, borderRadius: 8, border: `2px solid ${done ? color : th.borderLight}`, background: done ? color : "transparent", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {done && <span style={{ color: isLight ? "#fff" : th.bg, fontSize: 14, fontWeight: 700 }}>✓</span>}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 15, fontWeight: 600, color: done ? th.textMuted : th.text, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                        <span style={{ color: th.textFaint, fontSize: 12 }}>{i + 1}.</span>
                        <span>{L(ex.name)}</span>
                        <VBtn link={cl} lang={lang} color={color}/>
                      </div>
                      {!isOpen && (dEx.work.some(s => s.done || s.weight) ? (
                        <div style={{ fontSize: 11, color: th.textFaint, marginTop: 3 }}>
                          {dEx.work.filter(s => s.weight || s.done).map(s => `${s.done ? "✓" : ""}${s.weight || "?"}kg×${s.reps || repsPh}`).join(" · ")}
                        </div>
                      ) : null)}
                      {isOpen && <div style={{ fontSize: 11, color: th.textFaint, marginTop: 2 }}>{L(ex.target)}</div>}
                    </div>
                    <span style={{ color: th.textMuted, fontSize: 11, transform: isOpen ? "rotate(180deg)" : "none", transition: "transform 0.2s", flexShrink: 0 }}>▼</span>
                  </div>
                  {isOpen && (
                    <div style={{ padding: "0 14px 14px" }}>
                      <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                        <select value={dEx.equipment} onChange={e => upd(ex.id, "equipment", e.target.value)} style={{ flex: 1, minWidth: 120, background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "7px 10px", fontSize: 13, outline: "none", direction: "ltr" }}>
                          {opts.map((o, oi) => <option key={oi} value={oi}>{o}</option>)}
                        </select>
                        <div style={{ display: "flex", background: iBg, borderRadius: 8, border: `1px solid ${th.borderLight}`, overflow: "hidden" }}>
                          {[2, 3, 4].map(n => (
                            <button key={n} onClick={() => upd(ex.id, "sets", n)} style={{ width: 36, height: 34, border: "none", background: dEx.sets === n ? color + "30" : "transparent", color: dEx.sets === n ? color : th.textMuted, fontSize: 13, fontWeight: 600, cursor: "pointer", borderRight: n < 4 ? `1px solid ${th.borderLight}` : "none" }}>{n}s</button>
                          ))}
                        </div>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {dEx.warmups.map((s, si) => (
                          <SetRow key={`wu${si}`} s={s} label={t(lang, "wu")} isWU color={color} th={th} iBg={iBg} inc={ex.loadIncrement} repsPlaceholder=""
                            onTick={() => tickSet(ex.id, "wu", si, !s.done)}
                            onField={(prop, v) => upd(ex.id, `wu-${si}-${prop}`, v)}
                            onRemove={() => dispatch({ type: "REMOVE_WU", date: selectedDate, exId: ex.id, si })}/>
                        ))}
                        {dEx.work.map((s, si) => (
                          <SetRow key={si} s={s} label={`S${si + 1}`} color={color} th={th} iBg={iBg} inc={ex.loadIncrement} repsPlaceholder={repsPh}
                            onTick={() => tickSet(ex.id, "work", si, !s.done)}
                            onField={(prop, v) => upd(ex.id, `set-${si}-${prop}`, v)}/>
                        ))}
                      </div>
                      <button onClick={() => dispatch({ type: "ADD_WU", date: selectedDate, exId: ex.id })} style={{ marginTop: 8, background: "transparent", color: th.textMuted, border: `1px dashed ${th.borderLight}`, borderRadius: 8, padding: "6px 12px", fontSize: 11, cursor: "pointer" }}>{t(lang, "addWarmupSet")}</button>
                      <input type="text" placeholder={t(lang, "notes")} value={dEx.notes} onChange={e => upd(ex.id, "notes", e.target.value)} style={{ width: "100%", background: iBg, color: th.text, border: `1px solid ${th.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, outline: "none", marginTop: 8, boxSizing: "border-box" }}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* cool down checklist */}
          <div style={{ marginBottom: 12 }}>
            <SHead title={t(lang, "cooldown")} open={openSec.cooldown} toggle={() => setOpenSec(p => ({ ...p, cooldown: !p.cooldown }))} color={color} th={th} lang={lang}/>
            {openSec.cooldown && <div style={{ background: th.card, borderRadius: 10, padding: 12, border: `1px solid ${th.border}` }}>{L(COOLDOWN.items).map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < L(COOLDOWN.items).length - 1 ? `1px solid ${th.border}` : "none" }}>
                <span style={{ fontSize: 12, color: th.textFaint, width: 18, textAlign: "center" }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: th.text }}>{item}</span>
              </div>
            ))}</div>}
          </div>

          {/* day note */}
          <input type="text" placeholder={t(lang, "dayNotePlaceholder")} value={day?.note || ""} onChange={e => dispatch({ type: "SET_DAY_NOTE", date: selectedDate, value: e.target.value })} style={{ width: "100%", background: th.card, color: th.text, border: `1px solid ${th.border}`, borderRadius: 10, padding: "10px 12px", fontSize: 12, outline: "none", marginBottom: 12, boxSizing: "border-box" }}/>

          {/* day actions */}
          {dayClosed ? (
            <button onClick={() => dispatch({ type: "MARK_DAY", date: selectedDate, status: "reopen" })} style={{ width: "100%", padding: "14px 0", background: bBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{t(lang, "reopenDay")}</button>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => dispatch({ type: "MARK_DAY", date: selectedDate, status: "done-manual", now: Date.now() })} disabled={doneCount === 0} style={{ flex: 1, padding: "14px 0", background: color, color: isLight ? "#fff" : th.bg, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: doneCount === 0 ? 0.4 : 1 }}>{t(lang, "completeToday")}</button>
                <button onClick={() => dispatch({ type: "RESET_DAY", date: selectedDate })} style={{ padding: "14px 18px", background: bBg, color: th.textMuted, border: `1px solid ${th.borderLight}`, borderRadius: 12, fontSize: 13, cursor: "pointer" }}>{t(lang, "reset")}</button>
              </div>
              {!showSkip ? (
                <button onClick={() => setShowSkip(true)} style={{ width: "100%", marginTop: 8, padding: "10px 0", background: "transparent", color: th.textFaint, border: `1px dashed ${th.borderLight}`, borderRadius: 10, fontSize: 12, cursor: "pointer" }}>{t(lang, "skipDay")}</button>
              ) : (
                <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                  <input type="text" placeholder={t(lang, "skipReason")} value={skipReason} onChange={e => setSkipReason(e.target.value)} style={{ flex: 1, background: iBg, color: th.text, border: `1px solid ${th.border}`, borderRadius: 10, padding: "9px 10px", fontSize: 12, outline: "none" }}/>
                  <button onClick={() => { dispatch({ type: "MARK_DAY", date: selectedDate, status: "skipped", skipReason, now: Date.now() }); setShowSkip(false); setSkipReason(""); }} style={{ background: "#ff525220", color: "#ff5252", border: "1px solid #ff525240", borderRadius: 10, padding: "9px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>{t(lang, "skipDay")}</button>
                  <button onClick={() => setShowSkip(false)} style={{ background: "transparent", color: th.textFaint, border: `1px solid ${th.border}`, borderRadius: 10, padding: "9px 12px", fontSize: 12, cursor: "pointer" }}>{t(lang, "cancel")}</button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {restTimer.rest && <RestBar rest={restTimer.rest} remaining={restTimer.remaining} color={color} th={th} lang={lang} onAdjust={adjustRest} onSkip={restTimer.skip}/>}
    </div>
  );
}
