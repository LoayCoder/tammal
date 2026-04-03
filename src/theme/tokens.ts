/**
 * Centralized Design Token Definitions — Tammal Premium Mental-Health UI
 * Aesthetic: Linear precision · Notion calm · Headspace softness · Apple clarity
 */

// ── Spacing ──────────────────────────────────────────────────────────
export const spacing = {
  cardCompact:     'p-4',
  cardInteractive: 'p-5',
  cardStandard:    'p-6',
  cardGenerous:    'p-8',                        // VIP/featured cards
  emptyState:      'py-16',                      // Generous breathing room
  pageWrapper:     'px-4 py-6 sm:px-6 lg:px-8', // Wider on large screens
  sectionGap:      'space-y-8',
  gridGap:         'gap-5',                      // Slightly wider for premium feel
} as const;

// ── Typography ───────────────────────────────────────────────────────
export const typography = {
  pageTitle:    'text-2xl font-semibold text-foreground tracking-tight',
  sectionTitle: 'text-lg font-semibold text-foreground',
  cardTitle:    'text-base font-semibold text-foreground',
  metric:       'text-2xl font-bold text-foreground tabular-nums',
  statLabel:    'text-xs font-medium text-muted-foreground uppercase tracking-wide',
  subtitle:     'text-sm text-muted-foreground leading-relaxed',
  caption:      'text-2xs text-muted-foreground',
} as const;

// ── Card Variants ────────────────────────────────────────────────────
export const cardVariants = {
  glass:    'glass-card border-0 rounded-xl',
  stat:     'glass-stat border-0 rounded-xl',
  dashed:   'border-2 border-dashed border-border/60 rounded-xl bg-card/40',
  elevated: 'glass-card border-0 rounded-xl hover:-translate-y-0.5 transition-all duration-200',
} as const;

// ── Layout ───────────────────────────────────────────────────────────
export const layout = {
  contentMaxWidth: 'max-w-4xl mx-auto',
  narrowMaxWidth:  'max-w-2xl mx-auto',
  statGrid2:       'grid gap-5 grid-cols-2',
  statGrid3:       'grid gap-5 grid-cols-2 md:grid-cols-3',
  statGrid4:       'grid gap-5 grid-cols-2 md:grid-cols-4',
  statGrid6:       'grid gap-5 grid-cols-2 md:grid-cols-3 lg:grid-cols-6',
  dashboardGrid:   'grid gap-6 md:grid-cols-2 lg:grid-cols-3',
} as const;

// ── Iconography ──────────────────────────────────────────────────────
export const iconBox = {
  sm: 'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
  md: 'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
  lg: 'w-14 h-14 rounded-xl flex items-center justify-center shrink-0',
} as const;

// ── Animations ───────────────────────────────────────────────────────
export const animations = {
  fadeIn:     'animate-calm-fade-in',
  slideUp:    'animate-in slide-in-from-bottom-3 duration-[400ms] ease-[cubic-bezier(0.4,0,0.2,1)]',
  zoomIn:     'animate-gentle-scale-in',
  hoverScale: 'hover:scale-[1.015] transition-transform duration-200 ease-out',
  hoverGlow:  'hover:shadow-md hover:shadow-primary/8 transition-all duration-200 ease-out',
  hoverLift:  'hover:-translate-y-0.5 transition-transform duration-200 ease-out',
} as const;

// ── Incident categories ──────────────────────────────────────────────
export type IncidentCategory = 'safety' | 'injury' | 'property' | 'environmental' | 'security';

export const incidentCategories: Record<
  IncidentCategory,
  { color: string; bg: string; label: string; description: string }
> = {
  safety: {
    color:       'text-incident-safety',
    bg:          'bg-incident-safety-bg',
    label:       'Safety',
    description: 'Workplace safety events',
  },
  injury: {
    color:       'text-incident-injury',
    bg:          'bg-incident-injury-bg',
    label:       'Injury',
    description: 'Personnel injury reports',
  },
  property: {
    color:       'text-incident-property',
    bg:          'bg-incident-property-bg',
    label:       'Property',
    description: 'Asset & property damage',
  },
  environmental: {
    color:       'text-incident-environmental',
    bg:          'bg-incident-environmental-bg',
    label:       'Environmental',
    description: 'Environmental incidents',
  },
  security: {
    color:       'text-incident-security',
    bg:          'bg-incident-security-bg',
    label:       'Security',
    description: 'Security & access events',
  },
} as const;
