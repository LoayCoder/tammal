

## Upgrade Organization Wellness to Premium Executive Dashboard

### Overview
Transform the current Org Wellness page from a functional analytics screen into a premium, executive-level intelligence dashboard. This touches the main orchestrator, all tab components, stat cards, executive summary, top engagers, workload indicator, and empty states — while keeping all existing data hooks and transforms intact.

---

### 1. Upgrade StatCards with Trend Indicators

**File**: `src/features/org-dashboard/types.ts`
- Extend `StatCard` type to include optional `trend` (number), `trendLabel` (string), and `accentColor` (string)

**File**: `src/features/org-dashboard/utils/transforms.ts`
- Update `buildStatCards` to include period comparison deltas (mood, participation, risk) and semantic accent colors per card
- Add trend values from `stats.periodComparison` where applicable

**File**: `src/features/org-dashboard/components/StatCards.tsx`
- Redesign to use premium card style with `border-s-4` accent (like ExecutiveKPIRow pattern)
- Add trend indicator (↑/↓ with delta value) and "vs last period" context label beneath each metric
- Use `cardVariants.glass` + `p-5` spacing + `rounded-2xl`
- Smooth hover transition (`hover:-translate-y-0.5 transition-all duration-200`)

---

### 2. Redesign Executive Summary (Most Important)

**File**: `src/components/dashboard/ExecutiveSummary.tsx`
- Upgrade the Health Gauge: Replace the basic SVG with a cleaner semi-circle gauge (similar to TammalIndexCard pattern using Recharts PieChart for consistency)
- Premium card surface: `cardVariants.premium` with `p-6` spacing
- Add a **Key Insight** text line below the period comparison — auto-generated from the data (e.g., "Engagement improving, but risk remains elevated in 2 areas")
- Period comparison section: Larger delta indicators with subtle background pills
- Alerts section: Cleaner layout with dot indicators instead of heavy badges
- Replace emoji 📊 with a Lucide `BarChart3` icon

---

### 3. Upgrade Engagement Trend Chart

**File**: `src/features/org-dashboard/components/OverviewTab.tsx`
- Thicker gradient fill area with smoother curve (`type="natural"`)
- Larger active dot with glow effect
- Premium glass tooltip style (backdrop-blur)
- Better empty state (see section 7)

---

### 4. Upgrade Top Engagers Card

**File**: `src/components/dashboard/TopEngagersCard.tsx`
- Add avatar placeholder (initials circle with gradient background)
- Add rank number with medal styling for top 3 (gold/silver/bronze circle instead of emoji)
- Show department as a subtle chip
- Add participation percentage column
- Clean row layout with hover state (`hover:bg-muted/30 rounded-lg transition-colors`)

---

### 5. Upgrade OrgWorkloadIndicator

**File**: `src/features/org-dashboard/components/OrgWorkloadIndicator.tsx`
- Apply `cardVariants.glass` to main card
- MiniKpi cards: Use `cardVariants.stat` with premium spacing
- Department bar chart: Add percentage labels at end of bars
- Overloaded employees: Use `Progress` component instead of custom div bars
- Better empty state messaging

---

### 6. Upgrade All Chart Cards (RiskTrend, CategoryHealth, AffectiveState)

**Files**: `src/components/dashboard/RiskTrendChart.tsx`, `CategoryHealthChart.tsx`, `AffectiveStateChart.tsx`
- Consistent glass tooltip style with backdrop-blur
- Smoother chart animations
- Better empty states (section 7 pattern)
- Consistent `p-5` card padding

---

### 7. Premium Empty States (All Components)

Replace plain "No data" text across all chart components with:
```
[Icon - BarChart3 or similar, muted, h-10]
No data available yet
Start a survey to generate insights
[Optional CTA button: "Launch Survey"]
```
- Centered layout, `py-16` breathing room
- Subtle icon + two-line text hierarchy
- Create a shared `EmptyAnalyticsState` component in `src/features/org-dashboard/components/`

---

### 8. Upgrade Deep Analysis & Comparison Tabs

**File**: `src/features/org-dashboard/components/DeepAnalysisTab.tsx`
- Sub-tabs: Use glass-styled tab triggers consistently

**File**: `src/features/org-dashboard/components/ComparisonTab.tsx`
- Apply glass tooltip style consistently
- Collapsible section: Add subtle glass surface when expanded

---

### 9. Dashboard Header & Filter Bar Polish

**File**: `src/components/dashboard/DashboardHeader.tsx`
- Add subtle description text with live timestamp or active filter count

**File**: `src/components/dashboard/OrgFilterBar.tsx`
- Apply glass surface to filter row container
- Rounded pill-style select triggers
- Active filter chips with primary accent

---

### 10. Page-Level Layout Polish

**File**: `src/components/dashboard/OrgDashboard.tsx`
- Increase section spacing to `space-y-8` for breathing room
- Add smooth fade-in animation wrapper for tab content transitions

---

### Files Modified Summary

| File | Change |
|------|--------|
| `src/features/org-dashboard/types.ts` | Extend StatCard with trend/accent |
| `src/features/org-dashboard/utils/transforms.ts` | Add trend data to stat cards |
| `src/features/org-dashboard/components/StatCards.tsx` | Premium redesign with trends |
| `src/features/org-dashboard/components/EmptyAnalyticsState.tsx` | **New** shared empty state |
| `src/components/dashboard/ExecutiveSummary.tsx` | Premium gauge + key insight |
| `src/components/dashboard/TopEngagersCard.tsx` | Avatars, ranks, hover states |
| `src/features/org-dashboard/components/OverviewTab.tsx` | Chart + empty state upgrades |
| `src/features/org-dashboard/components/OrgWorkloadIndicator.tsx` | Glass cards, progress bars |
| `src/components/dashboard/RiskTrendChart.tsx` | Premium tooltip + empty state |
| `src/components/dashboard/CategoryHealthChart.tsx` | Premium tooltip + empty state |
| `src/components/dashboard/AffectiveStateChart.tsx` | Premium tooltip + empty state |
| `src/features/org-dashboard/components/DeepAnalysisTab.tsx` | Consistent glass tabs |
| `src/features/org-dashboard/components/ComparisonTab.tsx` | Glass tooltip + polish |
| `src/features/org-dashboard/components/DashboardHeader.tsx` | Subtle timestamp |
| `src/components/dashboard/OrgFilterBar.tsx` | Glass container + pill selects |
| `src/components/dashboard/OrgDashboard.tsx` | Spacing + tab transitions |
| `src/components/dashboard/EarlyWarningPanel.tsx` | Premium empty state |
| `src/components/dashboard/AIInsightsCard.tsx` | Premium empty state |

### Design Principles Applied
- All colors from semantic tokens (no hardcoded values)
- `rounded-2xl` for premium cards, `rounded-xl` for standard
- `p-5` / `p-6` spacing throughout
- Hover transitions: `150-250ms` duration
- Calm, spacious, mental-health-appropriate aesthetic
- Full RTL compliance (logical properties only)

