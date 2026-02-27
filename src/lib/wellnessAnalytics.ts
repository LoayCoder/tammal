// ── Backward compatibility shim ──
// Risk scoring + wellness analytics moved to src/lib/analytics/
export * from './analytics/computations/riskScore';
export type {
  CategoryRiskScore, CategoryTrendPoint, CategoryMoodCell,
  EarlyWarning, PeriodComparison,
} from './analytics/types';
