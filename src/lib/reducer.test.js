import { describe, it, expect } from "vitest";
import { reducer, restSecFor } from "./reducer";
import { defaultState } from "./storage";
import { dayStatus, exerciseDone } from "./completion";
import { WORKOUTS } from "../data/workouts";

// Friday 2026-08-21 resolves to LB2 with this program (anchor week 3).
const program = {
  anchor: { date: "2026-08-21", week: 3 },
  weekdayMap: { 0: "REST", 1: "UB1", 2: "LB1", 3: "REST", 4: "UB2", 5: "LB2", 6: "REST" },
  deloadEvery: 6,
};
const D = "2026-08-21";
const LB2_IDS = WORKOUTS.LB2.exercises.map(e => e.id);

function base() {
  const s = defaultState();
  s.program = program;
  return s;
}

function tickAllSetsOf(state, exId, done = true) {
  const n = state.days[D]?.exercises[exId]?.work.length ?? 3;
  for (let i = 0; i < n; i++) state = reducer(state, { type: "TICK_SET", date: D, exId, kind: "work", si: i, done, now: 1000 + i });
  return state;
}

describe("per-set cascade", () => {
  it("day record is created lazily with frozen workoutKey", () => {
    const s = reducer(base(), { type: "TICK_SET", date: D, exId: "lb2-1", kind: "work", si: 0, done: true, now: 1 });
    expect(s.days[D].workoutKey).toBe("LB2");
  });
  it("one ticked set = partial; all sets of an exercise = exercise done", () => {
    let s = reducer(base(), { type: "TICK_SET", date: D, exId: "lb2-1", kind: "work", si: 0, done: true, now: 1 });
    expect(dayStatus(s.days[D], LB2_IDS)).toBe("partial");
    expect(exerciseDone(s.days[D].exercises["lb2-1"])).toBe(false);
    s = tickAllSetsOf(s, "lb2-1");
    expect(exerciseDone(s.days[D].exercises["lb2-1"])).toBe(true);
    expect(dayStatus(s.days[D], LB2_IDS)).toBe("partial"); // other exercises still open
  });
  it("all exercises done => day derives done (no manual action)", () => {
    let s = base();
    for (const id of LB2_IDS) s = tickAllSetsOf(s, id);
    expect(dayStatus(s.days[D], LB2_IDS)).toBe("done");
  });
  it("unticking after done makes the day partial again", () => {
    let s = base();
    for (const id of LB2_IDS) s = tickAllSetsOf(s, id);
    s = reducer(s, { type: "TICK_SET", date: D, exId: "lb2-1", kind: "work", si: 0, done: false, now: 9 });
    expect(dayStatus(s.days[D], LB2_IDS)).toBe("partial");
  });
  it("warm-up ticks never affect completion", () => {
    let s = base();
    for (const id of LB2_IDS) s = tickAllSetsOf(s, id);
    s = reducer(s, { type: "ADD_WU", date: D, exId: "lb2-1" });
    expect(dayStatus(s.days[D], LB2_IDS)).toBe("done"); // unticked WU doesn't block
    s = reducer(s, { type: "TICK_SET", date: D, exId: "lb2-1", kind: "wu", si: 0, done: true, now: 9 });
    expect(s.days[D].exercises["lb2-1"].warmups[0].done).toBe(true);
  });
  it("TICK_ALL bulk-ticks every working set of the day", () => {
    const s = reducer(base(), { type: "TICK_ALL", date: D, now: 5 });
    expect(dayStatus(s.days[D], LB2_IDS)).toBe("done");
  });
  it("manual done / skip / reopen override and restore", () => {
    let s = reducer(base(), { type: "MARK_DAY", date: D, status: "done-manual", now: 5 });
    expect(dayStatus(s.days[D], LB2_IDS)).toBe("done");
    s = reducer(s, { type: "MARK_DAY", date: D, status: "reopen" });
    expect(dayStatus(s.days[D], LB2_IDS)).toBe("open");
    expect(s.days[D].celebratedAt).toBe(null); // reopen re-arms the celebration
    s = reducer(s, { type: "MARK_DAY", date: D, status: "skipped", skipReason: "sick", now: 6 });
    expect(dayStatus(s.days[D], LB2_IDS)).toBe("skipped");
    expect(s.days[D].skipReason).toBe("sick");
  });
});

describe("session auto-start + stopwatch wiring", () => {
  it("first ticked set starts the session stopwatch and stamps startedAt", () => {
    const s = reducer(base(), { type: "TICK_SET", date: D, exId: "lb2-1", kind: "work", si: 0, done: true, now: 777 });
    expect(s.days[D].startedAt).toBe(777);
    expect(s.days[D].stopwatch.runningSince).toBe(777);
  });
  it("CELEBRATED pauses the stopwatch and stamps completion", () => {
    let s = reducer(base(), { type: "TICK_SET", date: D, exId: "lb2-1", kind: "work", si: 0, done: true, now: 1000 });
    s = reducer(s, { type: "CELEBRATED", date: D, now: 61000 });
    expect(s.days[D].stopwatch).toEqual({ elapsedMs: 60000, runningSince: null });
    expect(s.days[D].completedAt).toBe(61000);
  });
  it("STOPWATCH edit corrects elapsed time", () => {
    let s = reducer(base(), { type: "STOPWATCH", date: D, op: "start", now: 1000 });
    s = reducer(s, { type: "STOPWATCH", date: D, op: "edit", value: 600000, now: 2000 });
    expect(s.days[D].stopwatch.elapsedMs).toBe(600000);
  });
});

