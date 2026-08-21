import { describe, it, expect } from "vitest";
import { streak, adherence, weeksDone, skippedCount, totalGymTimeMs, overallCompletion, heatmap, durationSeries, setsPerWeekSeries, notesTimeline, deloadCycle } from "./stats";
import { importPayload, exportPayload, defaultState } from "./storage";
import { WORKOUTS } from "../data/workouts";

const program = {
  anchor: { date: "2026-08-21", week: 3 },
  startDate: "2026-08-17",   // began on the Monday of week 3
  weekdayMap: { 0: "REST", 1: "UB1", 2: "LB1", 3: "REST", 4: "UB2", 5: "LB2", 6: "REST" },
  deloadEvery: 6,
};
function base() { const s = defaultState(); s.program = program; return s; }

// A fully logged day for the workout scheduled on that date.
function done(state, date, key, opts = {}) {
  const exercises = {};
  for (const e of WORKOUTS[key].exercises) {
    exercises[e.id] = { equipment: 0, sets: 3, substitution: "", restOverrideSec: null, jumpConfirmedAt: null,
      work: [0,1,2].map(() => ({ weight: "60", reps: "10", rir: 2, done: !opts.partial, doneAt: 1 })),
      warmups: [], notes: "" };
  }
  if (opts.partial) exercises[WORKOUTS[key].exercises[0].id].work[0].done = true;
  return { ...state, days: { ...state.days, [date]: {
    workoutKey: key, status: opts.status || "auto", skipReason: opts.skipReason || "", note: opts.note || "",
    startedAt: 1, completedAt: opts.completedAt ?? 2, celebratedAt: 2,
    stopwatch: { elapsedMs: opts.minutes ? opts.minutes * 60000 : 0, runningSince: null }, exercises } } };
}

// Week 3 = Mon 2026-08-17 .. Sun 08-23. UB1 Mon, LB1 Tue, UB2 Thu, LB2 Fri.
describe("streak", () => {
  it("counts back over workout days and steps over rest days", () => {
    let s = base();
    s = done(s, "2026-08-17", "UB1");
    s = done(s, "2026-08-18", "LB1");
    s = done(s, "2026-08-20", "UB2");   // Wed 19th is a rest day
    expect(streak(s, "2026-08-20")).toBe(3);
  });
  it("an unfinished today does not break a live streak", () => {
    let s = base();
    s = done(s, "2026-08-17", "UB1");
    s = done(s, "2026-08-18", "LB1");
    expect(streak(s, "2026-08-20")).toBe(2);   // Thursday not started yet
  });
  it("a missed workout day ends it", () => {
    let s = base();
    s = done(s, "2026-08-17", "UB1");
    s = done(s, "2026-08-20", "UB2");   // Tuesday 18th missed
    expect(streak(s, "2026-08-20")).toBe(1);
  });
  it("a skipped day breaks the streak", () => {
    let s = base();
    s = done(s, "2026-08-17", "UB1");
    s = done(s, "2026-08-18", "LB1", { status: "skipped" });
    s = done(s, "2026-08-20", "UB2");
    expect(streak(s, "2026-08-20")).toBe(1);
  });
});

describe("adherence", () => {
  it("counts done and assumed days, over scheduled days up to yesterday", () => {
    let s = base();
    s = done(s, "2026-08-17", "UB1");
    s = done(s, "2026-08-18", "LB1", { status: "assumed" });
    s = done(s, "2026-08-20", "UB2", { status: "skipped" });
    const a = adherence(s, "2026-08-21");
    expect(a.scheduled).toBe(3);   // Mon, Tue, Thu (Friday is today)
    expect(a.done).toBe(2);
    expect(a.pct).toBe(67);
  });
  it("is null with nothing scheduled yet", () => {
    const s = { ...base(), program: { ...program, anchor: { date: "2026-08-21", week: 1 } } };
    expect(adherence(s, "2026-08-17").pct).toBe(null);
  });
});

