

# TAMMAL UI QA Audit Report — Design System Compliance (Post-Migration)

**Audit Date**: 2026-03-27
**Auditor**: Senior UI/UX QA
**Design System Version**: v1.0.0 (`src/theme/tokens.ts`, `src/components/system/`)
**Scope**: Full application codebase — all pages, components, and shared modules

---

## Executive Summary

After the Phase 1–3 migration (PageHeader, StatCard, cardVariants tokenization), compliance has improved significantly. Card class tokenization is now at ~95%. However, **typography tokenization remains at near-zero** in production pages, and **several pages still bypass the PageHeader component entirely**. Two open phases (4 and 5) from the migration plan are confirmed as still necessary.

**Overall Grade: C+ (up from D pre-migration)**

---

## 1. Page Header Compliance

### 1.1 Pages still NOT using `<PageHeader>` — HIGH

| Page | Current Pattern | Severity |
|---|---|---|
| `SystemHealth.tsx` | Raw `<h1 className="text-2xl font-bold">` + no card wrapper | **High** |
| `TeamWorkload.tsx` | Raw `<h1 className="text-2xl font-bold tracking-tight">` | **High** |
| `RepresentativeWorkload.tsx` | Raw `<h1 className="text-2xl font-bold">` | **High** |
| `RedemptionCatalog.tsx` | Raw `<h1 className="text-2xl font-bold">` | **High** |
| `MyNominationsPage.tsx` | Raw `<h1>` with inline Trophy icon | **High** |
| `TenantDashboard.tsx` | Raw `<h1 className="text-2xl font-bold">` with back-button layout | **High** |
| `MentalToolkit.tsx` (hub page) | Raw `<h1 className="text-xl font-bold">` — wrong size | **High** |
| `ComponentShowcase.tsx` | Raw `<h1 className="text-2xl font-bold">` (dev page) | **Low** |
| `EmployeeSurvey.tsx` | Raw `<h1 className="text-xl font-bold">` inside card | **Medium** |
| `OverdueTasks.tsx` (tasks feature) | No header at all — uses inline stat cards | **Medium** |

**Rule violated**: Design System mandates `<PageHeader>` for all page-level headers.
**Recommendation**: Migrate all remaining pages to `<PageHeader variant="card">`. For TenantDashboard's back-button pattern, extend PageHeader with an optional `backAction` prop.

### 1.2 PageHeader component itself uses hardcoded classes — MEDIUM

`PageHeader.tsx` line 27 uses `"glass-card border-0 rounded-xl p-6"` instead of `cardVariants.glass` token.
Line 45 uses `"glass-card border-0 rounded-none..."` — also hardcoded.

**Rule violated**: Token governance — system components should consume their own tokens.
**Recommendation**: Import `cardVariants` and use `cn(cardVariants.glass, "p-6")` for card variant.

---

## 2. Typography Token Adoption — CRITICAL

| Issue | Count | Severity |
|---|---|---|
| `text-2xl font-bold` used instead of `typography.pageTitle` or `typography.metric` | **55 files, 495 matches** | **Critical** |
| `text-xl font-bold` (non-standard size — not in token set) | **7 files, 52 matches** | **High** |
| `text-lg font-semibold` used raw instead of `typography.sectionTitle` | **26 files, 135 matches** | **High** |
| `font-medium` used (violates 400/600/700 weight restriction) | **216 files, 2405 matches** | **Medium** |
| Files importing `typography` tokens | **7 files only** (all system/dev) | **Critical** |

**Rules violated**:
- Design System specifies `font-semibold` (600) for page titles; most pages use `font-bold` (700)
- `font-medium` (500) is not in the approved weight set (400/600/700)
- `text-xl` is not a defined typography token size
- Zero feature pages import `typography.*` tokens

**Recommendation**: Execute Phase 4 of migration plan. Map `text-2xl font-bold` → `typography.metric` (for numbers) or `typography.pageTitle` (for headings). Eliminate `text-xl font-bold` — standardize to `text-2xl font-semibold`.

---

## 3. Stat/Metric Card Adoption — MEDIUM

| Issue | Details | Severity |
|---|---|---|
| `FirstAiderDashboard.tsx` stat cards | Uses raw `Card` + `CardContent` with inline centered layout, `text-2xl font-bold`, and manual icon boxes. Does NOT use `<StatCard>` | **High** |
| `OverdueTasks.tsx` stat cards | Raw `Card` + `CardContent` with `text-xl font-bold` | **Medium** |
| `SunnahTracker.tsx` stat grid | Raw cards with `text-2xl font-bold` | **Medium** |
| `BreathingPage.tsx` stat cards | Raw cards with `text-xl font-bold` | **Low** |
| Files importing `StatCard` from system | **3 files** (2 dev pages + RecognitionMonitor) | **High** |
| Files importing `DashboardGrid` from system | **2 files** (both dev pages) | **High** |

**Rule violated**: Design System mandates `<StatCard>` for simple stats and `<DashboardGrid>` for stat layouts.
**Recommendation**: Migrate remaining raw stat cards to `<StatCard>`. FirstAiderDashboard is the highest priority — 4 stat cards with completely custom markup.

---

## 4. Spacing Token Adoption — HIGH

| Issue | Details | Severity |
|---|---|---|
| Files importing `spacing.*` tokens | **6 files** (all system/dev + RecognitionMonitor) | **High** |
| Raw `p-4`, `p-5`, `p-6` in card content | ~200+ instances across codebase | **High** |
| Raw `space-y-6`, `space-y-8` for section gaps | ~100+ instances | **Medium** |
| Raw `px-4 py-6` for page wrappers | ~30+ instances | **Medium** |

