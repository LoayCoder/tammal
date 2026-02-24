

# Separate "Questions Per Day" from Survey Purpose

## Problem
When a Generation Period is selected, the "Questions Per Day" toggle (1/2/3) and auto-calculated total appear regardless of whether the purpose is Survey or Wellness. This incorrectly applies daily scheduling constraints to Survey questions, which should have a freely admin-defined question count with no daily cap.

## Solution
Restrict the "Questions Per Day" UI and auto-calculation logic to the **wellness** purpose only. When purpose is **survey**, always show the standard question count selector -- even when a period is selected.

## Changes

### `src/components/ai-generator/ConfigPanel.tsx`
- Update the conditional at line 546 from `selectedPeriod ?` to `selectedPeriod && purpose === 'wellness' ?`
- This ensures Survey mode always shows the manual question count dropdown (1-20), while Wellness mode retains the per-day toggle with auto-calculation

### `src/pages/admin/AIQuestionGenerator.tsx`
- Update the auto-sync logic at line 182 (`if (selectedPeriod && autoQuestionCount !== questionCount)`) to only apply when `purpose === 'wellness'`
- This prevents the parent from overwriting the admin's manual question count when in Survey mode

### No database or backend changes needed
The "Questions Per Day" is purely a frontend UI control that determines how many questions to generate. No backend validation or database constraints reference this value for surveys.

## Technical Details

### ConfigPanel.tsx (line 546)
Change the conditional rendering guard:
```text
Before: selectedPeriod ? (show per-day UI) : (show manual count)
After:  selectedPeriod && purpose === 'wellness' ? (show per-day UI) : (show manual count)
```

### AIQuestionGenerator.tsx (line 182)
Add purpose guard to auto-sync:
```text
Before: if (selectedPeriod && autoQuestionCount !== questionCount)
After:  (no auto-sync needed -- the ConfigPanel handles it internally only for wellness)
```
The auto-sync in ConfigPanel at lines 182-184 already runs inside ConfigPanel, so the parent page just needs to avoid interfering. The simplest fix is ensuring the parent does not force `questionCount` updates when purpose is survey.

## Files to Modify

| File | Change |
|------|--------|
| `src/components/ai-generator/ConfigPanel.tsx` | Guard "Questions Per Day" UI behind `purpose === 'wellness'` |
| `src/pages/admin/AIQuestionGenerator.tsx` | No changes needed (auto-sync is inside ConfigPanel) |

One file, one line change.
