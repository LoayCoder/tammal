import { useQuery } from '@tanstack/react-query';
import * as RecognitionService from '../services/recognition.service';

export function useEmployeeNames(userIds: string[]) {
  return useQuery({
    queryKey: ['employee-names', userIds],
    queryFn: () => RecognitionService.fetchEmployeeNames(userIds),
    enabled: userIds.length > 0,
  });
}

export function useNominationCriteriaEvaluations(nominationIds: string[]) {
  return useQuery({
    queryKey: ['nomination-criteria-evals', nominationIds],
    queryFn: () => RecognitionService.fetchNominationCriteriaEvaluations(nominationIds),
    enabled: nominationIds.length > 0,
  });
}

export function useUserCycleNominations(cycleId: string, userId?: string) {
  return useQuery({
    queryKey: ['user-cycle-nominations', cycleId, userId],
    queryFn: () => RecognitionService.fetchUserCycleNominations(cycleId, userId!),
    enabled: !!cycleId && !!userId,
  });
}

export function useCycleConfig(cycleId: string) {
  return useQuery({
    queryKey: ['cycle-config', cycleId],
    queryFn: () => RecognitionService.fetchCycleConfig(cycleId),
    enabled: !!cycleId,
  });
}

export function useNomineeNames(nominationIds: string[]) {
  return useQuery({
    queryKey: ['nominee-names', nominationIds],
    queryFn: () => RecognitionService.fetchNomineeNamesForNominations(nominationIds),
    enabled: nominationIds.length > 0,
  });
}

export function useAwardThemeName(themeId?: string) {
  return useQuery({
    queryKey: ['award-theme-name', themeId],
    queryFn: () => RecognitionService.fetchAwardThemeName(themeId!),
    enabled: !!themeId,
  });
}

export function useExistingEndorsers(nominationId: string) {
  return useQuery({
    queryKey: ['existing-endorsers', nominationId],
    queryFn: () => RecognitionService.fetchExistingEndorsers(nominationId),
    enabled: !!nominationId,
  });
}
