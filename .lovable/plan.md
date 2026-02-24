

# Fix Single-Question Regeneration UX

## Problem
The backend logic for replacing a single question at a specific index already works correctly (`_replaceAtIndex` in `useEnhancedAIGeneration.ts` lines 118-124). However, the UI in `AIQuestionGenerator.tsx` (line 400) checks `isGenerating` globally and replaces the **entire question list with skeleton loaders**, hiding all existing questions even during a single-question regeneration.

## Root Cause
`isGenerating` is a single boolean (`generateMutation.isPending`) that does not distinguish between a full batch generation and a single-question regeneration. The page uses this flag in a ternary that either shows all questions or shows only skeletons -- there is no middle state.

## Solution
Track which specific question index is being regenerated so the UI can show a per-card loading state instead of replacing the entire list.

## Changes

### 1. `src/hooks/useEnhancedAIGeneration.ts`
- Expose a new state: `regeneratingIndex: number | null`
- Set it to the `_replaceAtIndex` value when a single-question regeneration starts
- Clear it on success or error
- Return it alongside existing values

### 2. `src/pages/admin/AIQuestionGenerator.tsx`
- Consume the new `regeneratingIndex` from the hook
- Change the rendering condition: only show full skeletons when `isGenerating` is true **AND** `regeneratingIndex === null` (i.e., a full batch generation)
- When `regeneratingIndex !== null`, keep showing all question cards normally
- Pass `regeneratingIndex` to each `QuestionCard` so the specific card can show its own loading state

### 3. `src/components/ai-generator/QuestionCard.tsx`
- Accept a new prop `isRegenerating: boolean`
- When `isRegenerating` is true, overlay the card with a loading state (skeleton or spinner overlay) while keeping it visible in position
- Disable action buttons on that card during regeneration

## Technical Details

### Hook changes (`useEnhancedAIGeneration.ts`)

Add state:
```text
const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
```

In `generateMutation.mutationFn`:
- Before the API call, set `setRegeneratingIndex(input._replaceAtIndex ?? null)`

In `onSuccess` and `onError`:
- `setRegeneratingIndex(null)`

Return:
- `regeneratingIndex` alongside existing exports

### Page changes (`AIQuestionGenerator.tsx`)

Replace the rendering condition (line 400-411):
```text
Before:  {isGenerating ? <Skeletons /> : questions.length === 0 ? <Empty /> : <Cards />}
After:   {(isGenerating && regeneratingIndex === null) ? <Skeletons /> : questions.length === 0 ? <Empty /> : <Cards />}
```

Pass to each QuestionCard:
```text
isRegenerating={regeneratingIndex === i}
```

### QuestionCard changes

New prop: `isRegenerating?: boolean`

When true:
- Show a semi-transparent overlay with a centered Loader2 spinner
- Disable the action buttons row
- Keep the card content visible underneath (maintains position/scroll)

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useEnhancedAIGeneration.ts` | Add `regeneratingIndex` state, set/clear it around the mutation lifecycle, expose it |
| `src/pages/admin/AIQuestionGenerator.tsx` | Use `regeneratingIndex` to conditionally show full skeletons vs per-card loading; pass `isRegenerating` prop to QuestionCard |
| `src/components/ai-generator/QuestionCard.tsx` | Accept `isRegenerating` prop, render loading overlay when true |

No database changes. No new files. No localization changes needed.

