/**
 * Workload domain constants — single source of truth for thresholds,
 * capacities, and burnout scoring weights.
 *
 * Change a number here and it propagates to the intelligence service,
 * analytics service, and dashboard automatically.
 */

/** Default daily capacity when no override is set (8 h × 60 min). */
export const DEFAULT_CAPACITY_MINUTES = 480;

/** Utilization % thresholds used to classify an employee's workload. */
export const UTILIZATION_THRESHOLDS = {
  /** Below this % → 'underutilized' */
  UNDERUTILIZED: 60,
  /** Up to this % → 'healthy' */
  HEALTHY_MAX: 90,
  /** Up to this % → 'high_load'; above → 'burnout_risk' */
  HIGH_LOAD_MAX: 110,
} as const;

/** Burnout-risk flag thresholds. */
export const BURNOUT_FLAGS = {
  /** Active-minutes threshold for the "over capacity" flag (= DEFAULT_CAPACITY_MINUTES). */
  OVER_CAPACITY_MINUTES: DEFAULT_CAPACITY_MINUTES,
  /** Overdue-action count above which the "overdue excess" flag triggers. */
  OVERDUE_COUNT: 3,
  /** Off-hours minutes above which the "off-hours excess" flag triggers. */
  OFF_HOURS_MINUTES: 120,
} as const;

/** Weighting percentages applied to each burnout-risk dimension (must sum to 100). */
export const BURNOUT_SCORE_WEIGHTS = {
  CAPACITY: 40,
  OVERDUE: 35,
  OFF_HOURS: 25,
} as const;

/** Normalization denominators for continuous burnout-score contributions. */
export const BURNOUT_SCORE_NORMALIZATION = {
  /** Denominator for the capacity component (= DEFAULT_CAPACITY_MINUTES). */
  CAPACITY: DEFAULT_CAPACITY_MINUTES,
  /** Denominator for the overdue component. */
  OVERDUE: 10,
  /** Denominator for the off-hours component. */
  OFF_HOURS: 300,
} as const;
