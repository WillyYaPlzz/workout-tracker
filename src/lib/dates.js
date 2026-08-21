// Local-time date helpers. Dates are plain "YYYY-MM-DD" strings derived from
// LOCAL time — never toISOString(), which uses UTC and shifts late-night dates.

export function fmtDate(d) {
  const y = d.getFullYear(), m = d.getMonth() + 1, day = d.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

// Parse "YYYY-MM-DD" as local midnight.
export function parseDate(s) {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

// The "logical" date: the day flips at rolloverHour (default 4 AM), so a 1 AM
// session still belongs to the previous day.
export function logicalDate(now = new Date(), rolloverHour = 4) {
  return fmtDate(new Date(now.getTime() - rolloverHour * 3600 * 1000));
}

export function addDays(dateStr, n) {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + n);
  return fmtDate(d);
}

// JS weekday: 0=Sunday … 6=Saturday.
export function weekdayOf(dateStr) {
  return parseDate(dateStr).getDay();
}

// Whole days from a to b (positive when b is after a). Rounded to survive DST shifts.
export function daysBetween(a, b) {
  return Math.round((parseDate(b) - parseDate(a)) / 86400000);
}
