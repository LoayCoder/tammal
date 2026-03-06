/**
 * Workload Feature Module
 * 
 * This barrel file re-exports all workload hooks from their canonical location
 * in src/hooks/workload/. The feature module structure provides organizational
 * clarity while the hooks remain in their original location to avoid a 
 * 150+ import path migration.
 * 
 * New workload hooks should be created in src/hooks/workload/ and re-exported here.
 * New workload components should be created in src/components/workload/.
 * New workload pages should be created in src/pages/admin/ (admin views) or
 * src/pages/employee/ (employee views).
 */

// Hooks
export { useActions } from '@/hooks/workload/useActions';
export { useAlignmentMetrics } from '@/hooks/workload/useAlignmentMetrics';
export { useApprovals } from '@/hooks/workload/useApprovals';
export { useBurnoutPredictions } from '@/hooks/workload/useBurnoutPredictions';
export { useDepartmentTasks } from '@/hooks/workload/useDepartmentTasks';
export { useEmployeeCapacity } from '@/hooks/workload/useEmployeeCapacity';
export { useEscalationEvents } from '@/hooks/workload/useEscalationEvents';
export { useExecutionVelocity } from '@/hooks/workload/useExecutionVelocity';
export { useInitiativeRisk } from '@/hooks/workload/useInitiativeRisk';
export { useInitiatives } from '@/hooks/workload/useInitiatives';
export { useIsRepresentative } from '@/hooks/workload/useIsRepresentative';
export { useObjectives } from '@/hooks/workload/useObjectives';
export { useOrgIntelligenceScore } from '@/hooks/workload/useOrgIntelligenceScore';
export { usePriorityScore } from '@/hooks/workload/usePriorityScore';
export { useRedistributionRecommendations } from '@/hooks/workload/useRedistributionRecommendations';
export { useRepresentativeTasks } from '@/hooks/workload/useRepresentativeTasks';
export { useSystemHealth } from '@/hooks/workload/useSystemHealth';
export { useTaskDependencies } from '@/hooks/workload/useTaskDependencies';
export { useTaskEvidence } from '@/hooks/workload/useTaskEvidence';
export { useTaskEvidenceUpload } from '@/hooks/workload/useTaskEvidenceUpload';
export { useTaskQueue } from '@/hooks/workload/useTaskQueue';
export { useUnifiedTasks } from '@/hooks/workload/useUnifiedTasks';
export { useWorkloadAnalytics } from '@/hooks/workload/useWorkloadAnalytics';
export { useWorkloadHeatmap } from '@/hooks/workload/useWorkloadHeatmap';
export { useDelayPredictions, useRedistributionSuggestions, useRunEscalationCheck, useRunSlaMonitor, useRunAnalyticsSnapshot, useRunAIPredictions } from '@/hooks/workload/useWorkloadIntelligence';
export { useWorkloadMetrics } from '@/hooks/workload/useWorkloadMetrics';
