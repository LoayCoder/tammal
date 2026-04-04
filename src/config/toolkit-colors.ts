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

/** Semantic state colors for task/item lifecycle */
export const STATE_COLORS = {
  completed: 'hsl(var(--state-completed))',
  overdue: 'hsl(var(--state-overdue))',
  missed: 'hsl(var(--state-missed))',
  pending: 'hsl(var(--state-pending))',
  important: 'hsl(var(--state-important))',
  normal: 'hsl(var(--state-normal))',
  checked: 'hsl(var(--state-checked))',
} as const;

/** Default org structure color */
export const ORG_DEFAULT_COLOR = 'hsl(var(--org-default))';

/**
 * Hex fallback for the org default color (used in form defaults where HSL vars don't work in color pickers).
 * This is the only place hex is acceptable — for the HTML color input element.
 */
export const ORG_DEFAULT_COLOR_HEX = '#3B82F6';

/** Action/audit log colors */
export const ACTION_COLORS = {
  create: 'hsl(var(--action-create))',
  update: 'hsl(var(--action-update))',
  delete: 'hsl(var(--destructive))',
  toggle: 'hsl(var(--action-toggle))',
  status: 'hsl(var(--action-status))',
} as const;

/** Ranking medal colors */
export const RANK_COLORS = {
  gold: 'hsl(var(--rank-gold))',
  silver: 'hsl(var(--rank-silver))',
  bronze: 'hsl(var(--rank-bronze))',
} as const;

/** Prayer completion location colors */
export const PRAYER_COLORS = {
  mosque: 'hsl(var(--prayer-mosque))',
  home: 'hsl(var(--prayer-home))',
  work: 'hsl(var(--prayer-work))',
  missed: 'hsl(var(--state-missed))',
} as const;

/** Trend direction colors */
export const TREND_COLORS = {
  positive: 'hsl(var(--trend-positive))',
  negative: 'hsl(var(--destructive))',
} as const;

/** KPI accent colors for executive dashboards */
export const KPI_COLORS = {
  progress: 'hsl(var(--kpi-progress))',
  utilization: 'hsl(var(--kpi-utilization))',
  risk: 'hsl(var(--kpi-risk))',
  trend: 'hsl(var(--kpi-trend))',
} as const;

/** Severity colors for alerts and heatmaps */
export const SEVERITY_COLORS = {
  low: 'hsl(var(--state-completed))',
  medium: 'hsl(var(--severity-medium))',
  high: 'hsl(var(--destructive))',
} as const;

/** Islamic widget accent */
export const ISLAMIC_ACCENT = 'hsl(var(--islamic-accent))' as const;

/** System role colors (hex — used in inline style for dynamic badge coloring) */
export const SYSTEM_ROLE_COLORS: Record<string, string> = {
  super_admin: 'hsl(var(--destructive))',
  tenant_admin: 'hsl(var(--state-important))',
  manager: 'hsl(var(--state-pending))',
  user: 'hsl(var(--state-completed))',
};
