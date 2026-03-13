import { useMemo, useCallback } from 'react';
import { computePriorityScore, type PriorityScoreInput } from '@/features/workload/services/workload-intelligence.service';

/**
 * Hook that exposes the priority score computation
 * and sorts a list of actions by their computed score.
 */
export function usePriorityScore() {
  const calculate = useCallback(
    (input: PriorityScoreInput) => computePriorityScore(input),
    [],
  );

  /**
   * Derive urgency from due date proximity (0-10 scale).
   */
  const urgencyFromDate = useCallback((dueDate: string | null): number => {
    if (!dueDate) return 0;
    const diff = (new Date(dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (diff < 0) return 10; // overdue
    if (diff <= 1) return 9;
    if (diff <= 3) return 7;
    if (diff <= 7) return 5;
    if (diff <= 14) return 3;
    return 1;
  }, []);

  /**
   * Sort actions by priority score descending.
   */
  const sortByPriority = useCallback(
    <T extends { priority?: number; planned_end?: string | null }>(
      items: T[],
    ): T[] => {
      return [...items].sort((a, b) => {
        const scoreA = computePriorityScore({
          strategicImportance: 5,
          urgency: urgencyFromDate(a.planned_end ?? null),
          riskSeverity: 5,
          managerPriority: a.priority ?? 5,
        });
        const scoreB = computePriorityScore({
          strategicImportance: 5,
          urgency: urgencyFromDate(b.planned_end ?? null),
          riskSeverity: 5,
          managerPriority: b.priority ?? 5,
        });
        return scoreB - scoreA;
      });
    },
    [urgencyFromDate],
  );

  return { calculate, urgencyFromDate, sortByPriority };
}
