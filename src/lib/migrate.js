// One-time migration from the v1 localStorage keys (wt-ex / wt-hist) into the
// v2 state shape. Pure: takes parsed objects, returns {days, exercises, leftovers}.
//
// Rules agreed with the user:
// - Sessions keep their original dates verbatim (v1 dates were UTC-derived and
//   have no timestamps to correct them with — do not re-shift).
// - All migrated sets become comparable, done working sets (rir null).
// - If the same date was logged under two workouts (v1 allowed it), keep the
//   entry with more filled sets; the loser is preserved in leftovers.

export function migrateV1({ wtEx, wtHist }, now = 0) {
  const days = {};
  const exercises = {};
  const leftovers = [];

  function filledSets(snap) {
    let n = 0;
    for (const ex of Object.values(snap || {})) for (const s of ex.setData || []) if (s.weight || s.reps) n++;
    return n;
  }

  for (const [wk, byDate] of Object.entries(wtHist || {})) {
    for (const [date, snap] of Object.entries(byDate || {})) {
      const candidate = { workoutKey: wk, snap };
      if (days[date]) {
        const keepNew = filledSets(snap) > filledSets(days[date].__snap);
        const loser = keepNew ? { date, workoutKey: days[date].workoutKey, snap: days[date].__snap } : { date, ...candidate };
        leftovers.push(loser);
        if (!keepNew) continue;
      }
      const exMap = {};
      for (const [exId, d] of Object.entries(snap || {})) {
        exMap[exId] = {
          equipment: d.equipment ?? 0,
          sets: d.sets ?? (d.setData ? d.setData.length : 3),
          substitution: "",
          restOverrideSec: null,
          jumpConfirmedAt: null,
          work: (d.setData || []).map(s => ({ weight: s.weight ?? "", reps: s.reps ?? "", rir: null, done: true, doneAt: null })),
          warmups: [],
          notes: d.notes || "",
        };
      }
      days[date] = { workoutKey: wk, status: "done-manual", skipReason: "", note: "",
        startedAt: null, completedAt: null, celebratedAt: now || 1,
        stopwatch: { elapsedMs: 0, runningSince: null }, exercises: exMap, __snap: snap };
    }
  }
  for (const d of Object.values(days)) delete d.__snap;

  // Seed sticky weights / equipment from the v1 "current inputs".
  for (const byEx of Object.values(wtEx || {})) {
    for (const [exId, d] of Object.entries(byEx || {})) {
      const weights = (d.setData || []).map(s => s.weight || "");
      if (d.equipment || weights.some(w => w)) {
        exercises[exId] = { sticky: { weights, equipment: d.equipment ?? 0, prescribedReps: null } };
      }
    }
  }

  return { days, exercises, leftovers };
}
