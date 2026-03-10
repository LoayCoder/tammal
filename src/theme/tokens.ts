/**
 * Centralized Design Token Definitions — Orbitask Style
 */

// ── Spacing ──────────────────────────────────────────────────────────
export const spacing = {
  cardCompact: 'p-4',
  cardInteractive: 'p-5',
  cardStandard: 'p-6',
  emptyState: 'py-12',
  pageWrapper: 'px-4 py-6 sm:px-6',
  sectionGap: 'space-y-6',
  gridGap: 'gap-4',
} as const;

// ── Typography ───────────────────────────────────────────────────────
export const typography = {
  pageTitle: 'text-xl font-bold text-foreground',
  sectionTitle: 'text-lg font-semibold text-foreground',
  cardTitle: 'text-base font-semibold text-foreground',
  metric: 'text-2xl font-bold text-foreground',
  statLabel: 'text-xs font-medium text-muted-foreground',
  subtitle: 'text-sm text-muted-foreground',
  caption: 'text-2xs text-muted-foreground',
} as const;

// ── Card Variants ────────────────────────────────────────────────────
export const cardVariants = {
  glass: 'glass-card border-0 rounded-lg',
  stat: 'glass-stat border-0 rounded-lg',
  dashed: 'glass-card border-0 rounded-lg border-dashed',
  elevated: 'glass-card border-0 rounded-lg hover:-translate-y-1 transition-all duration-300',
} as const;

// ── Layout ───────────────────────────────────────────────────────────
export const layout = {
  contentMaxWidth: 'max-w-4xl mx-auto',
  narrowMaxWidth: 'max-w-2xl mx-auto',
  statGrid2: 'grid gap-4 grid-cols-2',
  statGrid3: 'grid gap-4 grid-cols-2 md:grid-cols-3',
  statGrid4: 'grid gap-4 grid-cols-2 md:grid-cols-4',
  statGrid6: 'grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  dashboardGrid: 'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
} as const;

// ── Iconography ──────────────────────────────────────────────────────
export const iconBox = {
  sm: 'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
  md: 'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
  lg: 'w-14 h-14 rounded-lg flex items-center justify-center shrink-0',
} as const;
