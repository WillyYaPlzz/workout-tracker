import { describe, it, expect } from "vitest";
import {
  getExerciseAdvice, detectPRs, progressionSeries, historyRows, checkLoadJump,
  prefillFor, exerciseSessions, isComparable, epley1RM, stallOptions, lastTopWeight,
} from "./engine";
import { setsPerMuscle, sessionVolume, weekVolume, muscleWarnings } from "./volume";
import { defaultState } from "./storage";

// ---------------------------------------------------------------- test setup
// Program: Friday = LB2 (lb2-1 Leg Press), Monday = UB1 (ub1-1 Flat Chest Press).
const program = {
  anchor: { date: "2026-08-21", week: 3 },
  weekdayMap: { 0: "REST", 1: "UB1", 2: "LB1", 3: "REST", 4: "UB2", 5: "LB2", 6: "REST" },
  deloadEvery: 6,
};

function mkState(patch = {}) {
  const s = defaultState();
  s.program = program;
  return { ...s, ...patch };
}

// sets: [weight, reps, rir?] tuples. Options: warmups, substitution, undone,
// status ("assumed"/"skipped"), exId, workoutKey.
function log(state, date, sets, opts = {}) {
  const exId = opts.exId || "lb2-1";
  const work = sets.map(([weight, reps, rir]) => ({
    weight: String(weight), reps: reps == null ? "" : String(reps),
    rir: rir ?? null, done: true, doneAt: 1,
  }));
  for (let i = 0; i < (opts.undone || 0); i++) work.push({ weight: "", reps: "", rir: null, done: false, doneAt: null });
  const day = state.days[date] || {
    workoutKey: opts.workoutKey || "LB2", status: opts.status || "auto", skipReason: "", note: "",
    startedAt: 1, completedAt: 2, celebratedAt: 2, stopwatch: { elapsedMs: 0, runningSince: null }, exercises: {},
  };
  if (opts.status) day.status = opts.status;
  day.exercises[exId] = {
    equipment: 0, sets: work.length,
    substitution: opts.substitution || "",
    restOverrideSec: opts.restOverrideSec ?? null,
    jumpConfirmedAt: null,
    work,
    warmups: (opts.warmups || []).map(([weight, reps]) => ({ weight: String(weight), reps: String(reps), done: true })),
    notes: "",
  };
  return { ...state, days: { ...state.days, [date]: day } };
}

function withConfig(state, exId, patch) {
  return { ...state, exercises: { ...state.exercises, [exId]: { ...(state.exercises[exId] || {}), ...patch } } };
}

// Fridays, one week apart.
const F1 = "2026-08-07", F2 = "2026-08-14", F3 = "2026-08-21", F4 = "2026-08-28";

// ============================================================================
// F.14 — the twelve acceptance tests, in order.
// ============================================================================