describe("sticky pre-fill", () => {
  it("ticking a set with weight remembers it per set position", () => {
    let s = reducer(base(), { type: "UPDATE_EX", date: D, exId: "lb2-1", field: "set-0-weight", value: "80" });
    s = reducer(s, { type: "TICK_SET", date: D, exId: "lb2-1", kind: "work", si: 0, done: true, now: 1 });
    expect(s.exercises["lb2-1"].sticky.weights[0]).toBe("80");
  });
  it("the next day's record pre-fills from sticky", () => {
    let s = reducer(base(), { type: "UPDATE_EX", date: D, exId: "lb2-1", field: "set-0-weight", value: "80" });
    s = reducer(s, { type: "TICK_SET", date: D, exId: "lb2-1", kind: "work", si: 0, done: true, now: 1 });
    const s2 = reducer(s, { type: "TICK_SET", date: "2026-08-28", exId: "lb2-1", kind: "work", si: 1, done: true, now: 2 });
    expect(s2.days["2026-08-28"].exercises["lb2-1"].work[0].weight).toBe("80");
  });
  it("RESET_DAY clears ticks but keeps the sticky pre-fill", () => {
    let s = reducer(base(), { type: "UPDATE_EX", date: D, exId: "lb2-1", field: "set-0-weight", value: "80" });
    s = reducer(s, { type: "TICK_SET", date: D, exId: "lb2-1", kind: "work", si: 0, done: true, now: 1 });
    s = reducer(s, { type: "RESET_DAY", date: D });
    expect(s.days[D].exercises["lb2-1"].work[0].done).toBe(false);
    expect(s.days[D].exercises["lb2-1"].work[0].weight).toBe("80");
    expect(s.days[D].stopwatch).toEqual({ elapsedMs: 0, runningSince: null });
  });
});

describe("rest duration memory", () => {
  it("defaults come from the program config, overrides are remembered per exercise", () => {
    let s = base();
    expect(restSecFor(s, "lb2-1")).toBe(90);
    expect(restSecFor(s, "lb2-6")).toBe(60); // calves configured shorter
    s = reducer(s, { type: "SET_REST", exId: "lb2-1", sec: 120 });
    expect(restSecFor(s, "lb2-1")).toBe(120);
    s = reducer(s, { type: "SET_REST", exId: "lb2-1", sec: 5 });
    expect(restSecFor(s, "lb2-1")).toBe(15); // floor
  });
});

describe("warm-up rows", () => {
  it("adds and removes warm-up sets (capped at 5)", () => {
    let s = base();
    for (let i = 0; i < 7; i++) s = reducer(s, { type: "ADD_WU", date: D, exId: "lb2-1" });
    expect(s.days[D].exercises["lb2-1"].warmups).toHaveLength(5);
    s = reducer(s, { type: "UPDATE_EX", date: D, exId: "lb2-1", field: "wu-0-weight", value: "30" });
    expect(s.days[D].exercises["lb2-1"].warmups[0].weight).toBe("30");
    s = reducer(s, { type: "REMOVE_WU", date: D, exId: "lb2-1", si: 0 });
    expect(s.days[D].exercises["lb2-1"].warmups).toHaveLength(4);
  });
});

// ---------------------------------------------------------------------------
// Phase 3: engine-driven actions
// ---------------------------------------------------------------------------
import { getExerciseAdvice, stallOptions } from "./engine";

function logClean(state, date, exId, weight, reps, rir, count = 3) {
  let s = state;
  for (let i = 0; i < count; i++) {
    s = reducer(s, { type: "UPDATE_EX", date, exId, field: `set-${i}-weight`, value: String(weight) });
    s = reducer(s, { type: "UPDATE_EX", date, exId, field: `set-${i}-reps`, value: String(reps) });
    s = reducer(s, { type: "UPDATE_EX", date, exId, field: `set-${i}-rir`, value: rir });
    s = reducer(s, { type: "TICK_SET", date, exId, kind: "work", si: i, done: true, now: 1000 + i });
  }
  return s;
}

