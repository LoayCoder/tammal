

# Overview Page — Full Linear/Notion Style Refresh

## Problem
The Overview page (Dashboard.tsx with DashboardOverviewTab, SaasStatsSection, and OrgDashboard/OverviewTab) still uses old patterns:
- Glassmorphism tooltip styles (blur, opacity) across all chart components
- `text-3xl font-bold` headings instead of the refined `text-xl tracking-tight` from tokens
- Old `glass-chart border-0` class on cards (redundant with glass-card)
- Lucide icons instead of emoji for section headers (Linear uses emoji)
- Chart colors not aligned with brand primary (blue `220 89% 56%`)
- `ring-1 ring-primary/20` on ExecutiveSummary card — too loud
- Pie charts use generic COLORS array including destructive/muted — not harmonious

## Changes

### 1. Unified Tooltip Style — Remove Glassmorphism (8 files)
Replace all `GLASS_TOOLTIP` / `GLASS_TOOLTIP_STYLE` constants with a clean, solid tooltip:

```typescript
const CLEAN_TOOLTIP = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  fontSize: 12,
  boxShadow: '0 4px 12px hsl(220 40% 50% / 0.08)',
};
```

Files: `OverviewTab.tsx`, `ComparisonTab.tsx`, `SaasStatsSection.tsx`, `WorkloadDashboard.tsx`, `WorkloadDistributionChart.tsx`, `DepartmentWorkloadCard.tsx`, `RiskTrendChart.tsx`, `CategoryHealthChart.tsx`, `AffectiveStateChart.tsx`, `TrendOverlayChart.tsx`

### 2. Dashboard Page Header — Use Tokens (3 files)
Replace `text-3xl font-bold tracking-tight` with `typography.pageTitle` (`text-xl font-semibold tracking-tight`):

- `DashboardHeader.tsx` — org dashboard header
- `SaasStatsSection.tsx` — SaaS admin header  
- `DashboardOverviewTab.tsx` — non-admin greeting

### 3. Tab Styling — Cleaner Tabs (Dashboard.tsx)
Simplify tab triggers: remove `rounded-xl`, use simpler `rounded-lg`, remove `glass-active` in favor of `bg-muted` for active state. Smaller text.

### 4. ExecutiveSummary — Quiet Down
- Remove `ring-1 ring-primary/20` — border-only like all other cards
- Replace `Sparkles` Lucide icon with emoji `📊` for Linear feel
- Use `cardVariants.glass` without extra ring

### 5. Chart Color Palette — Brand-Aligned
Update chart colors to a harmonious palette derived from brand primary (blue 220°):

```css
--chart-1: 220 89% 56%;   /* primary blue — keep */
--chart-2: 187 100% 42%;  /* teal accent — keep */  
--chart-3: 262 52% 58%;   /* purple complement */
--chart-4: 220 15% 65%;   /* muted blue-gray */
--chart-5: 340 65% 55%;   /* rose accent */
```

### 6. SaasStatsSection — Modernize Pie Charts
Replace generic `COLORS` array with brand-aligned palette. Remove `glass-chart border-0` class, use `cardVariants.glass` instead.

### 7. TopEngagersCard — Emoji Ranks
Replace Lucide `Trophy`, `Medal`, `Award` icons with emoji: 🥇 🥈 🥉 for a cleaner Notion-style look.

### 8. Card Class Consistency
Replace all `glass-chart border-0` with the token `cardVariants.glass` for consistency across:
- `OverviewTab.tsx` (engagement trend card)
- `RiskTrendChart.tsx`
- `CategoryHealthChart.tsx`
- `AffectiveStateChart.tsx`
- `TrendOverlayChart.tsx`
- `SaasStatsSection.tsx`
- `DashboardOverviewTab.tsx` (recent activity card)

---

## Files Modified

| File | Changes |
|---|---|
| `src/pages/Dashboard.tsx` | Cleaner tab styling |
| `src/components/dashboard/DashboardOverviewTab.tsx` | Token heading, cardVariants |
| `src/components/dashboard/SaasStatsSection.tsx` | Token heading, clean tooltip, brand colors, cardVariants |
| `src/components/dashboard/ExecutiveSummary.tsx` | Remove ring, emoji icon |
| `src/components/dashboard/RiskTrendChart.tsx` | Clean tooltip, cardVariants |
| `src/components/dashboard/CategoryHealthChart.tsx` | Clean tooltip, cardVariants |
| `src/components/dashboard/AffectiveStateChart.tsx` | Clean tooltip, cardVariants |
| `src/components/dashboard/TopEngagersCard.tsx` | Emoji ranks |
| `src/components/dashboard/comparison/TrendOverlayChart.tsx` | Clean tooltip, cardVariants |
| `src/features/org-dashboard/components/OverviewTab.tsx` | Clean tooltip, cardVariants |
| `src/features/org-dashboard/components/DashboardHeader.tsx` | Token heading |
| `src/index.css` | Updated chart-3, chart-5 colors |

## What Stays
- All data flow, hooks, RBAC, RTL support
- Dark mode (chart colors already have dark variants)
- Component structure and layout grids

