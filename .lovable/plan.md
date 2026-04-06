

## Fix: "Complete Check-in" CTA scrolls to inline Daily Check-in instead of navigating away

### Problem
When Copilot suggests "Complete Check-in", clicking it navigates to `/employee/wellness` — a separate page. The Daily Check-in card already lives on the dashboard (`InlineDailyCheckin`), so the CTA should scroll to it and highlight it instead.

### Solution

1. **`CopilotActionBlock.tsx`** — For `complete_checkin` CTA only, replace the `<Link>` navigation with a scroll-to-element action:
   - Instead of navigating to `/employee/wellness`, call `document.getElementById('inline-daily-checkin')?.scrollIntoView({ behavior: 'smooth' })` and briefly flash/highlight the card
   - Use a `<button>` for `complete_checkin`, keep `<Link>` for all other CTAs

2. **`InlineDailyCheckin.tsx`** — Add `id="inline-daily-checkin"` to the root `<Card>` element so the Copilot CTA can target it. Add a CSS highlight animation class that can be triggered.

3. **`EmployeeHome.tsx`** — If the user already completed the check-in today (`todayEntry` exists), the Copilot CTA should show a toast like "Already checked in today" instead of scrolling to nothing. Pass a callback or use a shared ref/event.

### Implementation Detail
- `CopilotActionBlock` will accept an optional `onCheckinClick` callback prop
- `WellnessCopilotCard` will pass it down
- `EmployeeHome` will provide the callback that scrolls to `#inline-daily-checkin` and adds a temporary highlight ring animation
- If `todayEntry` exists, the callback shows a toast instead

### Files to Modify
1. `src/features/wellness-copilot/components/CopilotActionBlock.tsx` — handle `complete_checkin` as button with callback
2. `src/features/wellness-copilot/components/WellnessCopilotCard.tsx` — pass through `onCheckinClick` prop
3. `src/components/checkin/InlineDailyCheckin.tsx` — add `id="inline-daily-checkin"`
4. `src/pages/EmployeeHome.tsx` — provide scroll+highlight callback to WellnessCopilotCard

