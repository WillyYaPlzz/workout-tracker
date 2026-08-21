import { describe, it, expect } from "vitest";
import { migrateV1 } from "./migrate";
import { load, save, isQuotaError, storageBytes, exportPayload, defaultState, STORAGE_KEY } from "./storage";

const v1Hist = {
  UB1: {
    "2026-08-10": {
      "ub1-1": { equipment: 1, sets: 3, setData: [{ weight: "40", reps: "10" }, { weight: "40", reps: "9" }, { weight: "37.5", reps: "8" }], maxWeight: 40, notes: "felt good" },
    },
  },
  LB1: {
    "2026-08-11": { "lb1-1": { equipment: 0, sets: 2, setData: [{ weight: "60", reps: "8" }, { weight: "60", reps: "8" }], maxWeight: 60, notes: "" } },
  },
};

describe("migrateV1", () => {
  it("keeps dates verbatim and marks days done-manual", () => {
    const { days } = migrateV1({ wtHist: v1Hist }, 123);
    expect(Object.keys(days).sort()).toEqual(["2026-08-10", "2026-08-11"]);
    expect(days["2026-08-10"].workoutKey).toBe("UB1");
    expect(days["2026-08-10"].status).toBe("done-manual");
    expect(days["2026-08-10"].celebratedAt).toBe(123); // never re-celebrates on load
  });
  it("converts sets to comparable, done working sets with no warmups", () => {
    const { days } = migrateV1({ wtHist: v1Hist });
    const ex = days["2026-08-10"].exercises["ub1-1"];
    expect(ex.work).toHaveLength(3);
    expect(ex.work[0]).toMatchObject({ weight: "40", reps: "10", rir: null, done: true });
    expect(ex.warmups).toEqual([]);
    expect(ex.substitution).toBe("");
    expect(ex.restOverrideSec).toBe(null);
    expect(ex.notes).toBe("felt good");
  });
  it("same date under two workouts: keeps the richer entry, preserves the loser", () => {
    const dup = {
      UB1: { "2026-08-10": v1Hist.UB1["2026-08-10"] },
      UB2: { "2026-08-10": { "ub2-1": { equipment: 0, sets: 3, setData: [{ weight: "30", reps: "" }, { weight: "", reps: "" }, { weight: "", reps: "" }] } } },
    };
    const { days, leftovers } = migrateV1({ wtHist: dup });
    expect(days["2026-08-10"].workoutKey).toBe("UB1"); // 3 filled sets beats 1
    expect(leftovers).toHaveLength(1);
    expect(leftovers[0].workoutKey).toBe("UB2");
  });
  it("seeds sticky weights from wt-ex current inputs", () => {
    const wtEx = { UB1: { "ub1-1": { equipment: 2, sets: 3, setData: [{ weight: "42.5", reps: "" }, { weight: "40", reps: "" }, { weight: "", reps: "" }], notes: "", completed: false } } };
    const { exercises } = migrateV1({ wtEx });
    expect(exercises["ub1-1"].sticky).toMatchObject({ weights: ["42.5", "40", ""], equipment: 2 });
  });
  it("handles empty/absent input", () => {
    expect(migrateV1({})).toMatchObject({ days: {}, exercises: {}, leftovers: [] });
  });
});

function fakeStorage(init = {}) {
  const m = new Map(Object.entries(init));
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: k => m.delete(k), _m: m };
}

describe("storage.load", () => {
  it("migrates v1 keys on first load and leaves them in place", () => {
    const s = fakeStorage({ "wt-hist": JSON.stringify(v1Hist) });
    const state = load(s, 999);
    expect(state.meta.migratedFrom).toBe(1);
    expect(Object.keys(state.days)).toHaveLength(2);
    expect(s.getItem("wt-hist")).not.toBe(null); // rollback safety
    expect(state.program).toBe(null); // setup still required
  });
  it("returns existing v2 state untouched", () => {
    const s = fakeStorage();
    const st = load(s);
    st.program = { anchor: { date: "2026-08-21", week: 3 }, weekdayMap: {}, deloadEvery: 6 };
    s.setItem(STORAGE_KEY, JSON.stringify(st));
    const again = load(s);
    expect(again.program.anchor.week).toBe(3);
  });
  it("stashes corrupt payloads instead of silently wiping", () => {
    const s = fakeStorage({ [STORAGE_KEY]: "{not json" });
    const state = load(s);
    expect(state.days).toEqual({});
    expect(s.getItem(STORAGE_KEY + "-corrupt")).toBe("{not json");
  });
  it("fills in new default settings on older v2 payloads", () => {
    const s = fakeStorage({ [STORAGE_KEY]: JSON.stringify({ schemaVersion: 2, settings: { rolloverHour: 5 } }) });
    const state = load(s);
    expect(state.settings.rolloverHour).toBe(5);
    expect(state.settings.trainingAge).toBe("novice");
  });
});

// ---------------------------------------------------------------------------
// A failed write must never pass unnoticed
// ---------------------------------------------------------------------------
function throwingStorage(err) {
  const m = new Map();
  return { getItem: k => (m.has(k) ? m.get(k) : null), setItem: () => { throw err; }, removeItem: k => m.delete(k) };
}

describe("storage.save reports failures", () => {
  it("reports success with the byte count", () => {
    const s = fakeStorage();
    const r = save(s, defaultState());
    expect(r.ok).toBe(true);
    expect(r.bytes).toBeGreaterThan(0);
    expect(s.getItem(STORAGE_KEY)).toBeTruthy();
  });
  it("reports a full quota instead of swallowing it", () => {
    const err = new Error("exceeded");
    err.name = "QuotaExceededError";
    const r = save(throwingStorage(err), defaultState());
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("quota");
  });
  it("reports blocked storage (private window / site data off)", () => {
    const r = save(throwingStorage(new Error("access denied")), defaultState());
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("blocked");
  });
  it("reports a serialization failure rather than throwing", () => {
    const cyclic = defaultState();
    cyclic.days.self = cyclic;
    const r = save(fakeStorage(), cyclic);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("serialize");
  });
  it("recognises the quota error shapes browsers actually throw", () => {
    expect(isQuotaError({ name: "QuotaExceededError" })).toBe(true);
    expect(isQuotaError({ name: "NS_ERROR_DOM_QUOTA_REACHED" })).toBe(true);
    expect(isQuotaError({ code: 22 })).toBe(true);
    expect(isQuotaError({ code: 1014 })).toBe(true);
    expect(isQuotaError(new Error("something else"))).toBe(false);
    expect(isQuotaError(null)).toBe(false);
  });
});

describe("backup export", () => {
  it("produces a restorable JSON payload of the whole state", () => {
    const state = defaultState();
    state.program = { anchor: { date: "2026-08-21", week: 3 }, weekdayMap: {}, deloadEvery: 6 };
    const parsed = JSON.parse(exportPayload(state));
    expect(parsed.app).toBe("workout-tracker");
    expect(parsed.exportedAt).toBeTruthy();
    expect(parsed.state.program.anchor.week).toBe(3);
  });
  it("reports how much space the data uses", () => {
    const s = fakeStorage();
    expect(storageBytes(s)).toBe(0);
    save(s, defaultState());
    expect(storageBytes(s)).toBeGreaterThan(50);
  });
});
