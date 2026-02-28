/**
 * useAudienceResolver — encapsulates audience resolution logic.
 * Extracted from ScheduleManagement.tsx with ZERO behaviour change.
 */

import { useMemo } from 'react';
import type { QuestionSchedule } from '@/hooks/questions/useQuestionSchedules';

export interface AudienceEmployee {
  id: string;
  full_name: string;
  email: string;
  department: string | null;
}

export interface AudienceResult {
  includedEmployees: AudienceEmployee[];
  excludedEmployees: AudienceEmployee[];
  totalEligible: number;
  includedCount: number;
}

export function resolveAudience(
  targetAudience: QuestionSchedule['target_audience'],
  employees: AudienceEmployee[],
): AudienceResult {
  const included: AudienceEmployee[] = [];
  const excluded: AudienceEmployee[] = [];

  for (const emp of employees) {
    let isIncluded = false;
    if (targetAudience?.all) {
      isIncluded = true;
    } else if (targetAudience?.departments?.length) {
      isIncluded = targetAudience.departments.includes(emp.department || '');
    } else if (targetAudience?.specific_employees?.length) {
      isIncluded = targetAudience.specific_employees.includes(emp.id);
    } else {
      isIncluded = true;
    }
    if (isIncluded) included.push(emp);
    else excluded.push(emp);
  }

  return {
    includedEmployees: included,
    excludedEmployees: excluded,
    totalEligible: employees.length,
    includedCount: included.length,
  };
}

/**
 * Reactive hook that computes audience resolution for the schedule form dialog
 * and the audience detail viewer.
 */
export function useAudienceResolver(
  availableEmployees: AudienceEmployee[],
  dialogAudienceType: 'all' | 'departments' | 'specific',
  selectedDepartments: string[],
  selectedEmployees: string[],
  audienceViewSchedule: QuestionSchedule | null,
  audienceSearch: string,
) {
  const dialogAudienceSummary = useMemo(() => {
    const ta =
      dialogAudienceType === 'departments' && selectedDepartments.length > 0
        ? { all: false, departments: selectedDepartments }
        : dialogAudienceType === 'specific' && selectedEmployees.length > 0
          ? { all: false, specific_employees: selectedEmployees }
          : { all: true };
    return resolveAudience(ta as QuestionSchedule['target_audience'], availableEmployees);
  }, [dialogAudienceType, selectedDepartments, selectedEmployees, availableEmployees]);

  const audienceViewResult = useMemo(() => {
    if (!audienceViewSchedule) return null;
    return resolveAudience(audienceViewSchedule.target_audience, availableEmployees);
  }, [audienceViewSchedule, availableEmployees]);

  const filteredAudienceList = useMemo(() => {
    if (!audienceViewResult) return [];
    const all = [
      ...audienceViewResult.includedEmployees.map(e => ({ ...e, included: true })),
      ...audienceViewResult.excludedEmployees.map(e => ({ ...e, included: false })),
    ];
    if (!audienceSearch) return all;
    const q = audienceSearch.toLowerCase();
    return all.filter(
      e =>
        e.full_name.toLowerCase().includes(q) ||
        e.email.toLowerCase().includes(q) ||
        (e.department || '').toLowerCase().includes(q),
    );
  }, [audienceViewResult, audienceSearch]);

  return { dialogAudienceSummary, audienceViewResult, filteredAudienceList };
}
