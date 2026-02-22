
# Fix: Subcategories Not Reflected When Period is Created

## Problem
When you create a Generation Period and select categories + subcategories in the dialog, the Category dropdown correctly shows "3 selected" but the Subcategory dropdown still shows "Select subcategories". This happens because:

1. After creating a period, the dropdown stays on "Freeform (No Lock)" -- the newly created period is NOT auto-selected
2. Even when a period IS selected from the dropdown, the subcategory count display works but the auto-selection flow has a gap

## Solution

### 1. Auto-select the newly created period after creation
In `AIQuestionGenerator.tsx`, after `createPeriod` succeeds, automatically set `selectedPeriodId` to the new period's ID so the user doesn't have to manually re-select it. This also triggers the category/subcategory auto-population.

### 2. Auto-populate subcategories when period is selected
Ensure that when a period is selected (either manually or auto-selected after creation), the locked subcategory IDs are properly synced to the `selectedSubcategoryIds` state, just like categories are already synced on line 314-315.

## Technical Details

### File: `src/hooks/useGenerationPeriods.ts`
- Change `createPeriod` mutation to return the created period data so the caller can get the new period's ID

### File: `src/pages/admin/AIQuestionGenerator.tsx`
- Update the `onCreatePeriod` handler to:
  - Wait for the mutation result
  - Auto-set `selectedPeriodId` to the newly created period's ID
  - Auto-set `selectedCategoryIds` from the period's `lockedCategoryIds`
  - Auto-set `selectedSubcategoryIds` from the period's `lockedSubcategoryIds`

### File: `src/components/ai-generator/ConfigPanel.tsx`
- No changes needed -- the existing logic on lines 164-165 already correctly uses `effectiveSubcategoryIds` from the selected period when `isPeriodLocked` is true. Once the period is auto-selected after creation, this will work correctly.
