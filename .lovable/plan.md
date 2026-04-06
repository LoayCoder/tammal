

## Fix: To-Do List crashes when clicking items

### Root Cause
Both `TodoEditSheet.tsx` (line 29) and `TodoCreateDialog.tsx` (line 28) define a reminder option with `value: ''` (empty string). Radix UI's `<Select.Item>` throws an error when given an empty string value, crashing the component inside the ErrorBoundary.

### Fix (2 files, same change)

**`src/features/workload/components/TodoEditSheet.tsx`** and **`src/features/workload/components/TodoCreateDialog.tsx`**:

1. Change `REMINDER_OPTIONS` "None" value from `''` to `'none'`
2. Update the state default from `''` to `'none'`
3. Update the save/submit logic: treat `'none'` as `null` for `reminder_offset`

In `TodoEditSheet.tsx`, also update the `useEffect` that loads the todo's reminder offset — map `null` to `'none'` instead of `''`.