describe("F.14 acceptance tests", () => {
  it("1. a substitution note excludes that session from the PR check and the progression chart, but it still appears in history flagged 'not comparable'", () => {
    let s = mkState();
    s = log(s, F1, [[60, 8], [60, 8], [60, 8]]);
    s = log(s, F2, [[100, 8], [100, 8], [100, 8]], { substitution: "did cable instead of band" });

    // not a PR despite being an all-time-high weight
    expect(detectPRs(s, F2)).toEqual([]);
    // absent from the progression chart
    const series = progressionSeries(s, "lb2-1");
    expect(series.map(p => p.date)).toEqual([F1]);
    // still visible in history, flagged
    const rows = historyRows(s, "lb2-1");
    const row = rows.find(r => r.date === F2);
    expect(row).toBeTruthy();
    expect(row.comparable).toBe(false);
    expect(row.substitution).toBe("did cable instead of band");
    // and it cannot drive the overload prompt either
    const advice = getExerciseAdvice(s, "lb2-1", { date: F3 });
    expect(advice.last.date).toBe(F1);
  });

  it("2. 3x8 at 60 kg with all sets at RIR 2 and range 6-10 -> prompt says 'add a rep', not 'add weight'", () => {
    let s = mkState();
    s = withConfig(s, "lb2-1", { repRangeMin: 6, repRangeMax: 10 });
    s = log(s, F1, [[60, 8, 2], [60, 8, 2], [60, 8, 2]]);
    const { prompt } = getExerciseAdvice(s, "lb2-1", { date: F2 });
    expect(prompt.type).toBe("add-rep");
    expect(prompt.repRangeMax).toBe(10);
  });

  it("3. 3x10 at 60 kg, range 6-10, all at RIR >= 1 -> prompt says 'add 2.5 kg'; next session pre-fills 62.5 kg x 6", () => {
    let s = mkState();
    s = withConfig(s, "lb2-1", { repRangeMin: 6, repRangeMax: 10, loadIncrement: 2.5 });
    s = log(s, F1, [[60, 10, 1], [60, 10, 2], [60, 10, 3]]);
    const { prompt } = getExerciseAdvice(s, "lb2-1", { date: F2 });
    expect(prompt.type).toBe("add-load");
    expect(prompt.kg).toBe(2.5);
    expect(prompt.prefill).toEqual({ weight: 62.5, reps: 6 });
    // the pre-fill the next session actually shows
    expect(prefillFor(s, "lb2-1", 0, { date: F2 })).toEqual({ weight: "62.5", reps: "6" });
    expect(prefillFor(s, "lb2-1", 2, { date: F2 })).toEqual({ weight: "62.5", reps: "6" });
  });

  it("4. same load, more reps, but RIR dropped 2 -> 0: history labels it 'effort-driven' and the green readiness badge does not appear", () => {
    let s = mkState();
    s = log(s, F1, [[60, 8, 2], [60, 8, 2], [60, 8, 2]]);
    s = log(s, F2, [[60, 10, 0], [60, 10, 0], [60, 10, 0]]);
    const advice = getExerciseAdvice(s, "lb2-1", { date: F3 });
    expect(advice.effortInflation).toBe(true);
    expect(advice.readiness).not.toBe("green");
    expect(advice.readiness).toBe("amber");
    expect(advice.prompt).toBe(null);
  });

  it("5. entering 70 kg where the last session was 60 kg triggers the 10% jump confirm", () => {
    let s = mkState();
    s = log(s, F1, [[60, 8], [60, 8], [60, 8]]);
    expect(lastTopWeight(s, "lb2-1")).toBe(60);
    const check = checkLoadJump(70, lastTopWeight(s, "lb2-1"));
    expect(check.jump).toBe(true);
    expect(check.pct).toBe(17);
    // 65 kg (8.3%) is under the guard
    expect(checkLoadJump(65, 60).jump).toBe(false);
    // never blocked: it is a confirm, and going down never warns
    expect(checkLoadJump(55, 60).jump).toBe(false);
  });

  it("6. three comparable sessions at an identical best set -> the exercise flags as stalled and offers the three-option menu", () => {
    let s = mkState();
    s = log(s, F1, [[60, 8, 2], [60, 8, 2], [60, 8, 2]]);
    s = log(s, F2, [[60, 8, 2], [60, 8, 2], [60, 8, 2]]);
    s = log(s, F3, [[60, 8, 2], [60, 8, 2], [60, 8, 2]]);
    const advice = getExerciseAdvice(s, "lb2-1", { date: F4 });
    expect(advice.stalled).toBe(true);
    const options = stallOptions(s, "lb2-1").map(o => o.action);
    expect(options).toEqual(["deload", "rep-range", "swap"]);
    // the deload option is about 10% lighter, rounded to the exercise increment
    expect(stallOptions(s, "lb2-1")[0].weight).toBe(55);
    // a real improvement in the third session clears the stall
    let improved = mkState();
    improved = log(improved, F1, [[60, 8, 2], [60, 8, 2], [60, 8, 2]]);
    improved = log(improved, F2, [[60, 8, 2], [60, 8, 2], [60, 8, 2]]);
    improved = log(improved, F3, [[65, 8, 2], [65, 8, 2], [65, 8, 2]]);
    expect(getExerciseAdvice(improved, "lb2-1", { date: F4 }).stalled).toBe(false);
  });

  it("7. a deload-marked week does not break the stall counter and does not raise overload prompts", () => {
    let s = mkState();
    // three flat sessions with a deload week logged in the middle
    s = log(s, F1, [[60, 8, 2], [60, 8, 2], [60, 8, 2]]);
    s = log(s, F2, [[40, 8, 4], [40, 8, 4], [40, 8, 4]]);   // deload week session
    s = log(s, F3, [[60, 8, 2], [60, 8, 2], [60, 8, 2]]);
    s = log(s, F4, [[60, 8, 2], [60, 8, 2], [60, 8, 2]]);
    s = { ...s, weeks: { ...s.weeks, 2: { deloadOverride: true } } };  // F2 is in week 2
    const advice = getExerciseAdvice(s, "lb2-1", { date: "2026-09-04" });
    // the lighter deload session neither breaks the flat streak nor counts as one of it
    expect(advice.stalled).toBe(true);

    // during a deload week itself: no prompts, with a visible reason
    const deloadWeek = { ...s, weeks: { ...s.weeks, 5: { deloadOverride: true } } };  // 2026-09-04 is week 5
    const inDeload = getExerciseAdvice(deloadWeek, "lb2-1", { date: "2026-09-04" });
    expect(inDeload.suppressed).toEqual({ reason: "deload" });
    expect(inDeload.prompt).toBe(null);
  });

  it("8. an exercise with 4 direct + 4 indirect sets in a week counts as 6.0 sets for that muscle", () => {
    let s = mkState();
    // lb2-1 Leg Press: quads primary. lb2-2 Leg Curls: hamstrings primary, glutes secondary.
    // Use glutes: lb2-4 Glute Kickbacks (glutes primary) 4 sets, lb2-2 (glutes secondary) 4 sets.
    s = log(s, F3, [[30, 10], [30, 10], [30, 10], [30, 10]], { exId: "lb2-4" });
    s = log(s, F3, [[40, 10], [40, 10], [40, 10], [40, 10]], { exId: "lb2-2" });
    const perMuscle = setsPerMuscle(s, 3);
    expect(perMuscle.glutes).toBe(6.0);       // 4 x 1.0 + 4 x 0.5
    expect(perMuscle.hamstrings).toBe(6.0);   // 4 direct (lb2-2) + 4 indirect (lb2-4)
  });

  it("9. trainingAge = advanced with a flat month shows no stall warning", () => {
    let s = mkState();
    s = log(s, F1, [[60, 8, 2], [60, 8, 2], [60, 8, 2]]);
    s = log(s, F2, [[60, 8, 2], [60, 8, 2], [60, 8, 2]]);
    s = log(s, F3, [[60, 8, 2], [60, 8, 2], [60, 8, 2]]);
    s = log(s, F4, [[60, 8, 2], [60, 8, 2], [60, 8, 2]]);
    const advanced = { ...s, settings: { ...s.settings, trainingAge: "advanced" } };
    const advice = getExerciseAdvice(advanced, "lb2-1", { date: "2026-09-04" });
    expect(advice.stalled).toBe(false);
    expect(advice.flatIsNormal).toBe(true);
    expect(advice.insistence).toBe("low");
    // the same flat month IS a stall for a novice
    expect(getExerciseAdvice(s, "lb2-1", { date: "2026-09-04" }).stalled).toBe(true);
  });

  it("10. a fatigue check-in of 2 suppresses that week's prompts with a visible reason", () => {
    let s = mkState();
    s = log(s, F1, [[60, 10, 2], [60, 10, 2], [60, 10, 2]]);
    // without fatigue logged, the clean session earns a prompt
    expect(getExerciseAdvice(s, "lb2-1", { date: F2 }).prompt).toBeTruthy();
    // fatigue 2 in the week of F2 (week 2) suppresses it, and says why
    const tired = { ...s, weeks: { ...s.weeks, 2: { fatigue: 2 } } };
    const advice = getExerciseAdvice(tired, "lb2-1", { date: F2 });
    expect(advice.prompt).toBe(null);
    expect(advice.suppressed).toEqual({ reason: "fatigue", fatigue: 2 });
    // fatigue 3 does not suppress
    const ok = { ...s, weeks: { ...s.weeks, 2: { fatigue: 3 } } };
    expect(getExerciseAdvice(ok, "lb2-1", { date: F2 }).prompt).toBeTruthy();
  });

  it("11. a warm-up set at an all-time-high weight sets no PR", () => {
    let s = mkState();
    s = log(s, F1, [[60, 8], [60, 8], [60, 8]]);
    s = log(s, F2, [[60, 8], [60, 8], [60, 8]], { warmups: [[200, 5]] });
    expect(detectPRs(s, F2)).toEqual([]);
    // the working weight is unchanged by the warm-up
    expect(progressionSeries(s, "lb2-1").find(p => p.date === F2).weight).toBe(60);
    // and a genuine working PR still registers
    let pr = log(s, F3, [[65, 8], [65, 8], [65, 8]]);
    expect(detectPRs(pr, F3)).toEqual([{ exId: "lb2-1", weight: 65, previous: 60 }]);
  });

  it("12. assumed-done days contribute nothing to any F chart or volume figure", () => {
    let s = mkState();
    s = log(s, F1, [[60, 10], [60, 10], [60, 10]]);
    // an assumed-done day carrying (defensively) fully logged sets
    s = log(s, F2, [[999, 10], [999, 10], [999, 10]], { status: "assumed" });
    expect(exerciseSessions(s, "lb2-1").map(x => x.date)).toEqual([F1]);
    expect(progressionSeries(s, "lb2-1").map(p => p.date)).toEqual([F1]);
    expect(detectPRs(s, F2)).toEqual([]);
    expect(sessionVolume(s, F2)).toBe(0);
    expect(weekVolume(s, 2)).toBe(0);
    expect(setsPerMuscle(s, 2)).toEqual({});
    // reopening it (status back to auto) makes the retro-logged work count
    const reopened = { ...s, days: { ...s.days, [F2]: { ...s.days[F2], status: "auto" } } };
    expect(sessionVolume(reopened, F2)).toBe(999 * 30);
  });
});

