import { describe, it, expect } from "vitest";
import { greetingPeriod, pickGreeting } from "./greeting";
import { GREETINGS } from "../data/messages";

const at = (h, m = 0, day = 21) => new Date(2026, 7, day, h, m);
const pick = (now, extra = {}) => pickGreeting({ now, greetings: GREETINGS, ...extra });

describe("greeting windows", () => {
  it("morning runs 04:00 to 11:59", () => {
    expect(greetingPeriod(at(4, 0))).toBe("morning");
    expect(greetingPeriod(at(7, 30))).toBe("morning");
    expect(greetingPeriod(at(11, 59))).toBe("morning");
  });
  it("afternoon runs 12:00 to 17:59", () => {
    expect(greetingPeriod(at(12, 0))).toBe("afternoon");
    expect(greetingPeriod(at(17, 59))).toBe("afternoon");
  });
  it("night runs 18:00 through to 03:59", () => {
    expect(greetingPeriod(at(18, 0))).toBe("night");
    expect(greetingPeriod(at(23, 59))).toBe("night");
    expect(greetingPeriod(at(0, 30))).toBe("night");
    expect(greetingPeriod(at(3, 59))).toBe("night");
  });
  it("03:59 is night and 04:00 is morning", () => {
    expect(greetingPeriod(at(3, 59))).toBe("night");
    expect(greetingPeriod(at(4, 0))).toBe("morning");
  });
});

describe("the greeting itself", () => {
  it("greets by name in the morning", () => {
    const g = pick(at(9));
    expect(g.show).toBe(true);
    expect(g.period).toBe("morning");
    expect(g.message).toBe("Good Morning Leen☀️❤️");
  });
  it("uses the right set of lines for each window", () => {
    expect(GREETINGS.afternoon).toContain(pick(at(14)).message);
    expect(GREETINGS.night).toContain(pick(at(21)).message);
  });
  it("rotates through the variants", () => {
    const seen = [0, 1, 2, 3].map(i => pick(at(9), { index: i }).message);
    expect(new Set(seen).size).toBe(4);
    // and wraps around
    expect(pick(at(9), { index: 4 }).message).toBe(seen[0]);
  });
});

describe("once per day", () => {
  it("does not greet again the same day", () => {
    const first = pick(at(9));
    expect(first.show).toBe(true);
    expect(pick(at(14), { lastGreetedDate: first.date }).show).toBe(false);
    expect(pick(at(21), { lastGreetedDate: first.date }).show).toBe(false);
  });
  it("greets again the next day", () => {
    const first = pick(at(9, 0, 21));
    expect(pick(at(9, 0, 22), { lastGreetedDate: first.date }).show).toBe(true);
  });
  it("a 01:00 session belongs to the previous day, so it is not greeted twice", () => {
    // greeted on the 21st in the morning...
    const morning = pick(at(9, 0, 21));
    expect(morning.date).toBe("2026-08-21");
    // ...training at 01:00 on the 22nd is still the 21st (4 AM rollover)
    const lateNight = pick(at(1, 0, 22), { lastGreetedDate: morning.date });
    expect(lateNight.date).toBe("2026-08-21");
    expect(lateNight.show).toBe(false);
    // and 04:00 on the 22nd is a new day
    expect(pick(at(4, 0, 22), { lastGreetedDate: morning.date }).show).toBe(true);
  });
  it("respects a custom rollover hour", () => {
    const g = pick(at(5, 0, 22), { rolloverHour: 6 });
    expect(g.date).toBe("2026-08-21");
  });
  it("never shows with no lines configured", () => {
    expect(pickGreeting({ now: at(9), greetings: { morning: [] } }).show).toBe(false);
    expect(pickGreeting({ now: at(9) }).show).toBe(false);
  });
});
