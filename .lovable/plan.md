

## Plan: Fix Back Navigation During Nomination Wizard

### Problem
When the nomination wizard is active, clicking the page-level Back arrow (top-left) navigates away from the page entirely (`navigate(-1)`). The user expects it to go back to the cycle/theme selection screen, or step-by-step within the wizard.

Additionally, on the wizard's first step, the step-level Back button is disabled — there's no way to go back to change the cycle or theme selection.

### Changes

**`src/pages/recognition/NominatePage.tsx`**
- Change the top ArrowLeft button behavior: when the wizard is showing (`showWizard` is true), instead of `navigate(-1)`, reset `selectedThemeId` (and optionally `selectedCycleId`) to return to cycle/theme selection
- Only use `navigate(-1)` when the user is on the cycle/theme selection screen (wizard not active)

**`src/components/recognition/NominationWizard.tsx`**
- Add an optional `onBack` prop so the wizard's first step Back button can call back to the parent (NominatePage) to return to cycle/theme selection
- Enable the Back button on step 0 when `onBack` is provided, and call `onBack` instead of `goPrev`

### Result
- ArrowLeft on the page header: returns to cycle/theme selection (not away from page)
- Back button on wizard step 1: also returns to cycle/theme selection
- Back on other steps: works as before (previous wizard step)

