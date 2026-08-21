import { describe, it, expect } from "vitest";
import { fmtDate, parseDate, logicalDate, addDays, weekdayOf, daysBetween } from "./dates";

describe("fmtDate / parseDate", () => {
  it("formats local dates without UTC shifting", () => {
    // 2026-08-21 00:30 local — toISOString would report the previous day in UTC+ zones
    const d = new Date(2026, 7, 21, 0, 30);
    expect(fmtDate(d)).toBe("2026-08-21");
  });
  it("round-trips", () => {
    expect(fmtDate(parseDate("2026-01-05"))).toBe("2026-01-05");
  });
});

describe("logicalDate (4 AM rollover)", () => {
  it("1 AM belongs to the previous day", () => {
    expect(logicalDate(new Date(2026, 7, 21, 1, 0), 4)).toBe("2026-08-20");
  });
  it("3:59 AM belongs to the previous day", () => {
    expect(logicalDate(new Date(2026, 7, 21, 3, 59), 4)).toBe("2026-08-20");
  });
  it("4:00 AM belongs to the same day", () => {
    expect(logicalDate(new Date(2026, 7, 21, 4, 0), 4)).toBe("2026-08-21");
  });
  it("crosses a week boundary correctly (Mon 2 AM → Sunday)", () => {
    // 2026-08-17 is a Monday
    const d = logicalDate(new Date(2026, 7, 17, 2, 0), 4);
    expect(d).toBe("2026-08-16");
    expect(weekdayOf(d)).toBe(0); // Sunday
  });
  it("respects a configurable rollover hour", () => {
    expect(logicalDate(new Date(2026, 7, 21, 1, 0), 0)).toBe("2026-08-21");
    expect(logicalDate(new Date(2026, 7, 21, 5, 30), 6)).toBe("2026-08-20");
  });
  it("crosses month and year boundaries", () => {
    expect(logicalDate(new Date(2026, 0, 1, 2, 0), 4)).toBe("2025-12-31");
  });
});

describe("addDays / daysBetween / weekdayOf", () => {
  it("adds across month boundaries", () => {
    expect(addDays("2026-08-31", 1)).toBe("2026-09-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("daysBetween is signed", () => {
    expect(daysBetween("2026-08-01", "2026-08-21")).toBe(20);
    expect(daysBetween("2026-08-21", "2026-08-01")).toBe(-20);
  });
  it("weekdayOf matches JS getDay", () => {
    expect(weekdayOf("2026-08-21")).toBe(5); // Friday
    expect(weekdayOf("2026-08-17")).toBe(1); // Monday
  });
});
