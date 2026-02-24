

# Replace Question Count Dropdown with Stepper (Survey Only)

## Problem
The "Number of Questions" field currently uses a dropdown (`Select`) limited to 1-20 for both Survey and Wellness purposes (in freeform/no-period mode). The user wants a modern +/- stepper control with a range of 1-200, applied **only** to Survey questions.

## What Changes

### `src/components/ai-generator/ConfigPanel.tsx` (lines 574-598)
The freeform (no period selected) question count section currently renders a `Select` dropdown for both purposes. This will be split:

- **When `purpose === 'survey'`**: Replace the `Select` with a numeric `Input` field flanked by a minus (-) button on the start side and a plus (+) button on the end side.
  - Min: 1, Max: 200
  - (+) disabled at 200, (-) disabled at 1
  - Input validates on change: clamps to 1-200, rejects non-numeric input
  - Clean, compact layout matching the existing grid

- **When `purpose === 'wellness'`**: Keep the existing `Select` dropdown (1-20) exactly as-is, no changes.

The period-selected path (lines 546-573 with `questionsPerDay` stepper) is **not touched at all**.

### No other files change
- No backend changes needed -- the `questionCount` state is already a number passed to the generate function
- No localization changes needed -- the existing `aiGenerator.questionCount` label is reused
- No hook or page-level changes

## Technical Details

The stepper replaces only the `Select` inside the `else` branch (freeform mode), and only when `purpose === 'survey'`. The layout becomes:

```text
[- button] [ numeric input ] [+ button]
```

- Buttons use `variant="outline"` and `size="icon"` (h-9 w-9) matching the existing `sm` input height
- Input uses `type="number"`, `min={1}`, `max={200}`, `className="text-center"`, no spin buttons (CSS hide)
- `onChange` handler: parse int, clamp to 1-200, ignore NaN
- `onBlur` handler: if empty or invalid, reset to 1
- The grid remains `grid-cols-2 gap-4` with complexity select in the second column (unchanged)

### Files to Modify

| File | Change |
|------|--------|
| `src/components/ai-generator/ConfigPanel.tsx` | Replace question count `Select` with stepper UI when `purpose === 'survey'` in freeform mode (lines ~574-598) |