// ============================================================================
// Supporting unit tests
// ============================================================================

describe("comparability (F.1)", () => {
  it("substitution or a rest override makes a session non-comparable", () => {
    expect(isComparable({ work: [], substitution: "", restOverrideSec: null })).toBe(true);
    expect(isComparable({ work: [], substitution: "band", restOverrideSec: null })).toBe(false);
    expect(isComparable({ work: [], substitution: "   ", restOverrideSec: null })).toBe(true); // whitespace only
    expect(isComparable({ work: [], substitution: "", restOverrideSec: 180 })).toBe(false);
  });
});

describe("warm-ups never count (F.3)", () => {
  it("warm-up sets are excluded from volume and set counts", () => {
    let s = mkState();
    s = log(s, F3, [[60, 10], [60, 10]], { warmups: [[30, 10], [40, 5]] });
    expect(sessionVolume(s, F3)).toBe(1200);       // 2 x 60 x 10, warm-ups ignored
    expect(setsPerMuscle(s, 3).quads).toBe(2);     // 2 working sets only
  });
});

describe("clean / partial sessions", () => {
  it("a partial session never triggers the overload prompt", () => {
    let s = mkState();
    s = log(s, F1, [[60, 10, 2], [60, 10, 2]], { undone: 1 });  // WS 2/3
    const advice = getExerciseAdvice(s, "lb2-1", { date: F2 });
    expect(advice.last.partial).toBe(true);
    expect(advice.prompt).toBe(null);
    expect(advice.readiness).toBe("amber");
  });
  it("a set logged at RIR 0 when the target floor is 2 is not clean", () => {
    let s = mkState();
    s = withConfig(s, "lb2-1", { targetRir: { min: 2, max: 3 }, repRangeMin: 6, repRangeMax: 10 });
    s = log(s, F1, [[60, 10, 2], [60, 10, 2], [60, 10, 0]]);
    const advice = getExerciseAdvice(s, "lb2-1", { date: F2 });
    expect(advice.clean).toBe(false);
    expect(advice.prompt).toBe(null);
  });
  it("no history at all yields a grey badge and no prompt", () => {
    const advice = getExerciseAdvice(mkState(), "lb2-1", { date: F1 });
    expect(advice.readiness).toBe("grey");
    expect(advice.prompt).toBe(null);
    expect(advice.sessionCount).toBe(0);
  });
});

