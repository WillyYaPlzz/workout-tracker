import { describe, it, expect } from "vitest";
import { weekStartOf, weekOf, weekStartDate, isDeloadWeek, resolveDay, fixWeek, backfillCandidates, firstOpenDay, validateWeekdayMap, programStart } from "./schedule";

// Anchor: 2026-08-21 (a Friday) is in week 3. Weeks start Monday.
const program = {
  anchor: { date: "2026-08-21", week: 3 },
  startDate: "2026-08-03",   // the Monday of week 1 — this user has been going since then
  weekdayMap: { 0: "REST", 1: "UB1", 2: "LB1", 3: "REST", 4: "UB2", 5: "LB2", 6: "REST" },
  deloadEvery: 6,
};

// The same programme set up by someone who only started TODAY (Friday, week 3).
const startedToday = { ...program, startDate: "2026-08-21" };

describe("week math", () => {
  it("weekStartOf returns the Monday of the week", () => {
    expect(weekStartOf("2026-08-21", 1)).toBe("2026-08-17");
    expect(weekStartOf("2026-08-17", 1)).toBe("2026-08-17");
    expect(weekStartOf("2026-08-16", 1)).toBe("2026-08-10"); // Sunday belongs to prior Monday-week
  });
  it("weekOf counts from the anchor", () => {
    expect(weekOf("2026-08-21", program)).toBe(3);
    expect(weekOf("2026-08-17", program)).toBe(3);
    expect(weekOf("2026-08-16", program)).toBe(2);
    expect(weekOf("2026-08-24", program)).toBe(4);
    expect(weekOf("2026-09-14", program)).toBe(7);
  });
  it("weekStartDate inverts weekOf", () => {
    expect(weekStartDate(3, program)).toBe("2026-08-17");
    expect(weekStartDate(1, program)).toBe("2026-08-03");
    expect(weekOf(weekStartDate(6, program), program)).toBe(6);
  });
});

describe("deload cadence", () => {
  it("every 6th week auto-deloads", () => {
    expect(isDeloadWeek(6, program, {})).toBe(true);
    expect(isDeloadWeek(12, program, {})).toBe(true);
    expect(isDeloadWeek(5, program, {})).toBe(false);
    expect(isDeloadWeek(7, program, {})).toBe(false);
  });
  it("override can force either direction", () => {
    expect(isDeloadWeek(6, program, { 6: { deloadOverride: false } })).toBe(false);
    expect(isDeloadWeek(4, program, { 4: { deloadOverride: true } })).toBe(true);
  });
});

describe("resolveDay", () => {
  it("today always shows the slot of the real weekday", () => {
    const r = resolveDay("2026-08-21", program, {}); // Friday
    expect(r).toMatchObject({ week: 3, weekday: 5, workoutKey: "LB2", isDeload: false, swapped: false });
  });
  it("rest days resolve to REST", () => {
    expect(resolveDay("2026-08-19", program, {}).workoutKey).toBe("REST"); // Wednesday
  });
  it("one-off swaps apply to that week only and are symmetric", () => {
    const weeks = { 3: { swaps: [[5, 6]] } }; // trade Friday and Saturday in week 3
    const fri = resolveDay("2026-08-21", program, weeks);
    const sat = resolveDay("2026-08-22", program, weeks);
    expect(fri.workoutKey).toBe("REST");
    expect(fri.swapped).toBe(true);
    expect(sat.workoutKey).toBe("LB2");
    expect(sat.swapped).toBe(true);
    // next week's Friday is untouched
    expect(resolveDay("2026-08-28", program, weeks)).toMatchObject({ workoutKey: "LB2", swapped: false });
  });
});

describe("wrong-week fix", () => {
  it("shifts only the anchor week so today resolves to the actual week", () => {
    const fixed = fixWeek(program, "2026-08-21", 5);
    expect(weekOf("2026-08-21", fixed)).toBe(5);
    expect(fixed.anchor.date).toBe(program.anchor.date);
    // history shifts consistently
    expect(weekOf("2026-08-16", fixed)).toBe(4);
  });
});

