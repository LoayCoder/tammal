
Goal: fix why Islamic Calendar always shows “No notable events this month” and “No recommended fasting days this month,” and ensure week/month view remains usable.

What I found
- The issue is not the visual cards themselves; it is a data parsing failure in the calendar hook.
- In `src/hooks/spiritual/useHijriCalendar.ts`, the API mapper currently expects:
  - `json.data[].date.hijri`
  - `json.data[].date.gregorian`
- But the actual API response currently returns:
  - `json.data[].hijri`
  - `json.data[].gregorian`
- Because of this mismatch, the query throws during `.map(...)`, `calendarDays` becomes unavailable, and the UI falls back to empty states for:
  - calendar grid cells
  - Islamic events list
  - recommended fasting list
- The week/month toggle is already present in `src/pages/spiritual/IslamicCalendar.tsx`; it appears but cannot show useful content when data is empty.

Implementation plan

1) Fix response parsing in the Hijri calendar hook
- File: `src/hooks/spiritual/useHijriCalendar.ts`
- Update the response typing and mapping logic to support the real response shape.
- Make parsing defensive by supporting both shapes (for compatibility):
  - `entry.hijri` / `entry.gregorian` (current API)
  - `entry.date?.hijri` / `entry.date?.gregorian` (legacy/alternate shape)
- Build `gregorian` date string using returned `gregorian.year`, `gregorian.month.number`, and `gregorian.day` when available, instead of assuming requested month/year.
- If a row is malformed, skip it safely instead of crashing the whole query.

2) Prevent silent “all empty” UI when request fails
- File: `src/pages/spiritual/IslamicCalendar.tsx`
- Read `error` state from `useHijriCalendar`.
- Add a user-facing error banner/card in the calendar section when data fetch/parsing fails (localized text).
- Keep existing empty-state messages only for genuine “no matching events/fasting days,” not for technical failures.

3) Verify event and fasting derivation logic after parser fix
- Ensure `enrichedDays` uses parsed rows and correctly computes:
  - Islamic event lookup (`ISLAMIC_EVENTS`)
  - White days (13/14/15 Hijri)
  - Sunnah days (Mon/Thu)
- This should immediately repopulate:
  - Events & notable days
  - Recommended fasting days
  - visual indicators in month/week grid

4) Keep week/month controls visible and functional
- Confirm tabs remain unchanged and bound to `calendarView`.
- Ensure both views render real date cells after the data fix.
- No UI redesign required; only data reliability + failure handling.

Files to modify
- `src/hooks/spiritual/useHijriCalendar.ts`
- `src/pages/spiritual/IslamicCalendar.tsx`

Acceptance criteria
- Calendar grid shows actual day cells for selected month.
- Events card no longer always shows “no notable events” when matching dates exist.
- Recommended fasting card shows Monday/Thursday and White Days where applicable.
- Week and month tabs both display populated data.
- If API shape changes or fails, user sees a clear error state instead of misleading empty content.

Technical notes
- This is a frontend-only fix; no backend/database changes required.
- No changes to authentication, RLS, or cloud functions.
- Existing RTL/LTR behavior and current visual style will be preserved.
