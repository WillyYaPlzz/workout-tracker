// The app's state reducer — pure (no React, no storage), so behavior is unit-testable.
// Day records are created lazily on first interaction, freezing their workoutKey.

import { resolveDay, backfillCandidates, fixWeek } from "./schedule";
import { swStart, swPause, swEdit } from "./timers";
import { WORKOUTS, getExercise } from "../data/workouts";

const emptySet = () => ({ weight: "", reps: "", rir: null, done: false, doneAt: null });

export function newDayRecord(workoutKey, exercises) {
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
        // Sticky pre-fill: last weight used at the same set position.
        work: [0, 1, 2].map(i => ({ ...emptySet(), weight: sticky?.weights?.[i] ?? "" })),
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

// Remember the weight logged at a set position for future pre-fill (working sets only).
function rememberSticky(state, exId, dayEx) {
  const prev = state.exercises[exId] || {};
  const sticky = { weights: [], equipment: dayEx.equipment, prescribedReps: prev.sticky?.prescribedReps ?? null };
  dayEx.work.forEach((s, i) => { sticky.weights[i] = s.weight || prev.sticky?.weights?.[i] || ""; });
  return { ...state, exercises: { ...state.exercises, [exId]: { ...prev, sticky } } };
}

// First logged set of the day starts the session (stamp + stopwatch), once.
function autoStart(day, now) {
  if (!day.startedAt) {
    day.startedAt = now;
    day.stopwatch = swStart(day.stopwatch, now);
  }
  return day;
}

function doBackfill(state, program, todayStr, now) {
  const days = { ...state.days };
  for (const d of backfillCandidates(todayStr, program, state.weeks, days, state.settings.weekStart)) {
    const r = resolveDay(d, program, state.weeks, state.settings.weekStart);
    days[d] = { ...newDayRecord(r.workoutKey, state.exercises), status: "assumed", celebratedAt: now };
  }
  return { ...state, days };
}

export function reducer(state, action) {
  switch (action.type) {
    case "SETUP_PROGRAM": {
      const { weekdayMap, week, todayStr, backfill } = action;
      const program = { anchor: { date: todayStr, week }, weekdayMap, deloadEvery: 6 };
      let next = { ...state, program };
      if (backfill) next = doBackfill(next, program, todayStr, action.now);
      return next;
    }
    case "SET_WEEKDAY_MAP":
      return { ...state, program: { ...state.program, weekdayMap: action.weekdayMap } };
    case "FIX_WEEK": {
      const program = fixWeek(state.program, action.todayStr, action.actualWeek, state.settings.weekStart);
      let next = { ...state, program };
      if (action.backfill) next = doBackfill(next, program, action.todayStr, action.now);
      return next;
    }
    case "SET_SETTING":
      return { ...state, settings: { ...state.settings, [action.key]: action.value } };
    case "TOGGLE_DELOAD": {
      const wk = state.weeks[action.week] || {};
      return { ...state, weeks: { ...state.weeks, [action.week]: { ...wk, deloadOverride: !action.isDeloadNow } } };
    }
    case "SET_SWAP": {
      const wk = { ...(state.weeks[action.week] || {}) };
      if (action.pair) wk.swaps = [action.pair];
      else delete wk.swaps;
      return { ...state, weeks: { ...state.weeks, [action.week]: wk } };
    }

    case "UPDATE_EX": {
      const next = updateDay(state, action.date, day => {
        const ex = day.exercises[action.exId];
        if (!ex) return day;
        const { field, value } = action;
        if (field === "sets") {
          const n = parseInt(value);
          ex.sets = n;
          const sticky = state.exercises[action.exId]?.sticky;
          while (ex.work.length < n) ex.work.push({ ...emptySet(), weight: sticky?.weights?.[ex.work.length] ?? "" });
          ex.work = ex.work.slice(0, n);
        } else if (field === "equipment") ex.equipment = parseInt(value);
        else if (field === "notes") ex.notes = value;
        else if (field === "substitution") ex.substitution = value;
        else if (field === "bulkTick") {
          const to = value;
          ex.work = ex.work.map(s => ({ ...s, done: to, doneAt: to ? action.now : null }));
          if (to) autoStart(day, action.now);
        } else if (field.startsWith("set-")) {
          const [, idx, prop] = field.split("-");
          ex.work[parseInt(idx)][prop] = value;
        } else if (field.startsWith("wu-")) {
          const [, idx, prop] = field.split("-");
          ex.warmups[parseInt(idx)][prop] = value;
        }
        return day;
      });
      if (action.field === "bulkTick" && action.value)
        return rememberSticky(next, action.exId, next.days[action.date].exercises[action.exId]);
      return next;
    }

    case "TICK_SET": {
      // kind: "work" | "wu"
      const next = updateDay(state, action.date, day => {
        const ex = day.exercises[action.exId];
        if (!ex) return day;
        const arr = action.kind === "wu" ? ex.warmups : ex.work;
        const s = arr[action.si];
        if (!s) return day;
        s.done = action.done;
        s.doneAt = action.done ? action.now : null;
        if (action.done) autoStart(day, action.now);
        return day;
      });
      if (action.done && action.kind === "work")
        return rememberSticky(next, action.exId, next.days[action.date].exercises[action.exId]);
      return next;
    }

    case "TICK_ALL":
      return updateDay(state, action.date, day => {
        for (const ex of Object.values(day.exercises))
          ex.work = ex.work.map(s => ({ ...s, done: true, doneAt: s.doneAt || action.now }));
        autoStart(day, action.now);
        return day;
      });

    case "ADD_WU":
      return updateDay(state, action.date, day => {
        const ex = day.exercises[action.exId];
        if (ex && ex.warmups.length < 5) ex.warmups.push({ weight: "", reps: "", done: false });
        return day;
      });
    case "REMOVE_WU":
      return updateDay(state, action.date, day => {
        const ex = day.exercises[action.exId];
        if (ex) ex.warmups.splice(action.si, 1);
        return day;
      });

    case "STOPWATCH":
      return updateDay(state, action.date, day => {
        if (action.op === "start") { day.stopwatch = swStart(day.stopwatch, action.now); day.startedAt = day.startedAt || action.now; }
        else if (action.op === "pause") day.stopwatch = swPause(day.stopwatch, action.now);
        else if (action.op === "edit") day.stopwatch = swEdit(day.stopwatch, action.value, action.now);
        return day;
      });

    case "SET_REST": {
      const exId = action.exId;
      const prev = state.exercises[exId] || {};
      return { ...state, exercises: { ...state.exercises, [exId]: { ...prev, restSec: Math.max(15, action.sec) } } };
    }

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
        day.stopwatch = swPause(day.stopwatch, action.now);
        return day;
      });
    case "SET_DAY_NOTE":
      return updateDay(state, action.date, day => { day.note = action.value; return day; });
    case "RESET_DAY":
      return updateDay(state, action.date, day => {
        for (const [exId, ex] of Object.entries(day.exercises)) {
          const sticky = state.exercises[exId]?.sticky;
          ex.work = ex.work.map((s, i) => ({ ...emptySet(), weight: sticky?.weights?.[i] ?? "" }));
          ex.warmups = [];
          ex.notes = "";
          ex.substitution = "";
        }
        day.status = "auto";
        day.celebratedAt = null;
        day.completedAt = null;
        day.startedAt = null;
        day.stopwatch = { elapsedMs: 0, runningSince: null };
        return day;
      });
    case "BUMP_MSG_INDEX":
      return { ...state, meta: { ...state.meta, msgIndex: ((state.meta.msgIndex || 0) + 1) % action.count } };
    default:
      return state;
  }
}

// Remembered rest duration for an exercise: user override, else program default.
export function restSecFor(state, exId) {
  return state.exercises[exId]?.restSec ?? getExercise(exId)?.restSec ?? state.settings.defaultRestSec;
}