describe("backfillCandidates", () => {
  it("lists past scheduled workout days without records, weeks >= 1", () => {
    // today = week 3 Friday; week 1 starts 2026-08-03
    const out = backfillCandidates("2026-08-21", program, {}, {});
    expect(out[0]).toBe("2026-08-03"); // week 1 Monday = UB1
    expect(out).toContain("2026-08-20"); // yesterday (Thursday UB2)
    expect(out).not.toContain("2026-08-21"); // today excluded
    expect(out).not.toContain("2026-08-19"); // rest day excluded
    // 4 workout days per full week × 2 weeks + Mon/Tue/Thu of week 3
    expect(out.length).toBe(11);
  });
  it("skips days that already have records", () => {
    const out = backfillCandidates("2026-08-21", program, {}, { "2026-08-20": { workoutKey: "UB2" } });
    expect(out).not.toContain("2026-08-20");
  });
});

describe("programme start date", () => {
  it("nothing is back-filled from before the start", () => {
    expect(backfillCandidates("2026-08-21", startedToday, {}, {})).toEqual([]);
  });
  it("back-fill starts at the start date, not the Monday of week 1", () => {
    const midWeek = { ...program, startDate: "2026-08-05" };  // began Wednesday of week 1
    const out = backfillCandidates("2026-08-21", midWeek, {}, {});
    expect(out).not.toContain("2026-08-03");   // Monday, before the start
    expect(out).not.toContain("2026-08-04");   // Tuesday, before the start
    expect(out[0]).toBe("2026-08-06");         // Thursday, the first scheduled day after it
  });
  it("the behind-schedule banner never points before the start", () => {
    // every day open, but the user only started today
    expect(firstOpenDay("2026-08-21", startedToday, {}, () => "open")).toBe(null);
    // ...whereas a user who started earlier IS behind
    expect(firstOpenDay("2026-08-21", program, {}, () => "open")).toBe("2026-08-03");
  });
  it("resolveDay reports the boundary without changing the workout", () => {
    const before = resolveDay("2026-08-17", startedToday, {});
    expect(before.beforeStart).toBe(true);
    expect(before.workoutKey).toBe("UB1");     // still reported, so a logged day keeps its identity
    expect(resolveDay("2026-08-21", startedToday, {}).beforeStart).toBe(false);
  });
  it("falls back to the anchor date for programmes saved before this field existed", () => {
    const legacy = { anchor: { date: "2026-08-21", week: 3 }, weekdayMap: program.weekdayMap, deloadEvery: 6 };
    expect(programStart(legacy)).toBe("2026-08-21");
    expect(firstOpenDay("2026-08-21", legacy, {}, () => "open")).toBe(null);
  });
});

describe("firstOpenDay (behind-schedule banner)", () => {
  it("returns the earliest open scheduled day before today", () => {
    const status = d => (d === "2026-08-18" || d === "2026-08-20" ? "open" : "done");
    expect(firstOpenDay("2026-08-21", program, {}, status)).toBe("2026-08-18");
  });
  it("returns null when everything is closed", () => {
    expect(firstOpenDay("2026-08-21", program, {}, () => "done")).toBe(null);
  });
});

describe("validateWeekdayMap", () => {
  const KEYS = ["UB1", "LB1", "UB2", "LB2"];
  it("accepts each workout exactly once", () => {
    expect(validateWeekdayMap(program.weekdayMap, KEYS)).toBe(true);
  });
  it("rejects duplicates and missing workouts", () => {
    expect(validateWeekdayMap({ ...program.weekdayMap, 2: "UB1" }, KEYS)).toBe(false);
    expect(validateWeekdayMap({ ...program.weekdayMap, 1: "REST" }, KEYS)).toBe(false);
  });
});
