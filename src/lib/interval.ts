// Slider timing: stored in seconds, entered by admins as a number + unit.

export const MIN_INTERVAL_SECONDS = 2;
export const MAX_INTERVAL_SECONDS = 60 * 60;

export type IntervalUnit = "seconds" | "minutes";

/** "2" + minutes → 120. Returns an error message instead when the value is out of range or not a number. */
export function toIntervalSeconds(value: string, unit: IntervalUnit): { seconds: number } | { error: string } {
  const n = Number(value.trim().replace(",", "."));
  if (!value.trim() || !Number.isFinite(n) || n <= 0) return { error: "Enter a number, e.g. 5 seconds or 1 minute." };
  const seconds = Math.round(unit === "minutes" ? n * 60 : n);
  if (seconds < MIN_INTERVAL_SECONDS) return { error: `The shortest interval is ${MIN_INTERVAL_SECONDS} seconds.` };
  if (seconds > MAX_INTERVAL_SECONDS) return { error: "The longest interval is 60 minutes." };
  return { seconds };
}

/** 120 → { value: "2", unit: "minutes" }; 90 → { value: "90", unit: "seconds" }. */
export function fromIntervalSeconds(seconds: number): { value: string; unit: IntervalUnit } {
  if (seconds >= 60 && seconds % 60 === 0) return { value: String(seconds / 60), unit: "minutes" };
  return { value: String(seconds), unit: "seconds" };
}

/** 5 → "5 seconds", 60 → "1 minute", 150 → "2 min 30 s". */
export function describeInterval(seconds: number): string {
  if (seconds < 60) return `${seconds} second${seconds === 1 ? "" : "s"}`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (!s) return `${m} minute${m === 1 ? "" : "s"}`;
  return `${m} min ${s} s`;
}
