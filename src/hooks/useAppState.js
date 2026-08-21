import { useEffect, useReducer, useRef } from "react";
import { load, save } from "../lib/storage";
import { resolveDay, backfillCandidates, fixWeek } from "../lib/schedule";
import { WORKOUTS } from "../data/workouts";

const emptySet = () => ({ weight: "", reps: "", rir: null, done: false, doneAt: null });

function newDayRecord(workoutKey, exercises) {
  const exMap = {};
  if (workoutKey !== "REST" && WORKOUTS[workoutKey]) {
    for (const ex of WORKOUTS[workoutKey].exercises) {
      const sticky = exercises?.[ex.id]?.sticky;
      exMap[ex.id] = {
        equipment: sticky?.equipment ?? 0,
        sets: 3,
        substitution: "",
        restOverrideSec: null,
        jumpConfirmedAt: null,
        work: [emptySet(), emptySet(), emptySet()],
        warmups: [],
        notes: "",
      };
    }
  }
  return {
    workoutKey, status: "auto", skipReason: "", note: "",
    startedAt: null, completedAt: null, celebratedAt: null,
    stopwatch: { elapsedMs: 0, runningSince: null },
    exercises: exMap,
  };
}

// Ensure a day record exists (freezing its workoutKey) and return a shallow-cloned state.
function withDay(state, date) {
  if (state.days[date]) return state;
  const r = resolveDay(date, state.program, state.weeks, state.settings.weekStart);
  return { ...state, days: { ...state.days, [date]: newDayRecord(r.workoutKey, state.exercises) } };
}

function updateDay(state, date, fn) {
  const s = withDay(state, date);
  const day = fn(structuredClone(s.days[date]));
  return { ...s, days: { ...s.days, [date]: day } };
}

function reducer(state, action) {
  switch (action.type) {
    case "SETUP_PROGRAM": {
      const { weekdayMap, week, todayStr, backfill } = action;
      const program = { anchor: { date: todayStr, week }, weekdayMap, deloadEvery: 6 };
      let next = { ...state, program };
      if (backfill) {
        const days = { ...next.days };
        for (const d of backfillCandidates(todayStr, program, next.weeks, days, state.settings.weekStart)) {
          const r = resolveDay(d, program, next.weeks, state.settings.weekStart);
          days[d] = { ...newDayRecord(r.workoutKey, next.exercises), status: "assumed", celebratedAt: action.now };
        }
        next = { ...next, days };
      }
      return next;
    }
    case "SET_WEEKDAY_MAP":
      return { ...state, program: { ...state.program, weekdayMap: action.weekdayMap } };
    case "FIX_WEEK": {
      const program = fixWeek(state.program, action.todayStr, action.actualWeek, state.settings.weekStart);
      let next = { ...state, program };
      if (action.backfill) {
        const days = { ...next.days };
        for (const d of backfillCandidates(action.todayStr, program, next.weeks, days, state.settings.weekStart)) {
          const r = resolveDay(d, program, next.weeks, state.settings.weekStart);
          days[d] = { ...newDayRecord(r.workoutKey, next.exercises), status: "assumed", celebratedAt: action.now };
        }
        next = { ...next, days };
      }
      return next;
    }
    case "SET_SETTING":
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    case "TOGGLE_DELOAD": {
      const wk = state.weeks[action.week] || {};
      const current = action.isDeloadNow;
      return { ...state, weeks: { ...state.weeks, [action.week]: { ...wk, deloadOverride: !current } } };
    }
    case "SET_SWAP": {
      const wk = { ...(state.weeks[action.week] || {}) };
      if (action.pair) wk.swaps = [action.pair];
      else delete wk.swaps;
      return { ...state, weeks: { ...state.weeks, [action.week]: wk } };
    }
    case "UPDATE_EX":
      return updateDay(state, action.date, day => {
        const ex = day.exercises[action.exId];
        if (!ex) return day;
        const { field, value } = action;
        if (field === "sets") {
          const n = parseInt(value);
          ex.sets = n;
          while (ex.work.length < n) ex.work.push(emptySet());
          ex.work = ex.work.slice(0, n);
        } else if (field === "equipment") ex.equipment = parseInt(value);
        else if (field === "notes") ex.notes = value;
        else if (field === "bulkTick") {
          const to = value;
          ex.work = ex.work.map(s => ({ ...s, done: to, doneAt: to ? action.now : null }));
        } else if (field.startsWith("set-")) {
          const [, idx, prop] = field.split("-");
          ex.work[parseInt(idx)][prop] = value;
        }
        return day;
      });
    case "MARK_DAY":
      return updateDay(state, action.date, day => {
        if (action.status === "reopen") {
          day.status = "auto";
          day.skipReason = "";
          day.celebratedAt = null; // re-completing celebrates again
          day.completedAt = null;
        } else {
          day.status = action.status; // "done-manual" | "skipped"
          day.skipReason = action.skipReason || "";
          if (action.status === "done-manual") day.completedAt = day.completedAt || action.now;
        }
        return day;
      });
    case "CELEBRATED":
      return updateDay(state, action.date, day => {
        day.celebratedAt = action.now;
        day.completedAt = day.completedAt || action.now;
        return day;
      });
    case "SET_DAY_NOTE":
      return updateDay(state, action.date, day => { day.note = action.value; return day; });
    case "RESET_DAY":
      return updateDay(state, action.date, day => {
        for (const ex of Object.values(day.exercises)) {
          ex.work = ex.work.map(() => emptySet());
          ex.warmups = [];
          ex.notes = "";
          ex.substitution = "";
        }
        day.status = "auto";
        day.celebratedAt = null;
        day.completedAt = null;
        return day;
      });
    case "BUMP_MSG_INDEX":
      return { ...state, meta: { ...state.meta, msgIndex: ((state.meta.msgIndex || 0) + 1) % action.count } };
    default:
      return state;
  }
}

export function useAppState() {
  const [data, dispatch] = useReducer(reducer, null, () => load(window.localStorage));
  const t = useRef(null);
  useEffect(() => {
    clearTimeout(t.current);
    t.current = setTimeout(() => save(window.localStorage, data), 250);
    return () => clearTimeout(t.current);
  }, [data]);
  return [data, dispatch];
}
