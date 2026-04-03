

# Premium VIP Mood Selector Redesign

## Changes

### 1. `src/components/checkin/MoodStep.tsx` — Full redesign

**Header**: Increase title to `text-xl font-semibold`, subtitle to `text-muted-foreground/60 text-xs`, spacing `space-y-5` overall and `space-y-2` for header.

**Grid**: Increase gap from `gap-2` to `gap-2.5`.

**Mood items** — replace colored gradient buttons with neutral soft cards:
- Remove: `border-2`, `bg-gradient-to-b`, colored `bgFrom/bgTo`, `ring-2`, colored borders
- Add: `bg-muted/40 dark:bg-muted/20`, `rounded-2xl`, `shadow-[0_1px_2px_rgba(0,0,0,0.04)]`, `border border-border/30`
- Padding: `p-3 sm:p-4`

**Selected state**:
- `bg-primary/[0.06] dark:bg-primary/[0.1]`, `shadow-[0_2px_8px_rgba(0,0,0,0.06)]`, `scale-[1.04]`, `border-primary/20`
- Label: `text-foreground font-semibold` (no bright color)

**Unselected state**:
- `hover:bg-muted/60`, `hover:scale-[1.02]`, `active:scale-[0.97]`
- Label: `text-muted-foreground font-medium`

**Emoji**: Reduce from `text-2xl sm:text-3xl` to `text-xl sm:text-2xl`. Increase gap between emoji and label from `gap-1.5` to `gap-2`.

**Transitions**: `transition-all duration-200 ease-out`

### 2. `src/components/checkin/InlineDailyCheckin.tsx` — Remove inner container

Remove the `rounded-xl bg-muted/5 p-3` wrapper div around `<MoodStep>`, rendering it directly inside the card content with natural spacing.

## Files

| File | Change |
|------|--------|
| `src/components/checkin/MoodStep.tsx` | Premium neutral card-style mood items |
| `src/components/checkin/InlineDailyCheckin.tsx` | Remove grey inner box wrapper |

