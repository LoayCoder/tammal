

## Use CheckLine, ClockAlert, and XLineTop Icons in Prayer Widget

### Problem
The icons `CheckLine` and `XLineTop` were added in lucide v0.573.0, but the project uses v0.462.0. `ClockAlert` is already available.

### Changes

**1. Upgrade lucide-react** — from `0.462.0` to latest (`^1.7.0`) so `CheckLine` and `XLineTop` become available.

**2. Update icon imports in `DashboardPrayerWidget.tsx`**
- Replace `Check` → `CheckLine` (mosque attendance)
- Keep `ClockAlert` (home/work)
- Replace `XOctagon` → `XLineTop` (missed)

**3. Update progress row icon rendering** (lines 411-416)
```text
Mosque completed  → <CheckLine />
Home/Work completed → <ClockAlert />
Missed            → <XLineTop />
```

### Files Modified
1. `package.json` — upgrade `lucide-react`
2. `src/components/dashboard/DashboardPrayerWidget.tsx` — swap icon imports and usage

