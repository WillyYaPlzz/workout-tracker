// Pure stopwatch / rest-timer math. All timestamp-based (never accumulated
// intervals), so pausing the phone or reloading cannot drift the clock.
// stopwatch shape: { elapsedMs, runningSince } — runningSince null when paused.

export function swStart(sw, now) {
  return sw.runningSince ? sw : { ...sw, runningSince: now };
}

export function swPause(sw, now) {
  return sw.runningSince ? { elapsedMs: sw.elapsedMs + (now - sw.runningSince), runningSince: null } : sw;
}

export function swElapsed(sw, now) {
  return (sw?.elapsedMs || 0) + (sw?.runningSince ? now - sw.runningSince : 0);
}

// User corrected the displayed time; keep running state.
export function swEdit(sw, newElapsedMs, now) {
  return { elapsedMs: Math.max(0, newElapsedMs), runningSince: sw.runningSince ? now : null };
}

export function fmtElapsed(ms) {
  const s = Math.floor(ms / 1000), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const mm = String(m).padStart(2, "0"), ss = String(sec).padStart(2, "0");
  return h > 0 ? `${h}:${mm}:${ss}` : `${m}:${ss}`;
}

// Parse "mm:ss" or "h:mm:ss" (also plain minutes "45") into ms; null if invalid.
export function parseElapsed(text) {
  const parts = String(text).trim().split(":").map(p => p.trim());
  if (parts.some(p => p === "" || isNaN(Number(p)))) return null;
  const nums = parts.map(Number);
  if (nums.length === 1) return nums[0] * 60000;
  if (nums.length === 2) return (nums[0] * 60 + nums[1]) * 1000;
  if (nums.length === 3) return (nums[0] * 3600 + nums[1] * 60 + nums[2]) * 1000;
  return null;
}

// Rest countdown: stored as { endsAt, totalSec }. Remaining is derived from the clock.
export function restRemaining(rest, now) {
  return rest ? Math.max(0, Math.ceil((rest.endsAt - now) / 1000)) : 0;
}

export function restAdjust(rest, deltaSec) {
  return { ...rest, endsAt: rest.endsAt + deltaSec * 1000, totalSec: Math.max(15, rest.totalSec + deltaSec) };
}

// ± stepper beside a weight input. Empty stays empty on minus; steps by `inc`.
export function stepWeight(value, inc, dir) {
  const v = (parseFloat(value) || 0) + dir * inc;
  if (v <= 0) return "";
  return String(Math.round(v * 100) / 100);
}
