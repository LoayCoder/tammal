# Design System Changelog

All notable changes to the TAMMAL design system are documented here.

---

## v1.0.0 — 2026-03-07

### Added

- **Core Tokens** — Centralized spacing, typography, card variants, layout, and iconography tokens in `src/theme/tokens.ts`.
- **System Components** — `PageHeader`, `StatCard`, `MetricCard`, `ChartCard`, `InsightCard`, `DashboardGrid`, `EmptyState` in `src/components/system/`.
- **Chart Constants** — `CHART_AXIS_TICK`, `CHART_TOOLTIP_STYLE`, `CHART_GRID_STROKE` in `src/config/chart-styles.ts`.
- **Toolkit Palette** — `TOOLKIT`, `ZONE_COLORS`, `ASSESSMENT_COLORS`, `REGION_COLORS` in `src/config/toolkit-colors.ts` backed by CSS custom properties with dark-mode variants.
- **Spacing Standardization** — Enforced `p-4` (stat), `p-5` (interactive), `p-6` (standard) across all card components.
- **Design System Page** — Live reference at `/dev/design-system` showing colors, typography, spacing, and components.
- **Component Showcase** — Sandbox at `/dev/components` for StatusBadge presets, system components, and UI primitives.
- **UI Governance Framework** — Version tracking (`src/theme/version.ts`), governance rules, update workflow documentation, and this changelog.
