

# Avoid Duplication for Question Categories and Subcategories

## What Will Change

When creating or editing a Category or Subcategory, the dialog will validate that the **name (English)**, **name (Arabic)**, and **color** are not already used by another item. Duplicate values will show inline error messages and the Save/Create button will be disabled.

For Subcategories, the uniqueness check is **scoped to the same parent category** (two different categories can have subcategories with the same name).

---

## Changes

### 1. CategoryDialog -- Add Deduplication

**File:** `src/components/questions/CategoryDialog.tsx`

- Add a new `existingCategories` prop (array of `QuestionCategory[]`)
- Compute `otherCategories` (exclude current when editing)
- Check for duplicate **name** (case-insensitive), **name_ar**, and **color**
- Show inline `text-destructive` warning messages below each conflicting field
- Add all conflict flags to the submit button `disabled` condition
- Mark taken colors with a visual indicator (e.g., a small "used" dot or reduced opacity) instead of hiding them

### 2. CategoryManagement -- Pass Existing Data

**File:** `src/pages/admin/CategoryManagement.tsx`

- Pass `existingCategories={categories}` prop to `CategoryDialog`

### 3. SubcategoryDialog -- Add Deduplication

**File:** `src/components/questions/SubcategoryDialog.tsx`

- Add a new `existingSubcategories` prop (array of `QuestionSubcategory[]`)
- Compute `siblingsInSameCategory` -- filter to same `category_id`, exclude current when editing
- Check for duplicate **name**, **name_ar**, and **color** within siblings
- Show inline warnings and block save on conflict

### 4. SubcategoryManagement -- Pass Existing Data

**File:** `src/pages/admin/SubcategoryManagement.tsx`

- Pass `existingSubcategories={allSubcategories}` prop to `SubcategoryDialog`

### 5. Add i18n Keys

**Files:** `src/locales/en.json`, `src/locales/ar.json`

New keys:
- `categories.nameTaken` -- "This name is already used by another category"
- `categories.nameArTaken` -- "This Arabic name is already used"
- `categories.colorTaken` -- "This color is already used by another category"
- `subcategories.nameTaken` -- "This name is already used in this category"
- `subcategories.nameArTaken` -- "This Arabic name is already used in this category"
- `subcategories.colorTaken` -- "This color is already used in this category"

---

## Technical Details

Validation logic for CategoryDialog:

```text
otherCategories = existingCategories.filter(c => c.id !== category?.id)

isNameTaken    = otherCategories.some(c => c.name.toLowerCase() === name.trim().toLowerCase())
isNameArTaken  = nameAr.trim() && otherCategories.some(c => c.name_ar?.toLowerCase() === nameAr.trim().toLowerCase())
isColorTaken   = otherCategories.some(c => c.color === color)

canSave = name.trim() && !isNameTaken && !isNameArTaken && !isColorTaken
```

SubcategoryDialog uses the same pattern but filters `existingSubcategories` to only siblings with matching `category_id`.

Taken colors will remain visible but show with reduced opacity + a strikethrough/badge indicator so the admin can see which are used, and the save button will be disabled if a taken color is selected.
