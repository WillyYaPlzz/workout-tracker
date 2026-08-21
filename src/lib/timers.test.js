import { describe, it, expect } from "vitest";
import { swStart, swPause, swElapsed, swEdit, fmtElapsed, parseElapsed, restRemaining, restAdjust, stepWeight } from "./timers";

describe("stopwatch (timestamp-based)", () => {
  const zero = { elapsedMs: 0, runningSince: null };
  it("accumulates across start/pause cycles", () => {
    let sw = swStart(zero, 1000);
    expect(swElapsed(sw, 61000)).toBe(60000);
    sw = swPause(sw, 61000);
    expect(sw).toEqual({ elapsedMs: 60000, runningSince: null });
    expect(swElapsed(sw, 999999)).toBe(60000); // paused time doesn't tick
    sw = swStart(sw, 100000);
    expect(swElapsed(sw, 130000)).toBe(90000);
  });
  it("is correct across a phone-lock gap (no interval accumulation)", () => {
    const sw = swStart(zero, 1000);
    // 45 minutes pass with the app suspended — elapsed derives purely from timestamps
    expect(swElapsed(sw, 1000 + 45 * 60000)).toBe(45 * 60000);
  });
  it("start while running and pause while paused are no-ops", () => {
    const running = swStart(zero, 1000);
    expect(swStart(running, 5000)).toBe(running);
    expect(swPause(zero, 5000)).toBe(zero);
  });
  it("edit sets elapsed and keeps running state", () => {
    const running = swStart(zero, 1000);
    const edited = swEdit(running, 10 * 60000, 2000);
    expect(edited.runningSince).toBe(2000);
    expect(swElapsed(edited, 62000)).toBe(10 * 60000 + 60000);
    const pausedEdit = swEdit(zero, 5 * 60000, 2000);
    expect(pausedEdit).toEqual({ elapsedMs: 300000, runningSince: null });
  });
  it("formats and parses times", () => {
    expect(fmtElapsed(0)).toBe("0:00");
    expect(fmtElapsed(65000)).toBe("1:05");
    expect(fmtElapsed(3725000)).toBe("1:02:05");
    expect(parseElapsed("1:05")).toBe(65000);
    expect(parseElapsed("1:02:05")).toBe(3725000);
    expect(parseElapsed("45")).toBe(45 * 60000);
    expect(parseElapsed("abc")).toBe(null);
  });
});

describe("rest timer", () => {
  it("remaining derives from the clock", () => {
    const rest = { endsAt: 100000, totalSec: 90 };
    expect(restRemaining(rest, 10000)).toBe(90);
    expect(restRemaining(rest, 99000)).toBe(1);
    expect(restRemaining(rest, 200000)).toBe(0); // long-expired stays 0
    expect(restRemaining(null, 0)).toBe(0);
  });
  it("±30 adjusts both the countdown and the remembered total (min 15s)", () => {
    let rest = { endsAt: 100000, totalSec: 90 };
    rest = restAdjust(rest, 30);
    expect(rest).toEqual({ endsAt: 130000, totalSec: 120 });
    rest = restAdjust(rest, -30);
    rest = restAdjust(rest, -30);
    rest = restAdjust(rest, -30);
    expect(rest.totalSec).toBe(30);
    rest = restAdjust(rest, -30);
    expect(rest.totalSec).toBe(15); // floor
  });
});

describe("weight stepper", () => {
  it("steps by the exercise loadIncrement", () => {
    expect(stepWeight("60", 2.5, +1)).toBe("62.5");
    expect(stepWeight("60", 5, +1)).toBe("65");
    expect(stepWeight("62.5", 2.5, -1)).toBe("60");
  });
  it("empty input steps up from zero, never goes non-positive", () => {
    expect(stepWeight("", 2.5, +1)).toBe("2.5");
    expect(stepWeight("", 2.5, -1)).toBe("");
    expect(stepWeight("2.5", 5, -1)).toBe("");
  });
});
