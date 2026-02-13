

# Categories and Subcategories for AI Question Generator

## Overview

Extend the existing `question_categories` system with a new `question_subcategories` table. Both modules get full CRUD with activate/deactivate. The AI Question Generator gains Category and Subcategory dropdowns that feed context into the generation prompt.

---

## Step 1: Database -- Create `question_subcategories` Table

Create a new migration adding the `question_subcategories` table:

```text
Columns:
- id (uuid, PK, default gen_random_uuid())
- tenant_id (uuid, nullable)
- category_id (uuid, NOT NULL, FK -> question_categories.id)
- name (text, NOT NULL)
- name_ar (text, nullable)
- description (text, nullable)
- description_ar (text, nullable)
- color (text, default '#6366F1')
- weight (numeric, default 1.0)
- is_global (boolean, default false)
- is_active (boolean, default true)
- created_at (timestamptz, default now())
- updated_at (timestamptz, default now())
- deleted_at (timestamptz, nullable)
```

RLS Policies (mirror `question_categories`):
- Super admins: ALL
- Tenant admins: ALL where tenant_id matches or is_global
- Users: SELECT where active, not deleted, tenant or global

Add `updated_at` trigger using existing `update_updated_at_column()` function.

---

## Step 2: Add Toggle to Categories Table

The existing `CategoryManagement.tsx` has Edit and Delete actions but no "Activate/Deactivate" toggle. Add it to the dropdown menu so admins can toggle `is_active` without opening the edit dialog.

---

## Step 3: New Hook -- `useQuestionSubcategories`

Create `src/hooks/useQuestionSubcategories.ts` mirroring the pattern in `useQuestionCategories.ts`:
- Query: fetch all subcategories (with optional `category_id` filter), `deleted_at IS NULL`
- Mutations: create, update, soft-delete (set `deleted_at`)
- Toast notifications using i18n keys

---

## Step 4: New Component -- `SubcategoryDialog`

Create `src/components/questions/SubcategoryDialog.tsx`:
- Fields: Name (EN), Name (AR), Description (EN), Description (AR), Parent Category (dropdown from `useQuestionCategories`), Color picker, Weight, Active toggle, Global toggle
- Re-uses the same color preset palette from `CategoryDialog`

---

## Step 5: New Page -- Subcategory Management

Create `src/pages/admin/SubcategoryManagement.tsx`:
- Table listing subcategories with parent category badge, color dot, status badge
- Filter by parent category (dropdown)
- CRUD actions: Create, Edit, Delete (soft), Activate/Deactivate toggle
- Uses `useQuestionSubcategories` hook

---

## Step 6: Routing and Navigation

**App.tsx**: Add route `/admin/question-subcategories` pointing to `SubcategoryManagement`.

**AppSidebar.tsx**: Add "Subcategories" menu item under the "Survey System" group, after "Categories", using a nested icon (e.g., `Layers` or `Tags`).

---

## Step 7: Integrate into AI Question Generator

### Frontend (`ConfigPanel.tsx` and `AIQuestionGenerator.tsx`)

Add two new dropdowns to the ConfigPanel:
1. **Category** -- Select from active categories (from `useQuestionCategories`)
2. **Subcategory** -- Filtered by selected category (from `useQuestionSubcategories`)

Pass `selectedCategoryId` and `selectedSubcategoryId` through to the `generate()` call.

### Backend (`generate-questions/index.ts`)

Accept new optional parameters: `categoryId`, `subcategoryId`.

When provided:
- Fetch category and subcategory names from the database
- Inject into the system prompt: `"Category context: {name}. Subcategory context: {name}. Generate questions specifically relevant to this category/subcategory."`
- Add `category` and `subcategory` fields to the tool calling schema so AI returns them per question

### Generated Question Output

Add `category_name` and `subcategory_name` to the `EnhancedGeneratedQuestion` interface so the QuestionCard can display them as badges.

---

## Step 8: Localization (i18n)

Add keys to both `en.json` and `ar.json`:

| Key | English | Arabic |
|-----|---------|--------|
| subcategories.title | Subcategories | التصنيفات الفرعية |
| subcategories.subtitle | Manage question subcategories | إدارة التصنيفات الفرعية للأسئلة |
| subcategories.addSubcategory | Add Subcategory | إضافة تصنيف فرعي |
| subcategories.editSubcategory | Edit Subcategory | تعديل التصنيف الفرعي |
| subcategories.deleteSubcategory | Delete Subcategory | حذف التصنيف الفرعي |
| subcategories.parentCategory | Parent Category | التصنيف الرئيسي |
| subcategories.noSubcategories | No subcategories found | لا توجد تصنيفات فرعية |
| subcategories.createSuccess | Subcategory created | تم إنشاء التصنيف الفرعي |
| subcategories.updateSuccess | Subcategory updated | تم تحديث التصنيف الفرعي |
| subcategories.deleteSuccess | Subcategory deleted | تم حذف التصنيف الفرعي |
| subcategories.confirmDelete | Are you sure? | هل أنت متأكد؟ |
| categories.activate | Activate | تفعيل |
| categories.deactivate | Deactivate | إلغاء التفعيل |
| nav.subcategories | Subcategories | التصنيفات الفرعية |
| aiGenerator.category | Category | التصنيف |
| aiGenerator.subcategory | Subcategory | التصنيف الفرعي |
| aiGenerator.selectCategory | Select category | اختر التصنيف |
| aiGenerator.selectSubcategory | Select subcategory | اختر التصنيف الفرعي |

---

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| Create | Migration SQL | `question_subcategories` table + RLS |
| Create | `src/hooks/useQuestionSubcategories.ts` | Subcategory CRUD hook |
| Create | `src/components/questions/SubcategoryDialog.tsx` | Create/Edit dialog |
| Create | `src/pages/admin/SubcategoryManagement.tsx` | Management page |
| Edit | `src/pages/admin/CategoryManagement.tsx` | Add activate/deactivate toggle |
| Edit | `src/App.tsx` | Add subcategory route |
| Edit | `src/components/layout/AppSidebar.tsx` | Add nav item |
| Edit | `src/pages/admin/AIQuestionGenerator.tsx` | Pass category/subcategory to generate |
| Edit | `src/components/ai-generator/ConfigPanel.tsx` | Add category/subcategory dropdowns |
| Edit | `src/hooks/useEnhancedAIGeneration.ts` | Add category/subcategory to GenerateInput |
| Edit | `supabase/functions/generate-questions/index.ts` | Accept and use category context |
| Edit | `src/locales/en.json` | Add all new keys |
| Edit | `src/locales/ar.json` | Add all new Arabic keys |

