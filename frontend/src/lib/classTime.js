// ─── Class times: minutes since midnight, formatting and the editor's form ──

/** Minutes since midnight a class starts at. */
export const startOf = (b) => b.start_hour * 60 + (b.start_minute || 0);

/** Length in minutes; classes made before minutes existed only have whole hours. */
export const lengthOf = (b) => b.duration_minutes ?? b.duration * 60;

export const endOf = (b) => startOf(b) + lengthOf(b);

/** 570 → "09:30" (the value an <input type="time"> uses). */
export function toTimeValue(minutes) {
  const m = Math.max(0, Math.min(minutes, 24 * 60 - 1));
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** "09:30" → 570; null when empty or malformed. */
export function fromTimeValue(value) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value || "");
  if (!match) return null;
  const h = +match[1], m = +match[2];
  return h < 24 && m < 60 ? h * 60 + m : null;
}

/** 570 → "9:30 AM", 0 → "12:00 AM", 1440 → "12:00 AM" (midnight end). */
export function formatClock(minutes) {
  const m = ((minutes % (24 * 60)) + 24 * 60) % (24 * 60);
  const h = Math.floor(m / 60), mm = m % 60;
  return `${h % 12 || 12}:${String(mm).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

/** 40 → "40 min", 60 → "1 hr", 100 → "1 hr 40 min", 120 → "2 hrs". */
export function formatLength(minutes) {
  const h = Math.floor(minutes / 60), m = minutes % 60;
  const hrs = h ? `${h} hr${h > 1 ? "s" : ""}` : "";
  return [hrs, m ? `${m} min` : ""].filter(Boolean).join(" ") || "0 min";
}

/** Quick lengths offered under the time fields. */
export const QUICK_LENGTHS = [30, 45, 60, 90, 120, 180];

export const MIN_LENGTH = 5;
export const MAX_LENGTH = 12 * 60;

/** Checks a start/end pair from the form; returns an error message or null. */
export function checkTimes(start, end) {
  if (start == null || end == null) return "Pick a start and end time";
  if (end <= start) return "The class has to end after it starts";
  if (end - start < MIN_LENGTH) return `A class needs to be at least ${MIN_LENGTH} minutes`;
  if (end - start > MAX_LENGTH) return "A class can be at most 12 hours";
  return null;
}

/** The API body for a class from the editor's start/end minutes. `duration` (whole hours) keeps older servers happy. */
export function toPayload({ label, day_of_week, start, end, color }) {
  const length = end - start;
  return {
    label: label.trim(),
    day_of_week,
    start_hour: Math.floor(start / 60),
    start_minute: start % 60,
    duration_minutes: length,
    duration: Math.min(12, Math.max(1, Math.ceil(length / 60))),
    color,
  };
}

/** True when a class overlaps the hour starting at `hour` (for hour-grid views). */
export const overlapsHour = (b, hour) => startOf(b) < (hour + 1) * 60 && endOf(b) > hour * 60;
