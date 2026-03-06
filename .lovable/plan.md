

# Upgrade Executive Dashboard — Premium SaaS Redesign

## Overview

Restructure the 566-line `ExecutiveDashboard.tsx` into a modular, visually elevated executive command center. The redesign applies the design prompt's principles: semantic KPI colors, depth via shadows, gauge charts, delivery performance visuals, and a tighter visual hierarchy — all while keeping the existing data hooks and glass-morphism system intact.

## Key Changes

### 1. Split into Sub-Components (Maintainability)
Extract the monolithic file into focused sections:
- `src/features/workload/components/executive/TammalIndexCard.tsx` — gauge + component breakdown
- `src/features/workload/components/executive/ExecutiveKPIRow.tsx` — 4 semantic-colored KPI cards (Success/Info/Warning/Error style with circular icon backgrounds)
- `src/features/workload/components/executive/StrategicProgressCard.tsx` — semi-circle gauge for overall progress (objectives + initiatives combined)
- `src/features/workload/components/executive/DepartmentWorkloadCard.tsx` — horizontal bar chart
- `src/features/workload/components/executive/DeliveryPerformanceCard.tsx` — 4-metric grid with mini radial indicators
- `src/features/workload/components/executive/WorkforceHealthCard.tsx` — heatmap pie + initiative risk list
- `src/features/workload/components/executive/BurnoutPredictionsCard.tsx` — AI predictions grid
- `src/features/workload/components/executive/RedistributionCard.tsx` — smart redistribution list
- `src/features/workload/components/executive/AlignmentOverviewCard.tsx` — 3-stat summary

### 2. Visual Upgrades (Design Prompt Alignment)

**KPI Cards — Semantic Color System:**
- Replace uniform `glass-stat` cards with 4 primary KPIs using colored left-border accents and tinted icon circles:
  - Strategic Progress → `#4CAF50` (success green) icon circle
  - Utilization → `#2A6FF3` (primary blue) icon circle  
  - Burnout Risk → `#F44336` (error red) icon circle
  - Completion Rate → `#FF9800` (warning orange) icon circle
- Add a small comparison/trend indicator text below each value (e.g., "↑ 5% from last week")

**TAMMAL Index — True Gauge:**
- Replace the current half-pie with a proper semi-circle gauge using `startAngle={180}` `endAngle={0}` with a background track ring
- Center the score text using proper absolute positioning (fix current `marginTop: 60` hack)
- Add segmented color zones on the gauge track (red < 40, orange 40-70, green > 70)

**Strategic Progress — Semi-Circle Gauge:**
- Convert the radial bar into a clean semi-circle gauge showing combined objective+initiative progress
- Show percentage in center, status breakdown as colored legend pills below

**Delivery Performance — Visual Metrics:**
- Add small circular progress indicators (mini donuts) next to each metric value
- Use semantic colors: velocity=blue, completion=green, overdue=red

**Spacing & Hierarchy:**
- Apply `gap-8` (32px) between major sections instead of current `gap-6`
- Section headers get subtle bottom borders for separation
- Cards get soft drop-shadow via `shadow-sm` layered with glass effect

### 3. Layout Restructure

```text
┌─────────────────────────────────────────────────────┐
│  Header: Title + Desc + [AI Predictions] [Snapshot] │
├─────────────────────────────────────────────────────┤
│  TAMMAL Index Gauge (full-width, prominent)         │
├─────────────────────────────────────────────────────┤
│  4 KPI Cards (semantic colors, 4-col grid)          │
├─────────────────────────────────────────────────────┤
│  [Strategic Gauge]  |  [Department Workload Chart]  │
├─────────────────────────────────────────────────────┤
│  Delivery Performance (4-metric row, full-width)    │
├─────────────────────────────────────────────────────┤
│  [Workforce Heatmap Pie]  |  [Initiative Risk]     │
├─────────────────────────────────────────────────────┤
│  AI Burnout Predictions (3-col grid, full-width)    │
├─────────────────────────────────────────────────────┤
│  Smart Redistribution (full-width list)             │
├─────────────────────────────────────────────────────┤
│  Organization Alignment (3-stat summary)            │
└─────────────────────────────────────────────────────┘
```

### 4. Rewrite Main Page
- `ExecutiveDashboard.tsx` becomes a thin orchestrator: hooks + state at top, then renders each sub-component with props
- Reduces from ~566 lines to ~120 lines

### 5. No New Dependencies
- All visuals use existing Recharts + Tailwind + glass classes
- Semantic colors defined as inline styles or CSS variables

### 6. Localization
- No new keys needed — reuses existing `executive.*` translations
- Add 2-3 keys for trend indicators: `executive.trend.up`, `executive.trend.down`, `executive.trend.stable`

## Files Changed
- `src/pages/admin/ExecutiveDashboard.tsx` — rewrite as thin orchestrator
- 9 new files in `src/features/workload/components/executive/`
- `src/locales/en.json` + `src/locales/ar.json` — add trend keys