describe("weeks done / skipped / gym time / completion", () => {
  it("a week counts as done only when all seven slots are closed", () => {
    let s = base();
    for (const [d, k] of [["2026-08-17","UB1"],["2026-08-18","LB1"],["2026-08-20","UB2"]]) s = done(s, d, k);
    expect(weeksDone(s, "2026-08-23")).toBe(0);
    s = done(s, "2026-08-21", "LB2");
    expect(weeksDone(s, "2026-08-23")).toBe(1);
  });
  it("assumed days add no gym time but skipped days are counted", () => {
    let s = base();
    s = done(s, "2026-08-17", "UB1", { minutes: 60 });
    s = done(s, "2026-08-18", "LB1", { status: "assumed", minutes: 99 });
    s = done(s, "2026-08-20", "UB2", { status: "skipped" });
    expect(totalGymTimeMs(s)).toBe(60 * 60000);
    expect(skippedCount(s)).toBe(1);
  });
  it("overall completion counts closed slots, skipped included", () => {
    let s = base();
    s = done(s, "2026-08-17", "UB1");
    s = done(s, "2026-08-18", "LB1", { status: "skipped" });
    const c = overallCompletion(s, "2026-08-18");
    expect(c).toMatchObject({ closed: 2, total: 2, pct: 100 });
  });
});

describe("heatmap", () => {
  it("returns 7 cells per week with per-day states and today marked", () => {
    let s = base();
    s = done(s, "2026-08-17", "UB1");
    s = done(s, "2026-08-18", "LB1", { partial: true });
    const { weeks, weekdayOrder } = heatmap(s, "2026-08-21");
    expect(weekdayOrder).toEqual([1, 2, 3, 4, 5, 6, 0]);   // Monday first
    const w3 = weeks.find(w => w.week === 3);
    expect(w3.cells).toHaveLength(7);
    expect(w3.cells[0]).toMatchObject({ date: "2026-08-17", status: "done" });
    expect(w3.cells[1].status).toBe("partial");
    expect(w3.cells[2].status).toBe("rest");
    expect(w3.cells.find(c => c.isToday).date).toBe("2026-08-21");
    expect(w3.cells[6].isFuture).toBe(true);
  });
  it("marks deload weeks", () => {
    const s = { ...base(), weeks: { 3: { deloadOverride: true } } };
    expect(heatmap(s, "2026-08-21").weeks.find(w => w.week === 3).isDeload).toBe(true);
  });
});

describe("series and timeline", () => {
  it("duration trend excludes assumed days", () => {
    let s = base();
    s = done(s, "2026-08-17", "UB1", { minutes: 45 });
    s = done(s, "2026-08-18", "LB1", { status: "assumed", minutes: 99 });
    expect(durationSeries(s)).toEqual([{ date: "2026-08-17", label: "08-17", minutes: 45 }]);
  });
  it("sets per week counts logged working sets", () => {
    let s = base();
    s = done(s, "2026-08-17", "UB1");    // 7 exercises x 3 sets
    const series = setsPerWeekSeries(s, "2026-08-21", 3);
    expect(series.at(-1)).toMatchObject({ week: 3, sets: 21 });
  });
  it("notes timeline is newest first and includes skip reasons", () => {
    let s = base();
    s = done(s, "2026-08-17", "UB1", { note: "great session" });
    s = done(s, "2026-08-18", "LB1", { status: "skipped", skipReason: "sick" });
    const tl = notesTimeline(s);
    expect(tl[0]).toMatchObject({ date: "2026-08-18", skipReason: "sick" });
    expect(tl[1]).toMatchObject({ date: "2026-08-17", note: "great session" });
  });
  it("reports the position in the deload cycle", () => {
    expect(deloadCycle(base(), "2026-08-21")).toMatchObject({ position: 3, every: 6, isDeload: false });
  });
});

