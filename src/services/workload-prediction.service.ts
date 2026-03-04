/**
 * Workload Prediction Service — Architecture Stubs (Future AI Layer)
 *
 * These interfaces and placeholder functions define the contract
 * for predictive capabilities. No model implementation yet.
 */

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface DelayPrediction {
  initiativeId: string;
  predictedDelayDays: number;
  confidence: number; // 0–1
  riskFactors: string[];
  suggestedActions: string[];
}

export interface WorkloadRedistribution {
  fromEmployeeId: string;
  toEmployeeId: string;
  actionId: string;
  reason: string;
  estimatedImpact: {
    fromUtilizationAfter: number;
    toUtilizationAfter: number;
  };
}

export interface CompletionForecast {
  entityId: string;
  entityType: 'objective' | 'initiative' | 'action';
  currentProgress: number;
  predictedCompletionDate: string;
  confidence: number;
  velocity: number; // percentage points per week
}

/* ------------------------------------------------------------------ */
/*  Stubs                                                              */
/* ------------------------------------------------------------------ */

/**
 * Predict delay for an initiative based on action completion velocity.
 * @stub — returns null until AI model is integrated.
 */
export async function predictDelays(
  _initiativeId: string,
): Promise<DelayPrediction | null> {
  // Future: call AI model or edge function
  return null;
}

/**
 * Suggest workload redistribution to balance team capacity.
 * @stub — returns empty array until AI model is integrated.
 */
export async function suggestRedistribution(
  _tenantId: string,
): Promise<WorkloadRedistribution[]> {
  return [];
}

/**
 * Forecast completion date for a strategic entity.
 * @stub — returns null until AI model is integrated.
 */
export async function forecastCompletion(
  _entityId: string,
  _entityType: CompletionForecast['entityType'],
): Promise<CompletionForecast | null> {
  return null;
}
