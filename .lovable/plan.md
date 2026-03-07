

# Fix: Block Saving Criteria When Total Weight Exceeds 100%

## Problem
The `CriteriaEditor` shows a warning when total weight != 100%, but the **Save button is not disabled** — users can still add criteria that push the total beyond 100%.

## Changes

### `src/components/recognition/CriteriaEditor.tsx`

1. **Calculate projected total** including the new criterion's weight before saving:
   ```
   const projectedTotal = totalWeight + newWeight;
   ```

2. **Disable the Save button** when projected total exceeds 1.0 (100%):
   ```
   disabled={!newName || createCriterion.isPending || (totalWeight + newWeight) > 1.005}
   ```

3. **Show a warning** on the new criterion form when the projected total would exceed 100%, informing the user to reduce the weight.

4. **Dynamically cap the slider max** so the user cannot set a weight higher than the remaining available weight:
   ```
   const remainingWeight = Math.max(0.05, 1 - totalWeight);
   // Slider max = remainingWeight * 100, and default newWeight clamped to remaining
   ```

5. **Also disable the "Add" button** when total weight is already at or above 100% — no point opening the add form if there's no room.

These are all changes within the single `CriteriaEditor.tsx` file.

