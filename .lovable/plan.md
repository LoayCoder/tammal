

# UI Governance Framework — Implementation Plan

## Overview

Add infrastructure for design system versioning, a comprehensive component sandbox, governance documentation, and a changelog — all without modifying existing product functionality.

---

## Deliverables

### 1. Design System Version File
**Create** `src/theme/version.ts`
- Export `DESIGN_SYSTEM` object with `version`, `lastUpdated`, `description`, and `protectedPaths` array listing `src/components/system`, `src/components/ui`, `src/theme`, `src/styles`.

### 2. Enhanced Design System Documentation Page
**Edit** `src/pages/dev/DesignSystemPage.tsx`
- Add a **Version Banner** section at the top displaying version, date, and description from `version.ts`.
- Add a **Spacing Rules** section rendering the token table with usage guidance (stat = p-4, interactive = p-5, standard = p-6).
- Add a **UI Governance Rules** section with rendered markdown-style content covering:
  - Component usage enforcement (always use system components, never raw card styling)
  - Token protection rules (tokens only in `src/theme/tokens.ts`, no `p-[22px]`)
  - Protected architecture layers (the 4 protected directories)
  - Feature isolation rules (import from `@/components/system`, never redefine)
  - UI update workflow (5-step process: isolate → sandbox → design-system → key pages → merge)

### 3. Expanded Component Sandbox
**Edit** `src/pages/dev/ComponentShowcase.tsx`
- Restructure into a comprehensive sandbox showing **all** system components with live examples:
  - **System components**: PageHeader, StatCard, MetricCard, ChartCard, InsightCard, DashboardGrid, EmptyState, GradientButton
  - **UI primitives**: Button variants/sizes, Badge variants, Avatar, Dialog, Tabs, Input/Textarea, Select, Switch, Checkbox, RadioGroup, Table
- Each section shows: component name (Badge label), live rendered example, and a `<code>` block with the import path/usage snippet.
- Keep existing StatusBadge preset sections.

### 4. Design System Changelog
**Create** `docs/design-system-changelog.md`
- Initial entries documenting v1.0.0 (core tokens, system components, chart constants, toolkit palette, spacing standardization, governance framework).

### 5. Route Registration
No changes needed — `/dev/components` and `/dev/design-system` routes already exist in `App.tsx`.

---

## Files Summary

| Action | File |
|--------|------|
| Create | `src/theme/version.ts` |
| Create | `docs/design-system-changelog.md` |
| Edit   | `src/pages/dev/DesignSystemPage.tsx` |
| Edit   | `src/pages/dev/ComponentShowcase.tsx` |

---

## Technical Notes

- No product behavior changes. No database changes.
- All new sections use existing design tokens (`spacing`, `typography`, `cardVariants`) and system components.
- Governance rules are rendered as structured UI content, not raw markdown, for consistency with the design system page aesthetic.
- The sandbox imports all components from `@/components/system` and `@/components/ui` to serve as a living reference and regression-detection tool.

