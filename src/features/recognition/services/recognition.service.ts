import { supabase } from '@/integrations/supabase/client';
import type { CriterionEvaluation } from '../components/CriteriaEvaluationForm';

export async function fetchEmployeeNames(userIds: string[]): Promise<Record<string, string>> {
  if (!userIds.length) return {};
  const { data, error } = await supabase
    .from('employees')
    .select('user_id, full_name')
    .in('user_id', userIds)
    .is('deleted_at', null);

  if (error) throw error;

  const map: Record<string, string> = {};
  data?.forEach(e => {
    if (e.user_id) map[e.user_id] = e.full_name;
  });
  return map;
}

export async function fetchNominationCriteriaEvaluations(nominationIds: string[]): Promise<Record<string, CriterionEvaluation[]>> {
  if (!nominationIds.length) return {};
  const { data, error } = await supabase
    .from('nomination_criteria_evaluations')
    .select('*, judging_criteria:criterion_id(name, name_ar, description)')
    .in('nomination_id', nominationIds)
    .is('deleted_at', null);

  if (error) throw error;

  const map: Record<string, CriterionEvaluation[]> = {};
  data?.forEach((row: any) => {
    if (!map[row.nomination_id]) map[row.nomination_id] = [];
    map[row.nomination_id].push({
      criterion_id: row.criterion_id,
      name: row.judging_criteria?.name || '',
      name_ar: row.judging_criteria?.name_ar || null,
      description: row.judging_criteria?.description || null,
      weight: Number(row.weight),
      justification: row.justification || '',
    });
  });
  return map;
}

export async function fetchUserCycleNominations(cycleId: string, userId: string) {
  const { data, error } = await supabase
    .from('nominations')
    .select('nominee_id')
    .eq('cycle_id', cycleId)
    .eq('nominator_id', userId)
    .is('deleted_at', null);
  if (error) throw error;
  return data || [];
}

export async function fetchCycleConfig(cycleId: string) {
  const { data, error } = await supabase
    .from('award_cycles')
    .select('fairness_config')
    .eq('id', cycleId)
    .is('deleted_at', null)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchNomineeNamesForNominations(nominationIds: string[]): Promise<Record<string, string>> {
  if (!nominationIds.length) return {};
  const { data: noms, error: nomsError } = await supabase
    .from('nominations')
    .select('id, nominee_id')
    .in('id', nominationIds);
  if (nomsError) throw nomsError;
  if (!noms?.length) return {};

  const userIds = [...new Set(noms.map(n => n.nominee_id))];
  const { data: emps, error: empsError } = await supabase
    .from('employees')
    .select('user_id, full_name')
    .in('user_id', userIds);
  if (empsError) throw empsError;

  const nameMap = new Map(emps?.map(e => [e.user_id, e.full_name]) || []);
  const result: Record<string, string> = {};
  noms.forEach(n => { result[n.id] = nameMap.get(n.nominee_id) || 'Unknown'; });
  return result;
}

export async function fetchAwardThemeName(themeId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('award_themes')
    .select('name')
    .eq('id', themeId)
    .is('deleted_at', null)
    .single();
  if (error) throw error;
  return data?.name || null;
}

export async function fetchExistingEndorsers(nominationId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('endorsement_requests')
    .select('requested_user_id')
    .eq('nomination_id', nominationId)
    .is('deleted_at', null);
  if (error) throw error;
  return (data || []).map((r: any) => r.requested_user_id);
}
