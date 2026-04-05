

## Match Collapsed State UI for Wellness Copilot & Team Pulse Cards

Both cards currently show a simple button with an Eye icon and the card title when hidden. The reference screenshot (My Workload) shows a richer pattern: a `Card` with `premiumVip` styling containing the card icon + "X hidden" label on the left, and a ghost "Show" button with Eye icon on the right.

### Changes

**File 1: `src/features/wellness-copilot/components/WellnessCopilotCard.tsx`** (lines 42-50)
- Replace the plain `<button>` with a `Card` + `CardContent` layout matching the workload pattern:
  - Left side: Sparkles icon + "{copilot.title} hidden" / Arabic equivalent
  - Right side: Ghost `Button` with Eye icon + "Show" / "إظهار"
  - Uses `cardVariants.premiumVip` with `opacity-80`

**File 2: `src/features/team-pulse/components/TeamPulseCard.tsx`** (lines 85-94)
- Same replacement using the Team Pulse icon (Activity) + "{pulse.title} hidden" label
- Identical layout structure and styling as above

Both will import `Card`, `CardContent` from `@/components/ui/card` and `Button` from `@/components/ui/button` (adding imports if missing).

