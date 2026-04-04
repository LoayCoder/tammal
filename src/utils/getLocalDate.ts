/**
 * Returns the current local date as "YYYY-MM-DD" using the browser's timezone.
 * Avoids the UTC-based toISOString() bug that shifts the day boundary.
 */
export function getLocalDateString(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
