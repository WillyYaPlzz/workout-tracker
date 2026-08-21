// Schedule resolution: which week and which workout a given date maps to.
// program = { anchor: {date, week}, weekdayMap: {0.."REST"|"UB1"|...}, deloadEvery: 6 }
// weeks   = sparse per-week overrides: { [week]: { deloadOverride, swaps: [[wdA,wdB]], ... } }

import { addDays, daysBetween, weekdayOf } from "./dates";

// Start (weekStart weekday, default Monday=1) of the week containing dateStr.
export function weekStartOf(dateStr, weekStart = 1) {
  const wd = weekdayOf(dateStr);
  const diff = (wd - weekStart + 7) % 7;
  return addDays(dateStr, -diff);
}

export function weekOf(dateStr, program, weekStart = 1) {
  const a = weekStartOf(program.anchor.date, weekStart);
  const d = weekStartOf(dateStr, weekStart);
  return program.anchor.week + Math.round(daysBetween(a, d) / 7);
}

// First date (weekStart weekday) of a given program week.
export function weekStartDate(week, program, weekStart = 1) {
  const a = weekStartOf(program.anchor.date, weekStart);
  return addDays(a, (week - program.anchor.week) * 7);
}

export function isDeloadWeek(week, program, weeks) {
  const ov = weeks?.[week]?.deloadOverride;
  if (ov !== undefined && ov !== null) return ov;
  const every = program.deloadEvery || 0;
  return every > 0 && week > 0 && week % every === 0;
}

function applySwaps(weekday, swaps) {
  if (!swaps) return weekday;
  for (const [a, b] of swaps) {
    if (weekday === a) return b;
    if (weekday === b) return a;
  }
  return weekday;
}

// Resolve a date to its scheduled slot. A day RECORD's frozen workoutKey (if the
// day was already logged) takes precedence over this — this is the plan, not history.
export function resolveDay(dateStr, program, weeks, weekStart = 1) {
  const week = weekOf(dateStr, program, weekStart);
  const weekday = weekdayOf(dateStr);
  const effWeekday = applySwaps(weekday, weeks?.[week]?.swaps);
  return {
    week,
    weekday,
    workoutKey: program.weekdayMap[effWeekday] || "REST",
    isDeload: isDeloadWeek(week, program, weeks),
    swapped: effWeekday !== weekday,
  };
}

// "Wrong week? fix it": shift the anchor's week so that todayStr resolves to actualWeek.
export function fixWeek(program, todayStr, actualWeek, weekStart = 1) {
  const resolved = weekOf(todayStr, program, weekStart);
  return { ...program, anchor: { ...program.anchor, week: program.anchor.week + (actualWeek - resolved) } };
}

// Dates before todayStr (within weeks >= 1) that are scheduled workout days and have
// no record yet — candidates for "assumed done" back-fill. Bounded to maxDays back.
export function backfillCandidates(todayStr, program, weeks, days, weekStart = 1, maxDays = 366) {
  const out = [];
  const start = weekStartDate(1, program, weekStart);
  let d = daysBetween(start, todayStr) > maxDays ? addDays(todayStr, -maxDays) : start;
  while (d < todayStr) {
    const r = resolveDay(d, program, weeks, weekStart);
    if (r.week >= 1 && r.workoutKey !== "REST" && !days[d]) out.push(d);
    d = addDays(d, 1);
  }
  return out;
}

// Earliest past scheduled workout day (within lookbackDays) with no closed record —
// used by the behind-schedule banner. dayStatusFn(dateStr) → derived status string.
export function firstOpenDay(todayStr, program, weeks, dayStatusFn, weekStart = 1, lookbackDays = 28) {
  let d = addDays(todayStr, -lookbackDays);
  while (d < todayStr) {
    const r = resolveDay(d, program, weeks, weekStart);
    if (r.week >= 1 && r.workoutKey !== "REST") {
      const st = dayStatusFn(d);
      if (st === "open" || st === "partial") return d;
    }
    d = addDays(d, 1);
  }
  return null;
}

// Validate a weekday map: each of the 4 workouts exactly once, rest elsewhere.
export function validateWeekdayMap(map, workoutKeys) {
  const used = Object.values(map).filter(v => v !== "REST");
  if (used.length !== workoutKeys.length) return false;
  return workoutKeys.every(k => used.filter(u => u === k).length === 1);
}