**Rule violated**: Token governance requires `spacing.cardCompact`, `spacing.sectionGap`, etc.
**Recommendation**: Add spacing token migration to Phase 4 scope.

---

## 5. Card Class Tokenization — MOSTLY COMPLIANT

| Check | Status |
|---|---|
| `cardVariants` imported in feature files | **116 files** — PASS |
| Remaining hardcoded `glass-card border-0 rounded-xl` | **1 file** (PageHeader.tsx itself) — see 1.2 |
| Remaining hardcoded `glass-stat border-0` | **0 files** — PASS |
| Redundant `rounded-xl` alongside `cardVariants.stat` | **4 instances** in FirstAiderDashboard (token already includes `rounded-xl`) |

**Grade: A-** — Phase 3 migration was effective. Only the PageHeader system component and FirstAiderDashboard need cleanup.

---

## 6. RTL Compliance — PASS

| Check | Status |
|---|---|
| `ml-` / `mr-` / `pl-` / `pr-` usage | **0 matches** — PASS |
| `text-left` / `text-right` | **0 matches** — PASS |
| Logical properties (`ms-`, `me-`, `ps-`, `pe-`) | Used consistently — PASS |
| `start` / `end` positioning | Correct — PASS |

**Grade: A** — No RTL violations detected.

---

## 7. Color System — PASS

| Check | Status |
|---|---|
| HSL CSS variables for all colors | PASS |
| No hardcoded hex values in className | PASS |
| Dark mode variable coverage | PASS |
| Brand injection system | PASS |

**Grade: A**

---

## 8. Arbitrary Tailwind Values — WARNING

| Metric | Count |
|---|---|
| Total arbitrary values (`[Npx]`) | **848 matches in 111 files** |
| Skeleton heights (`h-[260px]`, `h-[80px]`) | ~60% — mostly acceptable |
| Fixed input/dialog widths (`w-[140px]`, `sm:max-w-[900px]`) | ~25% — acceptable |
| Non-standard arbitrary values (replaceable) | ~15% — needs token mapping |

**Rule violated**: Design System governance says "no arbitrary values."
**Recommendation**: Execute Phase 5 audit. Most Skeleton and ResponsiveContainer heights are acceptable. Focus on replacing arbitrary widths in form inputs and layout containers with standard Tailwind or new tokens.

---

## 9. `font-medium` Weight Violation — MEDIUM

The design system restricts font weights to 400 (`font-normal`), 600 (`font-semibold`), 700 (`font-bold`). However, `font-medium` (500) appears **2,405 times in 216 files**, including:
- Shadcn UI primitives (accordion, navigation-menu) — acceptable, not customizable
- Feature code labels, table headers, badges — should be `font-semibold`

**Recommendation**: Audit `font-medium` usage in feature code. Replace with `font-semibold` where it represents emphasis. Leave Shadcn primitives as-is (they remap 500→600 via Tailwind config).

---

## 10. System Component Adoption Summary

| Component | Defined | Used in Production | Grade |
|---|---|---|---|
| `PageHeader` | Yes | **~22 pages** (good progress, ~10 still missing) | **B** |
| `StatCard` | Yes | **1 page** (RecognitionMonitor only) | **F** |
| `MetricCard` | Yes | **0 pages** | **F** |
| `ChartCard` | Yes | **0 pages** | **F** |
| `InsightCard` | Yes | **0 pages** | **F** |
| `DashboardGrid` | Yes | **0 pages** | **F** |
| `EmptyState` | Yes | Partial use | **C** |

---

## Priority Fix List (Ordered by Impact)

| # | Issue | Severity | Files | Phase |
|---|---|---|---|---|
| 1 | Typography tokens not used in any feature page | **Critical** | 55+ files | Phase 4 |
| 2 | 10+ pages still use raw headers instead of `<PageHeader>` | **High** | 10 files | Phase 1 (cont.) |
| 3 | `StatCard`/`MetricCard`/`ChartCard`/`DashboardGrid` unused in production | **High** | 15+ files | Phase 2 (cont.) |
| 4 | `spacing.*` tokens unused in feature code | **High** | 200+ instances | Phase 4 |
| 5 | `font-medium` weight violation (2,405 uses) | **Medium** | 216 files | Phase 4 |
| 6 | `text-xl font-bold` non-standard size (52 uses) | **High** | 7 files | Phase 4 |
| 7 | 848 arbitrary pixel values | **Medium** | 111 files | Phase 5 |
| 8 | PageHeader component uses hardcoded classes internally | **Medium** | 1 file | Immediate |
| 9 | Redundant `rounded-xl` on cards already using `cardVariants.stat` | **Low** | 1 file | Cleanup |

---

## Conclusion

The Phase 1–3 migration achieved strong results for **card tokenization** (A-) and maintained excellent **RTL** (A) and **color system** (A) compliance. The remaining gaps are concentrated in two areas:

1. **Typography** — the single largest compliance gap. Zero feature pages use `typography.*` tokens. This is Phase 4.
2. **System component adoption** — `StatCard`, `MetricCard`, `ChartCard`, `DashboardGrid`, and `InsightCard` exist but are only referenced in dev sandbox pages.

Phases 4 and 5 of the existing migration plan directly address these findings. No new workstreams are needed.

