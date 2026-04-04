

## Remove Serif & Mono Font Families — Use Inter Only

### Summary
Remove `Lora` (serif) and `Space Mono` (mono) font imports and definitions. Replace all `font-mono` and `font-serif` usages across ~23 source files with `font-sans` (Inter).

### Changes

**1. `src/index.css`** — Remove Google Fonts imports for Lora and Space Mono (lines 2-3). Remove `--font-serif` and `--font-mono` CSS variables (lines 143-144). Point `--font-mono` to the same Inter stack as `--font-sans` (keeps `font-mono` class working without breaking anything).

**2. `tailwind.config.ts`** — Remove the `serif` and `mono` entries from `fontFamily` (lines 139-157), or point them to the same Inter stack.

**3. `src/pages/dev/DesignSystemPage.tsx`** — Remove the Lora and Space Mono preview sections from the Font Families showcase. Keep only the Inter section.

**4. ~20 source files** — Replace every `font-mono` class with `font-sans tabular-nums` (for numeric/code contexts that need monospaced alignment) or just remove it. Key files:
- `TaskTimeTrackingPanel.tsx` — timer display
- `HSLColorPicker.tsx` — hex/RGB values
- `GovernanceAuditLog.tsx` — IDs
- `AutonomousStatus.tsx` — percentages
- `MoodDefinitionManager.tsx`, `MoodDefinitionDialog.tsx`
- `InvitationManagement.tsx` — invitation codes
- `DesignSystemPage.tsx` — code snippets
- `ComponentShowcase.tsx` — code blocks
- Several other governance/admin components

No `font-serif` usages found in components (only in config), so that's config-only cleanup.

### Approach
- Safest path: redefine `--font-mono` CSS variable to use Inter stack, so all existing `font-mono` classes automatically render in Inter without touching every file individually. Then remove the Google Fonts imports and Tailwind config entries.
- Still update the Design System page to remove the Lora/Space Mono showcase sections.

