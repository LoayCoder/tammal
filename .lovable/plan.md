

# Fix Race Condition in Single-Question Regeneration

## Root Cause
There is a **timing race condition** between React Query's `isPending` flag and the `regeneratingIndex` state.

When `generate()` is called:
1. React Query immediately sets `isPending = true` (triggers re-render)
2. The `mutationFn` has NOT started yet -- so `regeneratingIndex` is still `null`
3. On that re-render, the condition `(isGenerating && regeneratingIndex === null)` is `true`
4. This shows full skeleton loaders, visually wiping all question cards

The `setRegeneratingIndex(...)` inside `mutationFn` runs too late -- after the first re-render has already destroyed the list.

## Fix

Move `setRegeneratingIndex` out of `mutationFn` so it runs **synchronously before** the mutation starts.

### `src/hooks/useEnhancedAIGeneration.ts`

Replace the raw `generateMutation.mutate` with a wrapper function that sets `regeneratingIndex` synchronously first, then calls the mutation:

```text
// Instead of exposing generateMutation.mutate directly:
const triggerGenerate = (input: GenerateInput & { _replaceAtIndex?: number }) => {
  setRegeneratingIndex(input._replaceAtIndex ?? null);
  generateMutation.mutate(input);
};
```

Remove the `setRegeneratingIndex(...)` call from inside `mutationFn` (line 103) since it's now handled before the mutation starts.

Return `triggerGenerate` as `generate` instead of `generateMutation.mutate`.

No changes needed to `AIQuestionGenerator.tsx` or `QuestionCard.tsx` -- those are already correct.

## Files to Modify

| File | Change |
|------|--------|
| `src/hooks/useEnhancedAIGeneration.ts` | Remove `setRegeneratingIndex` from inside `mutationFn`; create a wrapper function that sets the index synchronously before calling `mutate`; export the wrapper as `generate` |

No other files need changes. No database or localization changes.
