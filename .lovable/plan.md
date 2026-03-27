

# Design System Compliance Migration Plan

## Scope

5 workstreams, ~81 files affected. Execution is phased to minimize regression risk — each phase is independently shippable.

---

## Phase 1 — Page Headers (14 pages + ToolkitPageHeader retirement)

**Problem**: 14+ pages build their own headers with raw `glass-card border-0 rounded-xl p-6 flex...` HTML. Three competing patterns exist.

**Action**: Replace all inline headers with `<PageHeader>` from `@/components/system`.

The current `PageHeader` uses `rounded-none` (flush edge-to-edge). Most pages use `rounded-xl` (card-style). Before migration, the `PageHeader` component needs a `variant` prop or the pages need to adopt the flush style. Recommendation: **add a `variant?: "flush" | "card"` prop** to `PageHeader` — `flush` = current behavior (rounded-none, border-b), `card` = rounded-xl with padding. Default stays `flush`.

**Files (grouped by task)**:

| Task | Pages |
|---|---|
| Admin headers | PlanManagement, TenantManagement, SubscriptionManagement, SubcategoryManagement, CategoryManagement, ScheduleManagement, CheckinMonitor, SurveyMonitor, ObjectivesManagement, AdminBranding |
| Recognition headers | RecognitionManagement, RecognitionResults, NominatePage, NominationApprovalsPage |
| Crisis & settings | FirstAiderDashboard, MySupportPage, Support, UserProfile, CrisisSettings |
| Dashboard headers | ExecutiveDashboard, WorkloadDashboard, TaskConnectors, PortfolioDashboard |
| Toolkit retirement | Make `ToolkitPageHeader` a thin re-export of `PageHeader` |

**Pattern — before**:
```text
<div className="glass-card border-0 rounded-xl p-6 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <div className="bg-primary/10 rounded-lg p-2"><Icon .../></div>
    <div>
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground text-sm">{subtitle}</p>
    </div>
  </div>
  {actions}
</div>
```

**Pattern — after**:
```text
<PageHeader
  icon={<Icon className="h-5 w-5 text-primary" />}
  title={t('...')}
  subtitle={t('...')}
  actions={<Select .../>}
  variant="card"
/>
```

---

## Phase 2 — Stat/Metric Card Migration (15 files)

**Problem**: 15 files build stat cards with raw `glass-stat border-0` + inline `CardHeader`/`CardContent` markup instead of `<StatCard>` or `<MetricCard>`.

**Action**: Replace with system components. Two patterns:

- **Simple stat** (label + big number + optional icon) → `<StatCard>`
- **Rich metric** (label + value + description + icon in header) → `<MetricCard>`

**Files**:
- `StatCards.tsx` (org-dashboard), `TeamStatCards.tsx`, `ScheduleStatCards.tsx`, `SaasStatsSection.tsx`, `WorkloadDashboard.tsx`
- `PersonalMoodDashboard.tsx`, `QuranReader.tsx`, `FirstAiderDashboard.tsx`, `CrisisAnalyticsTab.tsx`, `UsageBilling.tsx`

Note: Some stat cards (e.g., PersonalMoodDashboard) have custom layouts (centered icons, colored text). These may need a `children` slot on `StatCard` or remain as `MetricCard` with description.

---

## Phase 3 — Card Class Tokenization (81 + 15 files)

**Problem**: `glass-card border-0 rounded-xl` is hardcoded in 81 files. `glass-stat border-0` in 15 files.

**Action**: Find-and-replace with token imports.

```text
// Before
<Card className="glass-card border-0 rounded-xl">

// After
import { cardVariants } from "@/theme/tokens";
<Card className={cardVariants.glass}>
```

Note: `cardVariants.glass` currently outputs `glass-card border-0 rounded-lg` (not `rounded-xl`). Either:
- Update token to `rounded-xl` to match current app convention, OR
- Keep `rounded-lg` and accept the subtle visual change.

**Recommendation**: Update `cardVariants.glass` to use `rounded-xl` since that's what 81 files already use, then do the replacement.

---

## Phase 4 — Typography Tokenization (62+ files)

**Problem**: Raw Tailwind typography classes instead of `typography.*` tokens.

**Mapping**:
| Raw class | Token |
|---|---|
| `text-2xl font-bold` (in metrics) | `typography.metric` |
| `text-2xl font-semibold` (page titles) | `typography.pageTitle` |
| `text-xs font-medium` / `text-xs font-bold` (stat labels) | `typography.statLabel` |
| `text-sm text-muted-foreground` (subtitles) | `typography.subtitle` |
| `text-base font-semibold` (card titles) | `typography.cardTitle` |
| `text-lg font-semibold` (section titles) | `typography.sectionTitle` |

**Action**: Import `typography` from `@/theme/tokens` and replace raw classes. This is mostly mechanical but must be done carefully — not every `text-2xl font-bold` is a metric (some are in animations, overlays, etc.).

---

## Phase 5 — Arbitrary Value Audit (498 instances, 65 files)

**Action**: Two-step process.

1. **Classify** — Run through all 498 arbitrary values and categorize:
   - **Acceptable**: Dialog widths (`sm:max-w-[500px]`), animation keyframes, SVG coordinates, third-party library requirements
   - **Replaceable**: Fixed widths that should be standard Tailwind (`w-40`, `w-44`, `max-w-xs`), arbitrary padding/margin that maps to spacing scale

2. **Replace** — Swap replaceable values with standard Tailwind classes or new tokens added to `tokens.ts`.

Estimated: ~60% acceptable, ~40% replaceable.

---

## Execution Order

```text
Phase 1 ─── PageHeader variant prop + 14 page migrations
Phase 2 ─── StatCard/MetricCard migrations (15 files)
Phase 3 ─── cardVariants token replacement (96 files)
Phase 4 ─── typography token replacement (62 files)
Phase 5 ─── Arbitrary value audit + cleanup
```

Each phase is independently testable. Total estimated: ~16 tasks across 5 requirements.

## Risk Mitigation

- **Visual regression**: Each phase should be followed by a visual spot-check on 3-4 representative pages (admin, dashboard, spiritual, recognition).
- **Token value mismatch**: `cardVariants.glass` uses `rounded-lg` but app uses `rounded-xl` — must reconcile before Phase 3.
- **Custom stat cards**: Some stat cards in PersonalMoodDashboard and FirstAiderDashboard have non-standard layouts that may not fit `StatCard` — these get `MetricCard` or keep custom markup with tokenized classes.

