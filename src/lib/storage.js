// v2 persistent state: one localStorage key ("wt2"), schema-versioned.
// (wt-lang / wt-theme keep their own tiny keys, unchanged from v1.)
// Pure where possible: functions take a Storage-like object so tests can inject one.

import { migrateV1 } from "./migrate";

export const STORAGE_KEY = "wt2";
export const SCHEMA_VERSION = 2;

export function defaultSettings() {
  return {
    rolloverHour: 4,
    sound: true,
    autoRest: true,
    wakeLock: true,
    trainingAge: "novice",
    muscleBand: { min: 10, max: 20 },
    fatigueAdviceText: { en: "", ar: "" },
    defaultRestSec: 90,
    weekStart: 1,
  };
}

export function defaultState() {
  return {
    schemaVersion: SCHEMA_VERSION,
    settings: defaultSettings(),
    program: null, // set by first-run setup: { anchor:{date,week}, weekdayMap, deloadEvery:6 }
    weeks: {},
    days: {},
    exercises: {},
    meta: { createdAt: null, migratedFrom: null, migrationLeftovers: [], lastBackupNudgeWeek: null },
  };
}

// Load state. Runs the v1 migration when wt2 is absent but old keys exist.
// Never wipes corrupt data silently — it is stashed under "wt2-corrupt" first.
export function load(storage, now = Date.now()) {
  let raw = null;
  try { raw = storage.getItem(STORAGE_KEY); } catch { /* storage unavailable */ }
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object" && parsed.schemaVersion) {
        return { ...defaultState(), ...parsed, settings: { ...defaultSettings(), ...parsed.settings } };
      }
    } catch { /* fall through to corrupt handling */ }
    try { storage.setItem(STORAGE_KEY + "-corrupt", raw); } catch {}
  }

  const state = defaultState();
  state.meta.createdAt = now;

  let wtEx = null, wtHist = null;
  try { wtEx = JSON.parse(storage.getItem("wt-ex") || "null"); } catch {}
  try { wtHist = JSON.parse(storage.getItem("wt-hist") || "null"); } catch {}
  if (wtEx || wtHist) {
    const { days, exercises, leftovers } = migrateV1({ wtEx, wtHist }, now);
    state.days = days;
    state.exercises = exercises;
    state.meta.migratedFrom = 1;
    state.meta.migrationLeftovers = leftovers;
    // v1 keys are left in place for rollback safety.
  }
  return state;
}

export function save(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* quota — nudge handled in UI */ }
}