describe("engine-derived pre-fill in new day records (F.4)", () => {
  it("a new day pre-fills the bumped weight and bottom-of-range reps after a clean top-range session", () => {
    let s = base();
    s = reducer(s, { type: "SET_EX_CONFIG", exId: "lb2-1", patch: { repRangeMin: 6, repRangeMax: 10, loadIncrement: 2.5 } });
    s = logClean(s, "2026-08-21", "lb2-1", 60, 10, 2);
    expect(getExerciseAdvice(s, "lb2-1", { date: "2026-08-28" }).prompt).toMatchObject({ type: "add-load", kg: 2.5 });
    // touching next Friday creates its record with the bumped pre-fill
    const next = reducer(s, { type: "UPDATE_EX", date: "2026-08-28", exId: "lb2-1", field: "notes", value: "" });
    const work = next.days["2026-08-28"].exercises["lb2-1"].work;
    expect(work.map(w => w.weight)).toEqual(["62.5", "62.5", "62.5"]);
    expect(work.map(w => w.reps)).toEqual(["6", "6", "6"]);
  });
  it("without an earned bump the pre-fill just repeats the last weights", () => {
    let s = base();
    s = reducer(s, { type: "SET_EX_CONFIG", exId: "lb2-1", patch: { repRangeMin: 6, repRangeMax: 10 } });
    s = logClean(s, "2026-08-21", "lb2-1", 60, 8, 2);   // mid-range: "add a rep"
    const next = reducer(s, { type: "UPDATE_EX", date: "2026-08-28", exId: "lb2-1", field: "notes", value: "" });
    const work = next.days["2026-08-28"].exercises["lb2-1"].work;
    expect(work.map(w => w.weight)).toEqual(["60", "60", "60"]);
    expect(work.map(w => w.reps)).toEqual(["", "", ""]);
  });
});

describe("stall actions (F.6)", () => {
  it("the deload option drops the sticky weights ~10% and restarts the stall window", () => {
    let s = base();
    for (const d of ["2026-08-07", "2026-08-14", "2026-08-21"]) s = logClean(s, d, "lb2-1", 60, 8, 2);
    expect(getExerciseAdvice(s, "lb2-1", { date: "2026-08-28" }).stalled).toBe(true);
    const deload = stallOptions(s, "lb2-1")[0];
    s = reducer(s, { type: "STALL_ACTION", exId: "lb2-1", action: "deload", payload: deload, date: "2026-08-28", now: 5000 });
    expect(s.exercises["lb2-1"].sticky.weights).toEqual(["55", "55", "55"]);
    expect(s.exercises["lb2-1"].stallActionDate).toBe("2026-08-28");
    // the stall flag clears because the window restarted
    expect(getExerciseAdvice(s, "lb2-1", { date: "2026-08-29" }).stalled).toBe(false);
    // and the reason is on the timeline
    expect(s.exercises["lb2-1"].timeline.at(-1)).toMatchObject({ type: "stall-action", detail: { action: "deload" } });
  });
  it("the rep-range option shifts the range and is recorded", () => {
    let s = base();
    s = reducer(s, { type: "SET_EX_CONFIG", exId: "lb2-1", patch: { repRangeMin: 8, repRangeMax: 12 } });
    s = reducer(s, { type: "STALL_ACTION", exId: "lb2-1", action: "rep-range", payload: { to: [10, 14] }, date: "2026-08-28", now: 5000 });
    expect(s.exercises["lb2-1"]).toMatchObject({ repRangeMin: 10, repRangeMax: 14 });
    expect(s.exercises["lb2-1"].timeline.at(-1).detail.action).toBe("rep-range");
  });
});

describe("lever changes and the jump guard", () => {
  it("changing the lever stamps from -> to on the timeline (F.7)", () => {
    let s = reducer(base(), { type: "SET_LEVER", exId: "lb2-1", lever: "load", date: "2026-08-21", now: 7000 });
    expect(s.exercises["lb2-1"].progressionLever).toBe("load");
    expect(s.exercises["lb2-1"].timeline.at(-1)).toMatchObject({ type: "lever-change", detail: { from: "double", to: "load" } });
  });
  it("a confirmed jump is stamped on the day and the timeline (F.5)", () => {
    let s = reducer(base(), { type: "CONFIRM_JUMP", date: "2026-08-21", exId: "lb2-1", pct: 17, weight: "70", now: 8000 });
    expect(s.days["2026-08-21"].exercises["lb2-1"].jumpConfirmedAt).toBe(8000);
    expect(s.exercises["lb2-1"].timeline.at(-1)).toMatchObject({ type: "jump-confirm", detail: { pct: 17 } });
  });
});

describe("weekly fatigue check-in (F.11)", () => {
  it("stores the score for the week and gates that week's prompts", () => {
    let s = base();
    s = logClean(s, "2026-08-14", "lb2-1", 60, 12, 2);   // clean top-range session, week 2
    expect(getExerciseAdvice(s, "lb2-1", { date: "2026-08-21" }).prompt).toBeTruthy();
    s = reducer(s, { type: "SET_FATIGUE", week: 3, value: 2, now: 9000 });
    expect(s.weeks[3]).toMatchObject({ fatigue: 2 });
    const advice = getExerciseAdvice(s, "lb2-1", { date: "2026-08-21" });
    expect(advice.prompt).toBe(null);
    expect(advice.suppressed.reason).toBe("fatigue");
  });
});
