

## Problem

In `computeFirstAiderStatus()` (line 103 of `useCrisisSupport.ts`), the day name is computed as full English (`monday`, `tuesday`, etc.), but the database `weekly_rules` JSON keys use abbreviations (`mon`, `tue`, `wed`, `thu`, `fri`, `sat`, `sun`).

**Database value:**
```json
{ "mon": [{"from":"09:00","to":"17:00"}], "tue": [...], "sun": [...] }
```

**Code lookup:**
```js
const dayName = ['sunday','monday','tuesday',...][now.getDay()];
const rules = schedule.weekly_rules?.[dayName] || []; // always []
```

This means the schedule lookup **always fails**, so every first aider shows as "outside_hours" or "offline".

## Fix

One-line change on line 103 of `src/hooks/crisis/useCrisisSupport.ts`:

Change the day name array from full names to abbreviated names matching the database format:

```ts
const dayName = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
```

This aligns the lookup key with what the scheduling UI stores, and the real-time status will immediately start working correctly.