describe("backup import", () => {
  const backup = (() => {
    let s = base();
    s = done(s, "2026-08-17", "UB1", { completedAt: 500 });
    s = done(s, "2026-08-18", "LB1", { completedAt: 500 });
    return exportPayload(s);
  })();

  it("replace takes the file wholesale", () => {
    const r = importPayload(backup, base(), "replace");
    expect(r.ok).toBe(true);
    expect(Object.keys(r.state.days)).toHaveLength(2);
    expect(r.stats.replaced).toBe(true);
  });
  it("merge unions days and keeps the more recently worked version", () => {
    let mine = base();
    mine = done(mine, "2026-08-17", "UB1", { completedAt: 900, note: "mine is newer" });
    mine = done(mine, "2026-08-20", "UB2", { completedAt: 100 });
    const r = importPayload(backup, mine, "merge");
    expect(r.ok).toBe(true);
    expect(r.stats).toMatchObject({ added: 1, kept: 1 });     // 08-18 added, 08-17 kept (mine newer)
    expect(r.state.days["2026-08-17"].note).toBe("mine is newer");
    expect(r.state.days["2026-08-20"]).toBeTruthy();          // untouched local day survives
    expect(Object.keys(r.state.days).sort()).toEqual(["2026-08-17", "2026-08-18", "2026-08-20"]);
  });
  it("merge takes the incoming day when it is newer", () => {
    let mine = base();
    mine = done(mine, "2026-08-17", "UB1", { completedAt: 1, note: "stale" });
    const r = importPayload(backup, mine, "merge");
    expect(r.state.days["2026-08-17"].note).toBe("");
    expect(r.stats.updated).toBe(1);
  });
  it("rejects junk and non-backup JSON", () => {
    expect(importPayload("not json", base()).ok).toBe(false);
    expect(importPayload('{"hello":1}', base())).toMatchObject({ ok: false, error: "not-a-backup" });
    expect(importPayload(JSON.stringify({ app: "workout-tracker", state: { schemaVersion: 2, days: {} } }), base()).ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// The programme start date — the fix for being nagged about days before you began
// ---------------------------------------------------------------------------
describe("programme start date", () => {
  // The reported bug: set up on Friday 21/8 as week 1. Monday/Tuesday/Thursday of
  // that same calendar week also resolve to week 1, and used to be treated as owed.
  const startedFriday = {
    anchor: { date: "2026-08-21", week: 1 },
    startDate: "2026-08-21",
    weekdayMap: { 0: "REST", 1: "UB1", 2: "LB1", 3: "REST", 4: "UB2", 5: "LB2", 6: "REST" },
    deloadEvery: 6,
  };
  function friday() { const s = defaultState(); s.program = startedFriday; return s; }

  it("days before the start are not counted as missed", () => {
    const s = friday();
    expect(adherence(s, "2026-08-21")).toMatchObject({ scheduled: 0, done: 0, pct: null });
    // today itself is scheduled and still open — the earlier days simply do not exist
    expect(overallCompletion(s, "2026-08-21")).toMatchObject({ total: 1, closed: 0 });
  });
  it("only days from the start count once training begins", () => {
    let s = friday();
    s = done(s, "2026-08-21", "LB2");
    // Monday 24/8 is the next scheduled day; on Tuesday 25/8 only those two are owed
    s = done(s, "2026-08-24", "UB1");
    const a = adherence(s, "2026-08-25");
    expect(a.scheduled).toBe(2);
    expect(a.done).toBe(2);
    expect(a.pct).toBe(100);
  });
  it("a mid-week starter can still complete their first week", () => {
    let s = friday();
    s = done(s, "2026-08-21", "LB2");   // the only in-programme day of that week
    expect(weeksDone(s, "2026-08-23")).toBe(1);
  });
  it("weeks entirely before the start are not counted as done", () => {
    const s = friday();
    expect(weeksDone(s, "2026-08-23")).toBe(0);
  });
  it("the streak ends at the start date instead of being broken by it", () => {
    let s = friday();
    s = done(s, "2026-08-21", "LB2");
    expect(streak(s, "2026-08-21")).toBe(1);
  });
  it("the heatmap flags pre-start cells and starts at the start week", () => {
    const s = friday();
    const { weeks } = heatmap(s, "2026-08-21");
    expect(weeks[0].week).toBe(1);
    const cells = weeks[0].cells;
    expect(cells[0]).toMatchObject({ date: "2026-08-17", isBeforeStart: true });
    expect(cells.find(c => c.date === "2026-08-21")).toMatchObject({ isBeforeStart: false, isToday: true });
  });
  it("a back-filled day earlier than the stored start still counts", () => {
    let s = friday();
    s = done(s, "2026-08-17", "UB1", { status: "assumed" });   // retro-logged
    expect(adherence(s, "2026-08-21").scheduled).toBeGreaterThan(0);
    expect(adherence(s, "2026-08-21").done).toBe(1);
  });
  it("programmes saved before this field existed fall back to the anchor date", () => {
    const legacy = { ...startedFriday };
    delete legacy.startDate;
    const s = defaultState();
    s.program = legacy;
    // anchor.date is the day setup ran, so the same protection applies
    expect(adherence(s, "2026-08-21").scheduled).toBe(0);
  });
});
