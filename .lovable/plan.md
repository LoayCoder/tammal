

## Problem Analysis

I found **two bugs** causing the "Offline" display:

### Bug 1: No timezone conversion
The `computeFirstAiderStatus()` function uses `new Date()` (browser local time) but compares against schedule times stored in the schedule's timezone (`Asia/Riyadh`). If the browser is in a different timezone, the comparison is wrong. Even when timezones match, the function doesn't explicitly convert — it relies on luck.

**Your schedule**: Mon 09:00–17:00 (Riyadh time). At ~19:33 Riyadh time, you're legitimately outside hours. But during working hours earlier today, the previous bug (full day names) was still active, so it showed offline then too.

### Bug 2: UI only shows "Online" or "Offline"
In `FirstAidersTab.tsx` line 154–155, the badge renders only two states:
```tsx
fa.statusLabel === 'available' ? '🟢 Online' : '⚫ Offline'
```
So "outside_hours", "temporarily_unavailable", and "busy" all collapse to "Offline". User chose detailed statuses.

## Plan

### 1. Fix timezone-aware status computation (`useCrisisSupport.ts`)
Update `computeFirstAiderStatus` to convert the current time to the schedule's timezone before comparing. Use `Intl.DateTimeFormat` with the schedule's `timezone` field to get the correct local hours/minutes/day — no extra dependencies needed.

### 2. Show detailed status badges (`FirstAidersTab.tsx`)
Replace the binary Online/Offline badge with a mapping that shows all 4 states:
- `available` → 🟢 Available
- `busy` → 🟡 Busy  
- `outside_hours` → 🔵 Outside Hours
- `temporarily_unavailable` → 🟠 Unavailable
- `offline` → ⚫ Offline

Use the translation keys already added (`crisisSupport.status.available`, `.busy`, `.outside_hours`, `.temporarily_unavailable`).

### Files to edit
- `src/hooks/crisis/useCrisisSupport.ts` — timezone-aware status logic
- `src/components/crisis/FirstAidersTab.tsx` — detailed status badges

