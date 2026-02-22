

# Fix: Generate Button Disabled When Active Period is Selected

## Problem
After creating a Generation Period, the "Generate Questions" button shows a lock icon and remains disabled with the tooltip "Generation is locked while a period is active". This happens because `isGenerationLocked` is set to `true` whenever there is ANY active period for the current purpose -- even when the user has already selected that period.

## Root Cause
In `ConfigPanel.tsx` line 158:
```text
const isGenerationLocked = !!activePeriodForPurpose;
```
This disables generation whenever an active period exists, regardless of whether the user has selected it. The intended behavior should be: lock generation only if an active period exists but the user has NOT selected it (forcing them to use the period).

## Solution
Change the lock condition so that generation is only locked when an active period exists AND it is NOT the currently selected period.

### File: `src/components/ai-generator/ConfigPanel.tsx`
- Line 158: Change from:
  `const isGenerationLocked = !!activePeriodForPurpose;`
  To:
  `const isGenerationLocked = !!activePeriodForPurpose && activePeriodForPurpose.id !== selectedPeriodId;`

This means:
- If no active period exists -- unlocked (freeform mode)
- If an active period exists AND the user selected it -- unlocked (generate within the period)
- If an active period exists but user selected a different period or "Freeform" -- locked (must use active period)

