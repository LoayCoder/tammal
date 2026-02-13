

# Enhanced Category/Subcategory Multi-Select and Focus Areas Removal

## Overview

Replace the single-select Category/Subcategory dropdowns with multi-select checkboxes, dynamically filter subcategories by selected categories, and completely remove the Focus Areas feature from frontend and backend.

---

## Part 1: Remove Focus Areas

### Files to Delete
- `src/hooks/useFocusAreas.ts`
- `src/components/ai-generator/FocusAreaManager.tsx`

### Files to Edit

**`src/components/ai-generator/ConfigPanel.tsx`**
- Remove all `FocusArea` imports, props (`focusAreas`, `onFocusAreasChange`, `focusAreaList`, `focusAreasLoading`, `onAddFocusArea`, `onUpdateFocusArea`, `onDeleteFocusArea`)
- Remove the `FocusAreaManager` component render block
- Remove the `toggleFocusArea` function

**`src/pages/admin/AIQuestionGenerator.tsx`**
- Remove `useFocusAreas` import and hook call
- Remove `focusAreas` state (`useState<string[]>([])`)
- Remove all focus-area-related props passed to `ConfigPanel`
- Update `handleGenerate` validation: instead of checking `focusAreas.length === 0`, check that at least one category is selected
- Remove `focusAreas` from the `generate()` call payload and from `handleSave` settings

**`src/hooks/useEnhancedAIGeneration.ts`**
- Remove `focusAreas` from `GenerateInput` interface
- Remove `focusAreas` from the `saveSet` settings object

**`supabase/functions/generate-questions/index.ts`**
- Remove `focusAreas` from `GenerateRequest` interface
- Remove `Focus areas: ${focusAreas.join(", ")}` from the system prompt
- Remove `focus_areas: focusAreas` from the `ai_generation_logs` insert
- Remove `focusAreas` from the settings object in the log

**Generate Button**: Change disabled condition from `focusAreas.length === 0` to `selectedCategoryIds.length === 0` (at least one category must be selected).

---

## Part 2: Multi-Select Categories and Subcategories

### Approach
Replace single `<Select>` dropdowns with a checkbox-based multi-select using a `Popover` + scrollable checkbox list (no new dependencies needed -- uses existing Popover, Checkbox, and Badge components from Shadcn).

### State Changes

**`src/pages/admin/AIQuestionGenerator.tsx`**
- Replace `selectedCategoryId: string` with `selectedCategoryIds: string[]`
- Replace `selectedSubcategoryId: string` with `selectedSubcategoryIds: string[]`

**`src/hooks/useEnhancedAIGeneration.ts`**
- Change `GenerateInput.categoryId?: string` to `categoryIds?: string[]`
- Change `GenerateInput.subcategoryId?: string` to `subcategoryIds?: string[]`

### ConfigPanel Changes

**`src/components/ai-generator/ConfigPanel.tsx`**
- Replace single select props with array props: `selectedCategoryIds: string[]`, `selectedSubcategoryIds: string[]`
- Fetch subcategories WITHOUT a filter (fetch all), then filter client-side by selected category IDs
- Replace single-select dropdowns with multi-select Popover components:

```text
Category Multi-Select:
  [Popover trigger showing selected count / badge chips]
  [Popover content with searchable checkbox list of active categories]

Subcategory Multi-Select (enabled only when categories selected):
  [Popover trigger showing selected count / badge chips]
  [Popover content with checkboxes grouped by parent category]
```

- When a category is deselected, automatically remove any subcategory selections that belonged to it

### Edge Function Changes

**`supabase/functions/generate-questions/index.ts`**
- Accept `categoryIds?: string[]` and `subcategoryIds?: string[]`
- Fetch all matching categories and subcategories from DB
- Build the prompt context: `"Categories: Cat1, Cat2. Subcategories: Sub1, Sub2. Generate questions relevant to these domains."`

### useQuestionSubcategories Hook Update

**`src/hooks/useQuestionSubcategories.ts`**
- Change the optional `categoryId` filter parameter to accept `categoryIds?: string[]` (array)
- Use `.in('category_id', categoryIds)` when filtering

---

## Part 3: Localization Updates

Add/update keys in `en.json` and `ar.json`:

| Key | English | Arabic |
|-----|---------|--------|
| aiGenerator.selectCategories | Select categories | اختر التصنيفات |
| aiGenerator.selectSubcategories | Select subcategories | اختر التصنيفات الفرعية |
| aiGenerator.categoriesSelected | {count} selected | {count} محدد |
| aiGenerator.selectAtLeastOneCategory | Select at least one category | اختر تصنيف واحد على الأقل |
| aiGenerator.searchCategories | Search categories... | ابحث في التصنيفات... |
| aiGenerator.searchSubcategories | Search subcategories... | ابحث في التصنيفات الفرعية... |

Remove all `aiGenerator.focusArea*` and `aiGenerator.areas.*` keys from both locale files.

---

## Technical Details

### Multi-Select UI Component Pattern

Using existing Shadcn Popover + Checkbox + Badge:

```text
<Popover>
  <PopoverTrigger>
    <Button variant="outline">
      {selectedIds.length === 0 ? placeholder : `${selectedIds.length} selected`}
    </Button>
  </PopoverTrigger>
  <PopoverContent>
    <Input placeholder="Search..." />  // optional search filter
    <ScrollArea className="h-[200px]">
      {items.map(item => (
        <label className="flex items-center gap-2">
          <Checkbox checked={selectedIds.includes(item.id)} onCheckedChange={toggle} />
          <span>{item.name}</span>
        </label>
      ))}
    </ScrollArea>
  </PopoverContent>
</Popover>
```

### Subcategory Dynamic Filtering

The `useQuestionSubcategories` hook will be called without a filter. Client-side filtering in ConfigPanel:

```text
const filteredSubcategories = allSubcategories.filter(
  s => s.is_active && selectedCategoryIds.includes(s.category_id)
);
```

When a category is unchecked, auto-remove orphaned subcategory selections:

```text
onSelectedCategoryIdsChange((prev) => {
  const next = toggle(prev, categoryId);
  // Remove subcategories whose parent was just removed
  const removed = prev.filter(id => !next.includes(id));
  if (removed.length > 0) {
    onSelectedSubcategoryIdsChange(subs =>
      subs.filter(sid => !allSubcategories.find(s => s.id === sid && removed.includes(s.category_id)))
    );
  }
  return next;
});
```

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| Delete | `src/hooks/useFocusAreas.ts` | Remove Focus Areas hook |
| Delete | `src/components/ai-generator/FocusAreaManager.tsx` | Remove Focus Areas UI |
| Edit | `src/components/ai-generator/ConfigPanel.tsx` | Remove FocusAreas, add multi-select |
| Edit | `src/pages/admin/AIQuestionGenerator.tsx` | Remove FocusAreas state, update props |
| Edit | `src/hooks/useEnhancedAIGeneration.ts` | Update GenerateInput interface |
| Edit | `src/hooks/useQuestionSubcategories.ts` | Support array category filter |
| Edit | `supabase/functions/generate-questions/index.ts` | Remove focusAreas, support multi category/subcategory |
| Edit | `src/locales/en.json` | Add/remove i18n keys |
| Edit | `src/locales/ar.json` | Add/remove i18n keys |

