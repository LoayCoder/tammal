// ── Backward compatibility shim ──
// Synthesis engine moved to src/lib/analytics/synthesis.ts
export * from './analytics/synthesis';
export type {
  CheckinPulseMetrics, SurveyStructuralMetrics,
  DivergenceAlert, DepartmentBAIItem, SynthesisResult,
} from './analytics/types';
