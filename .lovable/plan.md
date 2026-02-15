

# Actionable Validation Report: Show and Fix Failed Questions

## Problem

When the Validation Report shows "Structure Completeness: Failed", users cannot see which specific questions have issues or what went wrong. The failure details exist in the data but are hidden from the UI.

## Solution

Make each validation check row in the Validation Report expandable. When a check has failed or has warnings, clicking it reveals the detailed list of affected questions with clear descriptions of what needs fixing. For structure failures specifically, add a "Fix" button that opens the question's inline editor directly.

---

## Changes

### 1. ValidationReport.tsx -- Expandable Check Rows with Details

Each check row (Structure, Duplicates, Bias, etc.) becomes a collapsible section. When the result is "failed" or "warning", it expands to show:
- A list of affected questions (e.g., "Q1: Missing Arabic text", "Q3: MCQ needs at least 2 options")
- For structure failures: a "Go to Question" scroll-link or highlight action

The `details` field from the validation results is already an array of strings (e.g., `["Q1: Missing Arabic text", "Q3: MCQ needs 2 options"]`) -- this just needs to be rendered.

### 2. AIQuestionGenerator.tsx -- Scroll/Highlight Failed Questions

Add a callback `onScrollToQuestion(index)` that auto-scrolls to the specific QuestionCard and briefly highlights it, so users can locate and edit the problematic question quickly using the existing edit button.

### 3. QuestionCard.tsx -- Show Per-Question Validation Issues

When a question has `validation_status: 'failed'` or `'warning'`, display the specific issues from `validation_details.issues` as small inline badges (e.g., "Missing Arabic text", "Low confidence") so users know exactly what to fix without opening the report.

### 4. Localization (en.json + ar.json)

Add keys for:
- `aiGenerator.showDetails` / `aiGenerator.hideDetails`
- `aiGenerator.goToQuestion`
- Issue label mappings: `incomplete_structure`, `bias_detected`, `ambiguity_detected`, `low_confidence`, `moderate_confidence`, `missing_framework_reference`

---

## Technical Details

### ValidationReport Expansion Logic

```text
+-------------------------------------------+
| Structure Completeness        [X] Failed  |
+-------------------------------------------+
|  - Q1: Missing Arabic text                |
|  - Q3: MCQ needs at least 2 options       |
|                          [Go to Q1] [Q3]  |
+-------------------------------------------+
| Duplicate Detection        [check] Passed |
+-------------------------------------------+
```

Each check row uses the existing `Collapsible` component. The `details` field is rendered as a list when it is an array, or as a single line when it is a string.

### Scroll-to-Question Mechanism

- Each `QuestionCard` gets a `ref` via `id={`question-card-${index}`}`
- The "Go to Question" button calls `document.getElementById('question-card-N')?.scrollIntoView({ behavior: 'smooth' })`
- A brief CSS animation (ring pulse) highlights the target card

### Per-Question Issue Badges in QuestionCard

When `question.validation_details?.issues` is populated, render small destructive/warning badges below the flags section showing human-readable labels mapped from the issue codes.

### Files to Modify

| File | Change |
|------|--------|
| `src/components/ai-generator/ValidationReport.tsx` | Make check rows collapsible, render details array, add "Go to Question" links |
| `src/components/ai-generator/QuestionCard.tsx` | Add `id` attribute for scroll targeting, render validation issue badges from `validation_details` |
| `src/pages/admin/AIQuestionGenerator.tsx` | No structural changes needed (scroll is handled via DOM IDs) |
| `src/locales/en.json` | Add detail/issue label translation keys |
| `src/locales/ar.json` | Add corresponding Arabic translations |

