import { useEffect, useState } from "react";
import { WORKOUTS, WARMUP, COOLDOWN } from "../data/workouts";
import { COMPLETION_MESSAGES } from "../data/messages";
import { t } from "../data/strings";
import { wkColor, isLightTheme } from "../data/themes";
import { addDays } from "../lib/dates";
import { resolveDay, firstOpenDay } from "../lib/schedule";
import { dayStatus, exerciseDone } from "../lib/completion";
import { Popup, VBtn, SHead } from "./ui";

const defaultEx = sticky => ({ equipment: sticky?.equipment ?? 0, sets: 3, work: [{}, {}, {}].map(() => ({ weight: "", reps: "", rir: null, done: false })), warmups: [], notes: "", substitution: "" });

function fmtNice(dateStr, lang) {
  const [y, m, d] = dateStr.split("-");
  return lang === "ar" ? `${Number(d)}/${Number(m)}` : `${Number(d)}/${Number(m)}`;
}

export default function DayView({ data, dispatch, lang, themeId, th, todayStr, selectedDate, setSelectedDate, gotoSettings }) {
  const [openSec, setOpenSec] = useState({ warmup: false, workout: true, cooldown: false });
  const [expandedEx, setExpandedEx] = useState({});
  const [popup, setPopup] = useState(null);
  const [showSkip, setShowSkip] = useState(false);
  const [skipReason, setSkipReason] = useState("");
  const [showSwap, setShowSwap] = useState(false);
  const [swapA, setSwapA] = useState(null);
  const [swapB, setSwapB] = useState(null);

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

  const statusFn = d => dayStatus(data.days[d], (WORKOUTS[data.days[d]?.workoutKey ?? resolveDay(d, data.program, data.weeks, weekStart).workoutKey]?.exercises || []).map(e => e.id));
  const behindDay = firstOpenDay(todayStr, data.program, data.weeks, statusFn, weekStart);

  const getEx = ex => day?.exercises?.[ex.id] ?? defaultEx(data.exercises[ex.id]?.sticky);
  const doneCount = wo ? wo.exercises.filter(ex => exerciseDone(getEx(ex))).length : 0;
  const prog = wo ? Math.round((doneCount / wo.exercises.length) * 100) : 0;
  const warmup = wo ? WARMUP[wo.warmupType] : null;
  const upd = (exId, field, value) => dispatch({ type: "UPDATE_EX", date: selectedDate, exId, field, value, now: Date.now() });

  // Celebration fires exactly once per completion (auto-cascade or manual),
  // keyed off the stored celebratedAt stamp; reopening clears it.
  useEffect(() => {
    if (status === "done" && day && !day.celebratedAt) {
      const idx = data.meta.msgIndex || 0;
      setPopup(COMPLETION_MESSAGES[idx % COMPLETION_MESSAGES.length]);
      dispatch({ type: "CELEBRATED", date: selectedDate, now: Date.now() });
      dispatch({ type: "BUMP_MSG_INDEX", count: COMPLETION_MESSAGES.length });
    }
  }, [status, day, data.meta.msgIndex, dispatch, selectedDate]);

  function completeDay() {
    dispatch({ type: "MARK_DAY", date: selectedDate, status: "done-manual", now: Date.now() });
  }

  const chip = (txt, c) => <span style={{ fontSize: 10, fontWeight: 700, color: c, background: c + "18", border: `1px solid ${c}40`, borderRadius: 6, padding: "2px 8px" }}>{txt}</span>;
  const wdShort = t(lang, "weekdaysShort");
  const swap = data.weeks[slot.week]?.swaps?.[0];

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 16px" }}>
      {popup && <Popup message={popup} onClose={() => setPopup(null)} lang={lang}/>}

      {/* behind-schedule banner */}
      {behindDay && behindDay !== selectedDate && (
        <button onClick={() => setSelectedDate(behindDay)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, background: "#ffab4018", border: "1px solid #ffab4040", borderRadius: 10, padding: "10px 14px", marginBottom: 12, cursor: "pointer" }}>
          <span style={{ fontSize: 12, color: "#ffab40", fontWeight: 600 }}>{t(lang, "behindBanner")} {wdShort[new Date(behindDay + "T12:00").getDay()]} {fmtNice(behindDay, lang)}</span>
          <span style={{ fontSize: 12, color: "#ffab40", fontWeight: 700 }}>{t(lang, "goThere")} {isRtl ? "←" : "→"}</span>
        </button>
      )}

      {/* day navigator */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <button onClick={() => setSelectedDate(addDays(selectedDate, -1))} style={{ background: th.card, color: th.textMuted, border: `1px solid ${th.border}`, borderRadius: 10, padding: "8px 14px", fontSize: 15, cursor: "pointer", minWidth: 44, minHeight: 44 }}>{isRtl ? "›" : "‹"}</button>
        <div style={{ flex: 1, textAlign: "center" }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: th.text }}>
            {wdShort[slot.weekday]} · {fmtNice(selectedDate, lang)}
            {isToday && <span style={{ color, fontWeight: 700 }}> · {t(lang, "today")}</span>}
          </div>
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 4, flexWrap: "wrap" }}>
            {chip(`${t(lang, "week")} ${slot.week}`, th.textMuted)}
            {slot.isDeload && chip(t(lang, "deloadWeek"), "#b388ff")}
            {slot.swapped && chip(t(lang, "swapped"), "#ffab40")}
          </div>
        </div>
        <button onClick={() => setSelectedDate(addDays(selectedDate, 1))} style={{ background: th.card, color: th.textMuted, border: `1px solid ${th.border}`, borderRadius: 10, padding: "8px 14px", fontSize: 15, cursor: "pointer", minWidth: 44, minHeight: 44 }}>{isRtl ? "‹" : "›"}</button>
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
          </div>

          {/* warm up */}
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
            <SHead title={t(lang, "mainWorkout")} open={openSec.workout} toggle={() => setOpenSec(p => ({ ...p, workout: !p.workout }))} color={color} th={th} count={wo.exercises.length} lang={lang}/>
            {openSec.workout && wo.exercises.map((ex, i) => {
              const dEx = getEx(ex), opts = L(ex.options), cl = ex.links[dEx.equipment] || ex.links[0];
              const done = exerciseDone(dEx);
              const isOpen = expandedEx[ex.id] ?? false;
              return (
                <div key={ex.id} style={{ background: done ? th.card + "80" : th.card, borderRadius: 12, marginBottom: 8, border: done ? `1px solid ${color}30` : `1px solid ${th.border}`, opacity: done ? 0.7 : 1, overflow: "hidden" }}>
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
                      {!isOpen && dEx.work.some(s => s.weight) && (
                        <div style={{ fontSize: 11, color: th.textFaint, marginTop: 3 }}>
                          {dEx.work.filter(s => s.weight).map(s => `${s.weight}kg×${s.reps || "?"}`).join(" · ")}
                        </div>
                      )}
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
                        {dEx.work.map((s, si) => (
                          <div key={si} style={{ display: "flex", gap: 6, alignItems: "center", direction: "ltr" }}>
                            <span style={{ fontSize: 11, color: th.textFaint, width: 20, textAlign: "center", flexShrink: 0 }}>S{si + 1}</span>
                            <div style={{ position: "relative", flex: 1 }}>
                              <input type="number" inputMode="decimal" placeholder="kg" value={s.weight} onChange={e => upd(ex.id, `set-${si}-weight`, e.target.value)} style={{ width: "100%", background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "7px 30px 7px 10px", fontSize: 14, outline: "none", boxSizing: "border-box" }}/>
                              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: th.textFaint, pointerEvents: "none" }}>kg</span>
                            </div>
                            <div style={{ position: "relative", flex: 1 }}>
                              <input type="number" inputMode="numeric" placeholder="reps" value={s.reps} onChange={e => upd(ex.id, `set-${si}-reps`, e.target.value)} style={{ width: "100%", background: iBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 8, padding: "7px 38px 7px 10px", fontSize: 14, outline: "none", boxSizing: "border-box" }}/>
                              <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: th.textFaint, pointerEvents: "none" }}>reps</span>
                            </div>
                          </div>
                        ))}
                      </div>
                      <input type="text" placeholder={t(lang, "notes")} value={dEx.notes} onChange={e => upd(ex.id, "notes", e.target.value)} style={{ width: "100%", background: iBg, color: th.text, border: `1px solid ${th.border}`, borderRadius: 8, padding: "7px 10px", fontSize: 12, outline: "none", marginTop: 8, boxSizing: "border-box" }}/>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* cool down */}
          <div style={{ marginBottom: 16 }}>
            <SHead title={t(lang, "cooldown")} open={openSec.cooldown} toggle={() => setOpenSec(p => ({ ...p, cooldown: !p.cooldown }))} color={color} th={th} lang={lang}/>
            {openSec.cooldown && <div style={{ background: th.card, borderRadius: 10, padding: 12, border: `1px solid ${th.border}` }}>{L(COOLDOWN.items).map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: i < L(COOLDOWN.items).length - 1 ? `1px solid ${th.border}` : "none" }}>
                <span style={{ fontSize: 12, color: th.textFaint, width: 18, textAlign: "center" }}>{i + 1}</span>
                <span style={{ fontSize: 13, color: th.text }}>{item}</span>
              </div>
            ))}</div>}
          </div>

          {/* day actions */}
          {status === "done" || status === "skipped" || status === "assumed" ? (
            <button onClick={() => dispatch({ type: "MARK_DAY", date: selectedDate, status: "reopen" })} style={{ width: "100%", padding: "14px 0", background: bBg, color: th.text, border: `1px solid ${th.borderLight}`, borderRadius: 12, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{t(lang, "reopenDay")}</button>
          ) : (
            <>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={completeDay} disabled={doneCount === 0} style={{ flex: 1, padding: "14px 0", background: color, color: isLight ? "#fff" : th.bg, border: "none", borderRadius: 12, fontSize: 15, fontWeight: 700, cursor: "pointer", opacity: doneCount === 0 ? 0.4 : 1 }}>{t(lang, "completeToday")}</button>
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
    </div>
  );
}