describe("progression levers (F.7)", () => {
  it("a load-lever exercise skips the rep step", () => {
    let s = mkState();
    s = withConfig(s, "lb2-1", { progressionLever: "load", repRangeMin: 6, repRangeMax: 10 });
    s = log(s, F1, [[60, 7, 2], [60, 7, 2], [60, 7, 2]]);
    expect(getExerciseAdvice(s, "lb2-1", { date: F2 }).prompt.type).toBe("add-load");
  });
  it("a reps-lever exercise never prompts for load", () => {
    let s = mkState();
    s = withConfig(s, "lb2-1", { progressionLever: "reps", repRangeMin: 6, repRangeMax: 10 });
    s = log(s, F1, [[60, 10, 2], [60, 10, 2], [60, 10, 2]]);
    expect(getExerciseAdvice(s, "lb2-1", { date: F2 }).prompt.type).toBe("add-rep");
  });
});

describe("Epley e1RM (F.12)", () => {
  it("uses w x (1 + reps/30)", () => {
    expect(epley1RM(100, 0)).toBe(100);
    expect(epley1RM(60, 10)).toBeCloseTo(80, 5);
    expect(epley1RM(100, 30)).toBe(200);
  });
  it("partial sessions are hollow points, never trend values", () => {
    let s = mkState();
    s = log(s, F1, [[60, 10], [60, 10], [60, 10]]);
    s = log(s, F2, [[62.5, 10]], { undone: 2 });
    const series = progressionSeries(s, "lb2-1");
    expect(series[1].partial).toBe(true);
    expect(series[1].weight).toBe(62.5);      // still plotted
    expect(series[1].trendWeight).toBe(null); // but not part of the trend
    expect(series[0].trendWeight).toBe(60);
  });
});

describe("weekly muscle volume warnings (F.9)", () => {
  it("flags a second consecutive week below the band", () => {
    let s = mkState();
    s = log(s, "2026-08-14", [[60, 10], [60, 10]]);                       // week 2: 2 sets quads
    s = log(s, "2026-08-21", [[60, 10], [60, 10], [60, 10]]);             // week 3: 3 sets quads
    const w = muscleWarnings(s, 3);
    expect(w.find(x => x.muscle === "quads" && x.type === "under")).toBeTruthy();
  });
  it("flags a week-over-week jump greater than 20%", () => {
    let s = mkState();
    s = log(s, "2026-08-14", [[60, 10], [60, 10], [60, 10], [60, 10]]);   // week 2: 4 sets
    s = log(s, "2026-08-21", [[60, 10], [60, 10], [60, 10], [60, 10], [60, 10], [60, 10]]); // week 3: 6 sets
    const jump = muscleWarnings(s, 3).find(x => x.muscle === "quads" && x.type === "jump");
    expect(jump).toBeTruthy();
    expect(jump.pct).toBe(50);
  });
});
