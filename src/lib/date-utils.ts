/**
 * Returns the current date components in the Asia/Dhaka timezone.
 * Use this instead of `new Date()` for month/year defaults throughout the app.
 */
export function getDhakaDate(): { month: number; year: number; day: number } {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(new Date());
  return {
    month: parseInt(parts.find((p) => p.type === "month")!.value, 10),
    year: parseInt(parts.find((p) => p.type === "year")!.value, 10),
    day: parseInt(parts.find((p) => p.type === "day")!.value, 10),
  };
}
