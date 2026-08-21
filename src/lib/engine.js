// The progressive-overload engine (spec section F). This is the SINGLE source of
// truth for progression: the overload prompt, PR detection, readiness badges,
// stall detection and the progression charts all read from here, so they can
// never disagree with each other.
//
// Gate order (applied in getExerciseAdvice):
//   1 warm-up filter -> 2 comparability -> 3 deload -> 4 fatigue
//   -> 5 training-age window -> 6 RIR / effort -> 7 double progression -> 8 stall

import { getExercise } from "../data/workouts";
import { weekOf, isDeloadWeek } from "./schedule";
import { daysBetween } from "./dates";

export const DEFAULT_TARGET_RIR = { min: 1, max: 3 };
export const JUMP_PCT = 0.10;      // F.5 — load-jump guard threshold
export const DELOAD_PCT = 0.10;    // F.6 — stall deload size
export const STALL_SESSIONS = 3;   // F.6 — consecutive flat comparable sessions

// F.10 — how long a flat stretch must last before it counts as a stall.
// Novice should progress every session; an advanced lifter's flat month is normal.
export const STALL_WINDOW_DAYS = { novice: 0, intermediate: 30, advanced: 90 };
export const INSISTENCE = { novice: "high", intermediate: "normal", advanced: "low" };

// ---------------------------------------------------------------- primitives

// F.3 — the one shared rule: warm-up rows are never part of any calculation.
export function workingSets(dayEx) { return dayEx?.work || []; }
export function warmupSets(dayEx) { return dayEx?.warmups || []; }

// F.1 — a session is comparable only if execution matched the exercise standard.
export function isComparable(dayEx) {
  if (!dayEx) return false;
  if (dayEx.substitution && String(dayEx.substitution).trim()) return false;
  if (dayEx.restOverrideSec != null) return false;
  return true;
}

export function exerciseConfig(state, exId) {
  const base = getExercise(exId) || {};
  const saved = state.exercises?.[exId] || {};
  return {
    repRangeMin: saved.repRangeMin ?? base.repRangeMin ?? 8,
    repRangeMax: saved.repRangeMax ?? base.repRangeMax ?? 12,
    loadIncrement: saved.loadIncrement ?? base.loadIncrement ?? 2.5,
    progressionLever: saved.progressionLever ?? "double",
    targetRir: saved.targetRir ?? DEFAULT_TARGET_RIR,
    restSec: saved.restSec ?? base.restSec ?? 90,
    muscles: base.muscles || { primary: [], secondary: [] },
  };
}

// C — a blank reps field counts as the prescribed rep number.
export function prescribedReps(state, exId) {
  const cfg = exerciseConfig(state, exId);
  return state.exercises?.[exId]?.sticky?.prescribedReps ?? cfg.repRangeMin;
}

export function effectiveReps(set, prescribed) {
  const r = parseInt(set?.reps);
  return Number.isFinite(r) && r > 0 ? r : prescribed;
}

export function setWeight(set) {
  const w = parseFloat(set?.weight);
  return Number.isFinite(w) && w > 0 ? w : 0;
}

// F.12 — Epley estimate. Named in the UI; unreliable much above ~10 reps.
export function epley1RM(weight, reps) {
  return weight * (1 + reps / 30);
}

export function roundTo(v, step) {
  return Math.round(v / step) * step;
}

function round2(v) { return Math.round(v * 100) / 100; }

// ------------------------------------------------------------------ sessions

