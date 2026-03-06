/**
 * Centralized Design Token Definitions
 * ─────────────────────────────────────
 * Single source of truth for all spacing, typography, and layout class
 * combinations used across the platform. Import from here instead of
 * duplicating Tailwind class strings in components.
 *
 * NOTE: These map to the CSS custom properties already defined in index.css
 * and tailwind.config.ts — they do NOT replace them. They provide
 * developer-friendly constants for frequently repeated class combos.
 */

// ── Spacing ──────────────────────────────────────────────────────────
export const spacing = {
  /** Stat / KPI cards — compact density */
  cardCompact: 'p-4',
  /** Interactive cards (forms, list items, journal entries) */
  cardInteractive: 'p-5',
  /** Standard feature / dashboard cards */
  cardStandard: 'p-6',
  /** Empty-state vertical padding */
  emptyState: 'py-12',
  /** Page content wrapper */
  pageWrapper: 'px-4 py-6 sm:px-6',
  /** Section gap between card groups */
  sectionGap: 'space-y-6',
  /** Grid gap for card grids */
  gridGap: 'gap-4',
} as const;

// ── Typography ───────────────────────────────────────────────────────
export const typography = {
  /** Page-level heading (H1) */
  pageTitle: 'text-xl font-bold text-foreground',
  /** Section heading */
  sectionTitle: 'text-lg font-semibold text-foreground',
  /** Card title */
  cardTitle: 'text-base font-semibold text-foreground',
  /** KPI / metric large number */
  metric: 'text-2xl font-bold text-foreground',
  /** Stat card label */
  statLabel: 'text-xs font-medium text-muted-foreground',
  /** Standard subtitle / description */
  subtitle: 'text-sm text-muted-foreground',
  /** Small helper text */
  caption: 'text-2xs text-muted-foreground',
} as const;

// ── Card Variants ────────────────────────────────────────────────────
export const cardVariants = {
  /** Glass morphism card */
  glass: 'glass-card border-0 rounded-2xl',
  /** Glass stat card */
  stat: 'glass-stat border-0 rounded-2xl',
  /** Dashed outline card */
  dashed: 'glass-card border-0 rounded-2xl border-dashed',
  /** Elevated card with hover */
  elevated: 'glass-card border-0 rounded-2xl hover:-translate-y-1 transition-all duration-300',
} as const;

// ── Layout ───────────────────────────────────────────────────────────
export const layout = {
  /** Standard content max width */
  contentMaxWidth: 'max-w-4xl mx-auto',
  /** Narrow content (forms, single-column) */
  narrowMaxWidth: 'max-w-2xl mx-auto',
  /** Full-width grid for stat cards */
  statGrid2: 'grid gap-4 grid-cols-2',
  statGrid3: 'grid gap-4 grid-cols-2 md:grid-cols-3',
  statGrid4: 'grid gap-4 grid-cols-2 md:grid-cols-4',
  statGrid6: 'grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  /** Dashboard grid for mixed content */
  dashboardGrid: 'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
} as const;

// ── Iconography ──────────────────────────────────────────────────────
export const iconBox = {
  /** Small icon container (stat cards) */
  sm: 'w-8 h-8 rounded-xl flex items-center justify-center shrink-0',
  /** Medium icon container (page headers, feature cards) */
  md: 'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
  /** Large icon container (empty states) */
  lg: 'w-14 h-14 rounded-2xl flex items-center justify-center shrink-0',
} as const;
