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