// Every logged session of one exercise, oldest first, annotated with everything
// the engine's gates need. Assumed-done days never produce a session (F: they
// contribute nothing to any chart or figure).
export function exerciseSessions(state, exId) {
  const out = [];
  const prescribed = prescribedReps(state, exId);
  const weekStart = state.settings?.weekStart ?? 1;
  for (const [date, day] of Object.entries(state.days || {})) {
    if (!day || day.status === "assumed" || day.status === "skipped") continue;
    const dEx = day.exercises?.[exId];
    if (!dEx) continue;
    const work = workingSets(dEx);
    const done = work.filter(s => s.done);
    if (done.length === 0) continue;

    const weighted = done.filter(s => setWeight(s) > 0);
    const rirs = done.map(s => s.rir).filter(r => r != null && r !== "");
    const week = state.program ? weekOf(date, state.program, weekStart) : null;
    let best = null;
    for (const s of weighted) {
      const w = setWeight(s), reps = effectiveReps(s, prescribed), lr = w * reps;
      if (!best || lr > best.loadReps || (lr === best.loadReps && w > best.weight))
        best = { weight: w, reps, loadReps: lr, rir: s.rir ?? null };
    }
    out.push({
      date, week,
      isDeload: state.program && week != null ? isDeloadWeek(week, state.program, state.weeks) : false,
      comparable: isComparable(dEx),
      substitution: dEx.substitution || "",
      totalSets: work.length,
      doneSets: done.length,
      partial: done.length < work.length,          // C — "WS 1/2" honesty
      sets: done,
      warmups: warmupSets(dEx),
      weightedSets: weighted.map(s => ({ weight: setWeight(s), reps: effectiveReps(s, prescribed), rir: s.rir ?? null })),
      topWeight: weighted.length ? Math.max(...weighted.map(setWeight)) : 0,
      bestSet: best,
      bestLoadReps: best ? best.loadReps : 0,
      e1rm: best ? round2(epley1RM(best.weight, best.reps)) : 0,
      avgRir: rirs.length ? rirs.reduce((a, b) => a + Number(b), 0) / rirs.length : null,
      jumpConfirmedAt: dEx.jumpConfirmedAt ?? null,
      equipment: dEx.equipment ?? 0,
      notes: dEx.notes || "",
    });
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

// F.2 — every logged set at target RIR or easier.
export function atTargetEffort(session, cfg) {
  return session.weightedSets.every(s => s.rir == null || Number(s.rir) >= cfg.targetRir.min);
}

// "Clean": all working sets done, all weights logged, all at target effort.
// Partial sessions never qualify (C), warm-ups are irrelevant (F.3).
export function isCleanSession(session, cfg) {
  if (!session || session.partial) return false;
  if (session.weightedSets.length === 0) return false;
  if (session.weightedSets.length < session.doneSets) return false; // some sets had no weight
  return atTargetEffort(session, cfg);
}

// F.2 — output went up while average effort got harder: not a clean progression.
export function isEffortInflated(cur, prev) {
  if (!cur || !prev) return false;
  if (cur.avgRir == null || prev.avgRir == null) return false;
  const outputUp = cur.bestLoadReps > prev.bestLoadReps || cur.topWeight > prev.topWeight;
  return outputUp && cur.avgRir < prev.avgRir;
}

// Real improvement = more weight x reps at RIR that did not get worse.
export function improvedOver(cur, base) {
  if (!cur || !base) return false;
  if (cur.bestLoadReps <= base.bestLoadReps) return false;
  if (cur.avgRir != null && base.avgRir != null && cur.avgRir < base.avgRir) return false;
  return true;
}

// F.6 + F.10 — three consecutive comparable, non-deload sessions with no
// improvement, and the flat stretch long enough to matter at this training age.
export function detectStall(stream, trainingAge = "novice") {
  if (stream.length < STALL_SESSIONS) return false;
  const last3 = stream.slice(-STALL_SESSIONS);
  const first = last3[0];
  if (last3.slice(1).some(s => improvedOver(s, first))) return false;
  const span = daysBetween(first.date, last3[last3.length - 1].date);
  return span >= (STALL_WINDOW_DAYS[trainingAge] ?? 0);
}

// ------------------------------------------------------------------- prompts

function buildPrompt(last, cfg) {
  const top = last.topWeight;
  const inc = cfg.loadIncrement;
  const addLoad = () => ({
    type: "add-load", kg: inc, fromWeight: top,
    prefill: { weight: round2(top + inc), reps: cfg.repRangeMin },
  });
  const addRep = () => ({
    type: "add-rep", repRangeMax: cfg.repRangeMax, fromWeight: top,
    prefill: { weight: top, reps: null },
  });
  switch (cfg.progressionLever) {
    case "load": return addLoad();
    case "reps": return addRep();
    case "sets": return { type: "add-set", fromSets: last.totalSets, prefill: { weight: top, reps: null } };
    case "effort": return { type: "push-effort", targetRir: cfg.targetRir, prefill: { weight: top, reps: null } };
    default: {
      // F.4 — double progression: fill the rep range first, then add load.
      const allAtMax = last.weightedSets.length > 0 && last.weightedSets.every(s => s.reps >= cfg.repRangeMax);
      return allAtMax ? addLoad() : addRep();
    }
  }
}

// The one call every consumer uses. `opts.date` is the day being viewed; only
// sessions BEFORE it inform the advice for it.
export function getExerciseAdvice(state, exId, opts = {}) {
  const cfg = exerciseConfig(state, exId);
  const trainingAge = state.settings?.trainingAge || "novice";
  const weekStart = state.settings?.weekStart ?? 1;
  const date = opts.date || null;
  const week = opts.week ?? (state.program && date ? weekOf(date, state.program, weekStart) : null);
  const isDeload = opts.isDeload ?? (state.program && week != null ? isDeloadWeek(week, state.program, state.weeks) : false);
  const fatigue = week != null ? state.weeks?.[week]?.fatigue ?? null : null;

  const all = exerciseSessions(state, exId);
  const prior = date ? all.filter(s => s.date < date) : all;

  // gates 1-3: warm-ups already excluded; drop non-comparable and deload sessions.
  const stream = prior.filter(s => s.comparable && !s.isDeload);
  const last = stream[stream.length - 1] || null;
  const prev = stream[stream.length - 2] || null;

  const effortInflation = isEffortInflated(last, prev);
  const clean = isCleanSession(last, cfg);

  // F.6 — only sessions since the last stall action count toward a new stall.
  const sinceAction = state.exercises?.[exId]?.stallActionDate;
  const stallStream = sinceAction ? stream.filter(s => s.date > sinceAction) : stream;
  const stalled = detectStall(stallStream, trainingAge);

  // gates 3-4: suppression, always with a visible reason (never silent).
  let suppressed = null;
  if (isDeload) suppressed = { reason: "deload" };
  else if (fatigue != null && fatigue <= 2) suppressed = { reason: "fatigue", fatigue };

  // F.13 — readiness badge.
  let readiness = "grey";
  if (last && !suppressed) readiness = clean && !effortInflation ? "green" : "amber";

  const prompt = !suppressed && last && clean && !effortInflation ? buildPrompt(last, cfg) : null;

  return {
    readiness, prompt, suppressed, stalled, effortInflation, clean,
    last, prev, config: cfg, trainingAge,
    insistence: INSISTENCE[trainingAge] || "normal",
    // F.10 — an advanced lifter's flat stretch is normal, not a warning.
    flatIsNormal: !stalled && trainingAge !== "novice" && stallStream.length >= STALL_SESSIONS,
    sessionCount: stream.length,
  };
}

// F.4 — what the next session's inputs should pre-fill with, per set position.
// Derived from the same advice, so the prompt and the pre-fill can never diverge.
export function prefillFor(state, exId, setIndex, opts = {}) {
  const advice = getExerciseAdvice(state, exId, opts);
  if (advice.prompt?.type === "add-load") {
    return { weight: String(advice.prompt.prefill.weight), reps: String(advice.prompt.prefill.reps) };
  }
  const sticky = state.exercises?.[exId]?.sticky;
  return { weight: sticky?.weights?.[setIndex] ?? "", reps: "" };
}

// F.5 — never blocked, always confirmable, always logged.
export function checkLoadJump(newWeight, lastTopWeight) {
  const w = parseFloat(newWeight), prev = parseFloat(lastTopWeight);
  if (!Number.isFinite(w) || !Number.isFinite(prev) || prev <= 0 || w <= prev) return { jump: false, pct: 0 };
  const ratio = (w - prev) / prev;
  return { jump: ratio > JUMP_PCT, pct: Math.round(ratio * 100) };
}

// The last comparable top weight an exercise was actually trained with — the
// baseline the jump guard compares against.
export function lastTopWeight(state, exId, beforeDate) {
  const stream = exerciseSessions(state, exId).filter(s => s.comparable && (!beforeDate || s.date < beforeDate));
  return stream.length ? stream[stream.length - 1].topWeight : 0;
}

// F.6 — the three options offered when an exercise stalls.
export function stallOptions(state, exId) {
  const cfg = exerciseConfig(state, exId);
  const top = lastTopWeight(state, exId);
  return [
    { action: "deload", weight: top ? Math.max(cfg.loadIncrement, roundTo(top * (1 - DELOAD_PCT), cfg.loadIncrement)) : 0 },
    { action: "rep-range", from: [cfg.repRangeMin, cfg.repRangeMax], to: [cfg.repRangeMin + 2, cfg.repRangeMax + 2] },
    { action: "swap" },
  ];
}

// --------------------------------------------------------------- PRs, charts

// F.1/F.3/F.8 — a PR is the best COMPARABLE WORKING set weight of a non-deload,
// really-logged day, beating everything qualifying before it.
export function detectPRs(state, date) {
  const day = state.days?.[date];
  if (!day || day.status === "assumed" || day.status === "skipped") return [];
  const prs = [];
  for (const exId of Object.keys(day.exercises || {})) {
    const sessions = exerciseSessions(state, exId).filter(s => s.comparable && !s.isDeload);
    const todays = sessions.find(s => s.date === date);
    if (!todays || todays.topWeight <= 0) continue;
    const priorBest = Math.max(0, ...sessions.filter(s => s.date < date).map(s => s.topWeight));
    if (todays.topWeight > priorBest) prs.push({ exId, weight: todays.topWeight, previous: priorBest });
  }
  return prs;
}

// F.12 — both series (top set weight x reps, and Epley e1RM) from one place.
// Non-comparable sessions are excluded; partial sessions come through flagged so
// the chart can draw them hollow and keep them out of the trend line.
export function progressionSeries(state, exId) {
  return exerciseSessions(state, exId)
    .filter(s => s.comparable && s.topWeight > 0)
    .map(s => ({
      date: s.date, week: s.week, partial: s.partial, isDeload: s.isDeload,
      weight: s.topWeight,
      reps: s.bestSet?.reps ?? null,
      loadReps: s.bestLoadReps,
      e1rm: s.e1rm,
      // trend values: null for partial sessions so the line skips them
      trendWeight: s.partial ? null : s.topWeight,
      trendE1rm: s.partial ? null : s.e1rm,
    }));
}

// Rows for the per-exercise history sheet: everything is shown, honestly flagged.
export function historyRows(state, exId) {
  return exerciseSessions(state, exId).slice().reverse().map(s => ({
    date: s.date, week: s.week, isDeload: s.isDeload, comparable: s.comparable,
    substitution: s.substitution, partial: s.partial,
    doneSets: s.doneSets, totalSets: s.totalSets,
    sets: s.sets.map(x => ({ weight: x.weight, reps: x.reps, rir: x.rir ?? null })),
    warmups: s.warmups.filter(w => w.done || w.weight),
    topWeight: s.topWeight, e1rm: s.e1rm, avgRir: s.avgRir,
  }));
}

// Best comparable working weight ever (shown in the history sheet header).
export function bestWorkingWeight(state, exId) {
  const s = exerciseSessions(state, exId).filter(x => x.comparable);
  return s.length ? Math.max(0, ...s.map(x => x.topWeight)) : 0;
}
