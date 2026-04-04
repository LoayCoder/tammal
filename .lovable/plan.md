
## Fix Dashboard Overlap by Enforcing Real Section Gaps

### What I will change

**`src/pages/EmployeeHome.tsx`**

1. **Fix the real cause of the missing gap**
   - The page uses `space-y-8`, but the **Pending Surveys** section is wrapped in a top-level `Link`, which renders as an **inline element** by default.
   - Margin spacing from `space-y-*` does not behave reliably on inline children, so the gap can visually collapse.
   - I will make that `Link` a **block-level wrapper** (`className="block"`) or wrap it in a block container so spacing works correctly.

2. **Add explicit spacing between Support Hub and the next section**
   - I will not rely only on the parent stack.
   - I will add a dedicated wrapper with clear spacing like:
     - `space-y-4 sm:space-y-6` for the card group below Support Hub
     - optional `pt-1 sm:pt-2` where needed for extra breathing room
   - This ensures a visible, premium gap on mobile and desktop.

3. **Reduce visual collision from hover effects**
   - The survey card already uses `cardVariants.premiumVip`, which includes interactive motion.
   - It also adds another hover lift class on top of that.
   - I will remove the duplicated lift so the card does not visually jump upward into the Support Hub.

4. **Keep the layout premium and stable**
   - Preserve the current order:
     1. Greeting
     2. Support Hub
     3. Recognition / Voting widgets
     4. Pending Surveys
     5. Daily Check-in
   - Keep rounded corners, premium shadows, and clean vertical rhythm without overlap.

### Expected result

- Clear visible gap between **Support Hub** and **Pending Surveys**
- No touching/stacking effect on hover
- Better mobile spacing on small screens
- Cleaner premium layout with more intentional separation between sections

### Technical details

- Root issue: `space-y-8` + direct child `Link` (inline by default)
- Fix:
  - make top-level `Link` wrappers `block`
  - add explicit section wrapper spacing
  - remove duplicate hover translation from the survey card
- No backend or data changes required

### Files to modify

| File | Change |
|------|--------|
| `src/pages/EmployeeHome.tsx` | Make survey wrapper block-level, add explicit section spacing, reduce hover collision |
