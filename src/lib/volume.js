// Training volume and weekly hard-set counting per muscle (spec F.9 + D).
// Reads its primitives from engine.js so warm-up/assumed-day exclusions are the
// same single rule everywhere.

import { workingSets, effectiveReps, setWeight, prescribedReps, exerciseConfig, epley1RM } from "./engine";
import { weekOf } from "./schedule";

export { epley1RM };

export const DIRECT_SET = 1.0;    // F.9 — a set counts 1.0 for its primary muscles
export const INDIRECT_SET = 0.5;  //        and 0.5 for its secondary muscles
export const UNDER_WEEKS = 2;     // F.9 — weeks below band before "under-stimulated"
export const JUMP_RATIO = 0.20;   // F.9 — week-over-week volume jump warning

function countsAsWork(day) {
  // "Assumed done" days and skipped days are completion-only: they contribute
  // nothing to volume or set counts (F.14 #12).
  return !!day && day.status !== "assumed" && day.status !== "skipped";
}

// Sigma weight x reps over really-logged working sets of one day.
// Blank reps count as the prescribed number (C).
export function sessionVolume(state, date) {
  const day = state.days?.[date];
  if (!countsAsWork(day)) return 0;
  let total = 0;
  for (const [exId, dEx] of Object.entries(day.exercises || {})) {
    const prescribed = prescribedReps(state, exId);
    for (const s of workingSets(dEx)) {
      if (!s.done) continue;
      const w = setWeight(s);
      if (w > 0) total += w * effectiveReps(s, prescribed);
    }
  }
  return Math.round(total);
}

// Number of really-logged working sets in a day (warm-ups excluded).
export function sessionSets(state, date) {
  const day = state.days?.[date];
  if (!countsAsWork(day)) return 0;
  let n = 0;
  for (const dEx of Object.values(day.exercises || {})) n += workingSets(dEx).filter(s => s.done).length;
  return n;
}

export function datesInWeek(state, week) {
  if (!state.program) return [];
  const weekStart = state.settings?.weekStart ?? 1;
  return Object.keys(state.days || {}).filter(d => weekOf(d, state.program, weekStart) === week).sort();
}

export function weekVolume(state, week) {
  return datesInWeek(state, week).reduce((n, d) => n + sessionVolume(state, d), 0);
}

export function weekSets(state, week) {
  return datesInWeek(state, week).reduce((n, d) => n + sessionSets(state, d), 0);
}

export function weekGymTimeMs(state, week) {
  return datesInWeek(state, week).reduce((n, d) => {
    const day = state.days[d];
    return countsAsWork(day) ? n + (day.stopwatch?.elapsedMs || 0) : n;
  }, 0);
}

// F.9 — weekly hard sets per muscle: 1.0 per direct set, 0.5 per indirect set.
export function setsPerMuscle(state, week) {
  const out = {};
  const add = (m, v) => { out[m] = (out[m] || 0) + v; };
  for (const date of datesInWeek(state, week)) {
    const day = state.days[date];
    if (!countsAsWork(day)) continue;
    for (const [exId, dEx] of Object.entries(day.exercises || {})) {
      const n = workingSets(dEx).filter(s => s.done).length;
      if (n === 0) continue;
      const { muscles } = exerciseConfig(state, exId);
      for (const m of muscles.primary || []) add(m, n * DIRECT_SET);
      for (const m of muscles.secondary || []) add(m, n * INDIRECT_SET);
    }
  }
  for (const k of Object.keys(out)) out[k] = Math.round(out[k] * 10) / 10;
  return out;
}

// F.9 — the two warnings, per muscle, for the week being viewed.
export function muscleWarnings(state, week, band = state.settings?.muscleBand) {
  const { min = 10, max = 20 } = band || {};
  const cur = setsPerMuscle(state, week);
  const prevWeeks = [week - 1, week - 2].map(w => setsPerMuscle(state, w));
  const warnings = [];
  for (const [muscle, sets] of Object.entries(cur)) {
    if (sets > 0 && sets < min) {
      const belowLast = (prevWeeks[0][muscle] ?? 0) > 0 && prevWeeks[0][muscle] < min;
      if (belowLast) warnings.push({ muscle, type: "under", sets, weeks: UNDER_WEEKS, min, max });
    }
    const prev = prevWeeks[0][muscle] ?? 0;
    if (prev > 0 && sets > prev * (1 + JUMP_RATIO)) {
      warnings.push({ muscle, type: "jump", sets, previous: prev, pct: Math.round(((sets - prev) / prev) * 100) });
    }
  }
  return warnings;
}

// D — "this week vs last": only really-logged work, with an honest empty state.
export function weekVsLast(state, week) {
  const cur = { volume: weekVolume(state, week), sets: weekSets(state, week), timeMs: weekGymTimeMs(state, week) };
  const prev = { volume: weekVolume(state, week - 1), sets: weekSets(state, week - 1), timeMs: weekGymTimeMs(state, week - 1) };
  const hasPrev = prev.volume > 0 || prev.sets > 0 || prev.timeMs > 0;
  const delta = k => (hasPrev && prev[k] > 0 ? Math.round(((cur[k] - prev[k]) / prev[k]) * 100) : null);
  return { cur, prev, hasPrev, deltas: { volume: delta("volume"), sets: delta("sets"), timeMs: delta("timeMs") } };
}
