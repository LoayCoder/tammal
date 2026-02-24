

# Fix: Burnout Progress Bar Appears 100% Full

## Root Cause

The progress bar width IS correctly set to 50% (for a 2.5/5 score). The visual bug is a **color collision**: in dark mode, the track background (`bg-muted`) and the fill bar (`bg-chart-4` for "Watch" zone) resolve to the **exact same HSL color** (`215 16% 46%`), making the bar look completely full.

In light mode, the colors differ enough to be distinguishable, but in dark mode they are identical.

## Solution

Stop using `bg-muted` for the track background and instead use a dedicated, contrast-safe color that will always be visually distinct from all three fill colors (`bg-chart-1`, `bg-chart-4`, `bg-destructive`).

## Changes

### 1. `src/pages/EmployeeHome.tsx` (1 line)

Change the track div background from `bg-muted` to `bg-secondary/30` which provides a translucent, neutral track that will contrast with all fill colors in both light and dark themes:

```text
Before:  <div className="relative h-3 w-full overflow-hidden rounded-full bg-muted">
After:   <div className="relative h-3 w-full overflow-hidden rounded-full bg-secondary/30">
```

## Scope

- 1 file, 1 line changed
- No database or logic changes
- Fixes visibility in both light and dark mode
