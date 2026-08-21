// Derived completion status. Nothing here is stored — a day record's explicit
// status ("done-manual" | "skipped" | "assumed") wins; otherwise status is
// derived from its sets. Warm-up rows never affect completion.

export function exerciseDone(dayEx) {
  if (!dayEx || !dayEx.work || dayEx.work.length === 0) return false;
  return dayEx.work.every(s => s.done);
}

export function exerciseTicked(dayEx) {
  return dayEx?.work ? dayEx.work.filter(s => s.done).length : 0;
}

// exIds: the exercise ids required for this day's workout.
export function dayStatus(day, exIds) {
  if (!day) return "open";
  if (day.status === "skipped") return "skipped";
  if (day.status === "assumed") return "assumed";
  if (day.status === "done-manual") return "done";
  if (!exIds || exIds.length === 0) return "open";
  let done = 0, any = false;
  for (const id of exIds) {
    const ex = day.exercises?.[id];
    if (exerciseDone(ex)) done++;
    if (exerciseTicked(ex) > 0) any = true;
  }
  if (done === exIds.length) return "done";
  if (any || done > 0) return "partial";
  return "open";
}

// A day-slot is "closed" (for week completion) when done/skipped/assumed, or is a rest day.
export function slotClosed(status, isRest) {
  return isRest || status === "done" || status === "skipped" || status === "assumed";
}
