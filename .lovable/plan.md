

# Fix Gaps: Schedule Integration, Max-5-Subcategory Enforcement, and Duplicate Complexity Bug

## Issues to Fix

### Bug: Duplicate Complexity Selector
In `ConfigPanel.tsx`, lines 595-605 render a standalone complexity `<Select>` that duplicates the one already inside the non-period block (lines 581-591). When no period is selected, two complexity dropdowns appear. When a period IS selected, there's still one orphaned complexity selector.

**Fix:** Remove the duplicate complexity selector at lines 595-605. Move the standalone complexity/tone selectors inside both branches of the period conditional so they appear once regardless.

### Gap: Max 5 Subcategories Per Category
The SubcategoryDialog does not enforce the "max 5 subcategories per category" rule.

**Fix:** In `SubcategoryDialog.tsx`, before saving, count existing subcategories for the selected category. If count >= 5 and this is a new subcategory (not editing), show an error toast and prevent creation.

### Gap: Schedule Management UI Not Wired to Period
The `ScheduleManagement.tsx` page does not auto-populate dates or `questions_per_delivery` from a linked generation period, and does not show the period as a badge.

**Fix:** In the schedule creation/edit form within `ScheduleManagement.tsx`:
- When a `generation_period_id` is set on a schedule (or when the user links one):
  - Auto-fill `start_date` and `end_date` from the period
  - Pre-fill `questions_per_delivery` from the period configuration
  - Show a read-only badge displaying the linked period's date range
- Fetch generation periods data in `ScheduleManagement.tsx` to enable this

## Technical Details

### File Changes

**`src/components/ai-generator/ConfigPanel.tsx`**
- Remove duplicate complexity selector (lines 595-605)
- Ensure complexity and tone selectors appear exactly once, outside the period/non-period conditional

**`src/components/questions/SubcategoryDialog.tsx`**
- Add a count check: query existing subcategories for the selected `category_id`
- If count >= 5 and creating (not editing), disable the save button and show a warning message
- Add translation keys: `subcategories.maxPerCategory` ("Maximum 5 subcategories per category")

**`src/pages/admin/ScheduleManagement.tsx`**
- Import and use `useGenerationPeriods` to fetch periods
- In the schedule form, when `generation_period_id` is present:
  - Auto-populate `start_date` / `end_date` from the linked period (read-only)
  - Set `questions_per_delivery` from the period's questions-per-day value
  - Display a badge showing "Linked to period: {start} - {end}"
- When user selects a period from a dropdown, auto-fill these fields

**`src/locales/en.json`**
- Add: `subcategories.maxPerCategory`: "Maximum 5 subcategories per category"

**`src/locales/ar.json`**
- Add: `subcategories.maxPerCategory`: "الحد الأقصى 5 فئات فرعية لكل فئة"

