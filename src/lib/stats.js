// Dashboard statistics (spec section D). Pure functions over the state.
//
// Two rules hold throughout, from section E:
//   - "assumed done" back-filled days count toward COMPLETION but contribute
//     nothing to duration or volume detail;
//   - skipped days count as scheduled-but-not-done.

import { addDays, daysBetween } from "./dates";
import { resolveDay, weekOf, weekStartDate, isDeloadWeek } from "./schedule";
import { dayStatus, slotClosed } from "./completion";
import { WORKOUTS } from "../data/workouts";
import { sessionSets, weekSets } from "./volume";

// Status of one date, taking the frozen workoutKey of a logged day into account.
export function statusOf(state, date) {
  const weekStart = state.settings?.weekStart ?? 1;
  const day = state.days?.[date];
  const key = day?.workoutKey ?? resolveDay(date, state.program, state.weeks, weekStart).workoutKey;
  if (key === "REST") return { key, status: "rest" };
  const exIds = (WORKOUTS[key]?.exercises || []).map(e => e.id);
  return { key, status: dayStatus(day, exIds) };
}

export function currentWeek(state, todayStr) {
  return state.program ? weekOf(todayStr, state.program, state.settings?.weekStart ?? 1) : 1;
}

// The first day this app has any record of. Adherence and completion are
// measured from here, not from week 1: someone who starts mid-program without
// back-filling has no data for the earlier weeks, and counting those as missed
// would report a number that is simply false. Back-filling extends this window
// backwards on purpose, which is exactly what the "assumed done" option is for.
export function trackingStart(state, todayStr) {
  const dates = Object.keys(state.days || {});
  if (dates.length === 0) return todayStr;
  return dates.reduce((min, d) => (d < min ? d : min), dates[0]);
}

// Every date from the start of tracking up to `todayStr`, oldest first.
export function scheduledDates(state, todayStr, from = null) {
  if (!state.program) return [];
  const start = from || trackingStart(state, todayStr);
  if (daysBetween(start, todayStr) < 0) return [];
  const out = [];
  let d = start;
  while (d <= todayStr) { out.push(d); d = addDays(d, 1); }
  return out;
}

// D — day streak. Counts back from today over workout days; rest days are
// skipped, and an unfinished TODAY does not break a streak that is still alive.
export function streak(state, todayStr) {
  let n = 0;
  let d = todayStr;
  let first = true;
  for (let guard = 0; guard < 1000; guard++) {
    const { status } = statusOf(state, d);
    if (status === "rest") { d = addDays(d, -1); first = false; continue; }
    if (status === "done" || status === "assumed") n++;
    else if (first && (status === "open" || status === "partial")) { /* today still in progress */ }
    else break;
    first = false;
    d = addDays(d, -1);
  }
  return n;
}

// D — adherence over scheduled workout days up to yesterday (today is still
// open for business). Assumed-done days count as adhered; skipped days do not.
export function adherence(state, todayStr) {
  let done = 0, scheduled = 0;
  for (const d of scheduledDates(state, addDays(todayStr, -1))) {
    const { status } = statusOf(state, d);
    if (status === "rest") continue;
    scheduled++;
    if (status === "done" || status === "assumed") done++;
  }
  return { done, scheduled, pct: scheduled ? Math.round((done / scheduled) * 100) : null };
}

// D — a week is done when all seven slots are closed (rest days count as closed).
export function weeksDone(state, todayStr) {
  const weekStart = state.settings?.weekStart ?? 1;
  const cur = currentWeek(state, todayStr);
  let n = 0;
  for (let w = 1; w <= cur; w++) {
    const start = weekStartDate(w, state.program, weekStart);
    let all = true;
    for (let i = 0; i < 7; i++) {
      const d = addDays(start, i);
      const { status } = statusOf(state, d);
      if (!slotClosed(status, status === "rest")) { all = false; break; }
    }
    if (all) n++;
  }
  return n;
}

export function skippedCount(state) {
  return Object.values(state.days || {}).filter(d => d.status === "skipped").length;
}

// E — assumed days contribute no duration.
export function totalGymTimeMs(state) {
  return Object.values(state.days || {}).reduce((n, d) =>
    d.status === "assumed" || d.status === "skipped" ? n : n + (d.stopwatch?.elapsedMs || 0), 0);
}

// D — overall completion: closed slots vs scheduled slots so far.
export function overallCompletion(state, todayStr) {
  let closed = 0, total = 0;
  for (const d of scheduledDates(state, todayStr)) {
    const { status } = statusOf(state, d);
    if (status === "rest") continue;
    total++;
    if (status === "done" || status === "assumed" || status === "skipped") closed++;
  }
  return { closed, total, pct: total ? Math.round((closed / total) * 100) : 0 };
}

// D — full-program heatmap, weeks x days. Cell states: done / assumed /
// partial / skipped / open / rest, plus deload weeks and today outlined.
export function heatmap(state, todayStr, maxWeeks = 16) {
  if (!state.program) return { weeks: [], weekdayOrder: [] };
  const weekStart = state.settings?.weekStart ?? 1;
  const cur = currentWeek(state, todayStr);
  const earliest = Object.keys(state.days || {}).reduce((min, d) => {
    const w = weekOf(d, state.program, weekStart);
    return w < min ? w : min;
  }, cur);
  const from = Math.max(1, Math.min(earliest, cur - maxWeeks + 1));
  const weeks = [];
  for (let w = from; w <= cur; w++) {
    const start = weekStartDate(w, state.program, weekStart);
    const cells = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(start, i);
      const { key, status } = statusOf(state, date);
      cells.push({
        date, workoutKey: key, status,
        isToday: date === todayStr,
        isFuture: date > todayStr,
      });
    }
    weeks.push({ week: w, isDeload: isDeloadWeek(w, state.program, state.weeks), cells });
  }
  const weekdayOrder = Array.from({ length: 7 }, (_, i) => (weekStart + i) % 7);
  return { weeks, weekdayOrder };
}

// D — session duration trend (real sessions only).
export function durationSeries(state) {
  return Object.entries(state.days || {})
    .filter(([, d]) => d.status !== "assumed" && d.status !== "skipped" && (d.stopwatch?.elapsedMs || 0) > 0)
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, d]) => ({ date, label: date.slice(5), minutes: Math.round((d.stopwatch.elapsedMs / 60000) * 10) / 10 }));
}

// D — sets completed per week.
export function setsPerWeekSeries(state, todayStr, weeksBack = 12) {
  const cur = currentWeek(state, todayStr);
  const out = [];
  for (let w = Math.max(1, cur - weeksBack + 1); w <= cur; w++) out.push({ week: w, label: `W${w}`, sets: weekSets(state, w) });
  return out;
}

// C — every day note, newest first.
export function notesTimeline(state) {
  return Object.entries(state.days || {})
    .filter(([, d]) => (d.note || "").trim() || (d.skipReason || "").trim())
    .sort(([a], [b]) => (a < b ? 1 : -1))
    .map(([date, d]) => ({ date, note: d.note || "", skipReason: d.skipReason || "", status: d.status }));
}

// Where the current week sits in the deload cycle (e.g. "3 of 6").
export function deloadCycle(state, todayStr) {
  const every = state.program?.deloadEvery || 0;
  const w = currentWeek(state, todayStr);
  if (!every) return null;
  const pos = ((w - 1) % every) + 1;
  return { position: pos, every, isDeload: isDeloadWeek(w, state.program, state.weeks) };
}

export { sessionSets };
