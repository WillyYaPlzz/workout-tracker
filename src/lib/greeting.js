// The once-a-day greeting. Pure: the caller supplies the clock and the last
// greeted date, so this is fully testable and has no side effects.

import { logicalDate } from "./dates";

// Local wall-clock hour decides the wording.
export function greetingPeriod(now = new Date()) {
  const h = now.getHours();
  if (h >= 4 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "afternoon";
  return "night";                                  // 18:00-23:59 and 00:00-03:59
}

// Shows at most once per LOGICAL day, so it shares the 4 AM rollover with the
// rest of the app: opening at 01:00 belongs to the previous day, and if that day
// was already greeted there is no second greeting.
export function pickGreeting({ now = new Date(), rolloverHour = 4, lastGreetedDate = null, index = 0, greetings }) {
  const date = logicalDate(now, rolloverHour);
  if (lastGreetedDate === date) return { show: false, date, period: greetingPeriod(now), message: null };
  const period = greetingPeriod(now);
  const lines = greetings?.[period] || [];
  if (lines.length === 0) return { show: false, date, period, message: null };
  return { show: true, date, period, message: lines[Math.abs(index) % lines.length] };
}
