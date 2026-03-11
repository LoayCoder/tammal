/**
 * Workload Feature Module
 *
 * All workload hooks are co-located under src/features/workload/hooks/.
 * Import from '@/features/workload' for the public API.
 */

// Hooks
export { useActions } from './hooks/useActions';
export { useAlignmentMetrics } from './hooks/useAlignmentMetrics';
export { useBurnoutPredictions } from './hooks/useBurnoutPredictions';
export { useDepartmentTasks } from './hooks/useDepartmentTasks';
export { useEmployeeCapacity } from './hooks/useEmployeeCapacity';
export { useEscalationEvents } from './hooks/useEscalationEvents';
export { useExecutionVelocity } from './hooks/useExecutionVelocity';
export { useInitiativeRisk } from './hooks/useInitiativeRisk';
export { useInitiatives } from './hooks/useInitiatives';
export { useIsRepresentative } from './hooks/useIsRepresentative';
export { useObjectives } from './hooks/useObjectives';
export { useOrgIntelligenceScore } from './hooks/useOrgIntelligenceScore';
export { usePriorityScore } from './hooks/usePriorityScore';
export { useRedistributionRecommendations } from './hooks/useRedistributionRecommendations';
export { useRepresentativeTasks } from './hooks/useRepresentativeTasks';
export { useSystemHealth } from './hooks/useSystemHealth';
export { useTaskEvidence } from './hooks/useTaskEvidence';
export { useTaskEvidenceUpload } from './hooks/useTaskEvidenceUpload';
export { useTaskQueue } from './hooks/useTaskQueue';
export { useUnifiedTasks } from './hooks/useUnifiedTasks';
export { useWorkloadAnalytics } from './hooks/useWorkloadAnalytics';
export { useWorkloadHeatmap } from './hooks/useWorkloadHeatmap';
export { useDelayPredictions, useRedistributionSuggestions, useRunEscalationCheck, useRunSlaMonitor, useRunAnalyticsSnapshot, useRunAIPredictions } from './hooks/useWorkloadIntelligence';
export { useWorkloadMetrics } from './hooks/useWorkloadMetrics';

// Types re-exports
export type { EmployeeCapacity } from './hooks/useEmployeeCapacity';
export type { WorkloadMetric } from './hooks/useWorkloadMetrics';
export type { TaskQueueItem } from './hooks/useTaskQueue';
export type { EscalationEvent } from './hooks/useEscalationEvents';
export type { BurnoutPrediction } from './hooks/useBurnoutPredictions';
export type { VelocityMetric } from './hooks/useExecutionVelocity';
export type { AlignmentMetric } from './hooks/useAlignmentMetrics';
export type { InitiativeRiskMetric } from './hooks/useInitiativeRisk';
export type { OrgIntelligenceScore } from './hooks/useOrgIntelligenceScore';
export type { HeatmapMetric } from './hooks/useWorkloadHeatmap';
export type { RedistributionRecommendation } from './hooks/useRedistributionRecommendations';

