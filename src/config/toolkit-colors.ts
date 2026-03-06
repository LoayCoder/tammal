/**
 * Centralized Mental Toolkit color tokens.
 * These map to CSS custom properties defined in index.css.
 * Use `hsl(...)` for inline styles (e.g., Recharts), use Tailwind classes where possible.
 */

// HSL string helpers (for inline style / Recharts usage)
export const TOOLKIT = {
  lavender: 'hsl(var(--toolkit-lavender))',
  sage: 'hsl(var(--toolkit-sage))',
  plum: 'hsl(var(--toolkit-plum))',
  sky: 'hsl(var(--toolkit-sky))',
  gold: 'hsl(var(--toolkit-gold))',
  peach: 'hsl(var(--toolkit-peach))',
  warm: 'hsl(var(--toolkit-warm))',
  coral: 'hsl(var(--toolkit-coral))',
  amber: 'hsl(var(--toolkit-amber))',
  rose: 'hsl(var(--toolkit-rose))',
} as const;

/** Zone colors for burnout / mood zones */
export const ZONE_COLORS: Record<string, string> = {
  thriving: 'hsl(var(--toolkit-zone-thriving))',
  watch: 'hsl(var(--toolkit-zone-watch))',
  atRisk: 'hsl(var(--toolkit-zone-at-risk))',
};

/** Donut / pie chart colors for mood distribution */
export const DONUT_COLORS = [
  TOOLKIT.lavender,
  TOOLKIT.sage,
  TOOLKIT.sky,
  TOOLKIT.amber,
  TOOLKIT.coral,
];

/** Category colors for journaling, articles, meditation targets, crisis regions */
export const TOOLKIT_CATEGORY_COLORS: Record<string, string> = {
  // Journaling categories
  gratitude: TOOLKIT.sage,
  selfCompassion: TOOLKIT.lavender,
  values: TOOLKIT.gold,
  emotionalCheckin: TOOLKIT.sky,
  // Article categories
  anxiety: TOOLKIT.lavender,
  mood: TOOLKIT.sky,
  stress: TOOLKIT.peach,
  cbt: TOOLKIT.gold,
  skills: TOOLKIT.sage,
  growth: TOOLKIT.warm,
  // Meditation targets
  sleep: TOOLKIT.sky,
  focus: TOOLKIT.gold,
  energy: TOOLKIT.sage,
};

/** Crisis region colors */
export const REGION_COLORS: Record<string, string> = {
  global: TOOLKIT.sky,
  us: TOOLKIT.sage,
  uk: TOOLKIT.lavender,
  middleEast: TOOLKIT.gold,
};

/** Assessment result severity colors */
export const ASSESSMENT_COLORS = {
  minimal: TOOLKIT.sage,
  low: TOOLKIT.sage,
  mild: TOOLKIT.gold,
  moderate: TOOLKIT.peach,
  moderatelySevere: TOOLKIT.coral,
  severe: TOOLKIT.rose,
  high: TOOLKIT.rose,
} as const;

/** Default org structure color */
export const ORG_DEFAULT_COLOR = 'hsl(var(--org-default))';

/**
 * Hex fallback for the org default color (used in form defaults where HSL vars don't work in color pickers).
 * This is the only place hex is acceptable — for the HTML color input element.
 */
export const ORG_DEFAULT_COLOR_HEX = '#3B82F6';
