/**
 * Cached Intl formatter for Asia/Dhaka timezone.
 */
const DHAKA_FORMATTER = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Dhaka",
  year: "numeric",
  month: "numeric",
  day: "numeric",
});

/**
 * Infallible mathematical fallback for Asia/Dhaka timezone (fixed UTC+6, no DST).
 */
export function getDhakaDateFallback(date: Date = new Date()): { month: number; year: number; day: number } {
  const d = new Date(date.getTime() + 6 * 60 * 60 * 1000);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth() + 1,
    day: d.getUTCDate(),
  };
}

/**
 * Returns the date components in the Asia/Dhaka timezone for a given Date.
 * Defaults to current instant (`new Date()`).
 * Use this instead of `new Date()` for month/year defaults throughout the app.
 */
export function getDhakaDate(date: Date = new Date()): { month: number; year: number; day: number } {
  try {
    const parts = DHAKA_FORMATTER.formatToParts(date);
    let month = 0;
    let year = 0;
    let day = 0;

    for (const part of parts) {
      if (part.type === "month") month = parseInt(part.value, 10);
      else if (part.type === "year") year = parseInt(part.value, 10);
      else if (part.type === "day") day = parseInt(part.value, 10);
    }

    if (month > 0 && year > 0 && day > 0) {
      return { month, year, day };
    }
  } catch {
    // Fall back to mathematical UTC+6 projection
  }

  return getDhakaDateFallback(date);
}
