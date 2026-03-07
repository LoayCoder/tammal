import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useTenantId } from '@/hooks/org/useTenantId';

export interface StagedWeight {
  criterion_name: string;
  criterion_name_ar?: string | null;
  original: number;
  nomination?: number;
  manager?: number;
  votingAvg?: number;
}

export interface NomineeFairness {
  nominationId: string;
  nomineeName: string;
  stages: StagedWeight[];
}

export interface ThemeFairness {
  themeId: string;
  themeName: string;
  themeNameAr?: string | null;
  nominees: NomineeFairness[];
}

export function useFairnessSummary(cycleId: string) {
  const { tenantId } = useTenantId();

  // 1. Themes for this cycle
  const { data: themes = [] } = useQuery({
    queryKey: ['fairness-themes', cycleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('award_themes')
        .select('id, name, name_ar')
        .eq('cycle_id', cycleId)
        .is('deleted_at', null);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!cycleId,
  });

  const themeIds = themes.map(t => t.id);

  // 2. Judging criteria (original weights)
  const { data: criteria = [] } = useQuery({
    queryKey: ['fairness-criteria', themeIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('judging_criteria')
        .select('id, theme_id, name, name_ar, weight')
        .in('theme_id', themeIds)
        .is('deleted_at', null);
      if (error) throw error;
      return data ?? [];
    },
    enabled: themeIds.length > 0,
  });

  // 3. Nominations for this cycle (with manager_criteria_adjustments)
  const { data: nominations = [] } = useQuery({
    queryKey: ['fairness-nominations', cycleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nominations')
        .select('id, nominee_id, theme_id, manager_criteria_adjustments')
        .eq('cycle_id', cycleId)
        .is('deleted_at', null);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!cycleId,
  });

  const nominationIds = nominations.map(n => n.id);

  // 4. Employees for name lookup
  const { data: employees = [] } = useQuery({
    queryKey: ['fairness-employees', tenantId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('user_id, full_name')
        .is('deleted_at', null);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!tenantId,
  });

  // 5. Nomination criteria evaluations
  const { data: nomEvals = [] } = useQuery({
    queryKey: ['fairness-nom-evals', nominationIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nomination_criteria_evaluations')
        .select('nomination_id, criterion_id, weight')
        .in('nomination_id', nominationIds)
        .is('deleted_at', null);
      if (error) throw error;
      return data ?? [];
    },
    enabled: nominationIds.length > 0,
  });

  // 6. Votes for this cycle (to join vote_criteria_evaluations)
  const { data: votes = [] } = useQuery({
    queryKey: ['fairness-votes', cycleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('votes')
        .select('id, nomination_id')
        .eq('cycle_id', cycleId)
        .is('deleted_at', null);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!cycleId,
  });

  const voteIds = votes.map(v => v.id);

  // 7. Vote criteria evaluations
  const { data: voteEvals = [] } = useQuery({
    queryKey: ['fairness-vote-evals', voteIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vote_criteria_evaluations')
        .select('vote_id, criterion_id, adjusted_weight')
        .in('vote_id', voteIds)
        .is('deleted_at', null);
      if (error) throw error;
      return data ?? [];
    },
    enabled: voteIds.length > 0,
  });

  // ── Build lookup maps ──
  const empMap = new Map(employees.map(e => [e.user_id, e.full_name]));

  // Vote → nomination mapping
  const voteToNom = new Map(votes.map(v => [v.id, v.nomination_id]));

  // Nomination eval: nomination_id → criterion_id → weight
  const nomEvalMap = new Map<string, Map<string, number>>();
  for (const ne of nomEvals) {
    if (!nomEvalMap.has(ne.nomination_id)) nomEvalMap.set(ne.nomination_id, new Map());
    nomEvalMap.get(ne.nomination_id)!.set(ne.criterion_id, ne.weight);
  }

  // Vote eval avg: nomination_id → criterion_id → weights[]
  const voteAvgAccum = new Map<string, Map<string, number[]>>();
  for (const ve of voteEvals) {
    const nomId = voteToNom.get(ve.vote_id);
    if (!nomId) continue;
    if (!voteAvgAccum.has(nomId)) voteAvgAccum.set(nomId, new Map());
    const cMap = voteAvgAccum.get(nomId)!;
    if (!cMap.has(ve.criterion_id)) cMap.set(ve.criterion_id, []);
    cMap.get(ve.criterion_id)!.push(ve.adjusted_weight);
  }

  // Manager adjustments: nomination_id → criterion_id → weight
  const mgrMap = new Map<string, Map<string, number>>();
  for (const n of nominations) {
    const adj = n.manager_criteria_adjustments as Record<string, number> | null;
    if (adj && typeof adj === 'object') {
      const m = new Map<string, number>();
      for (const [cId, w] of Object.entries(adj)) {
        m.set(cId, Number(w));
      }
      mgrMap.set(n.id, m);
    }
  }

  // Criteria by theme
  const criteriaByTheme = new Map<string, typeof criteria>();
  for (const c of criteria) {
    if (!criteriaByTheme.has(c.theme_id)) criteriaByTheme.set(c.theme_id, []);
    criteriaByTheme.get(c.theme_id)!.push(c);
  }

  // ── Assemble ThemeFairness[] ──
  const themeFairness: ThemeFairness[] = themes.map(theme => {
    const themeCriteria = criteriaByTheme.get(theme.id) ?? [];
    const themeNoms = nominations.filter(n => n.theme_id === theme.id);

    const nominees: NomineeFairness[] = themeNoms.map(nom => {
      const stages: StagedWeight[] = themeCriteria.map(c => {
        const nomWeight = nomEvalMap.get(nom.id)?.get(c.id);
        const mgrWeight = mgrMap.get(nom.id)?.get(c.id);
        const voteWeights = voteAvgAccum.get(nom.id)?.get(c.id);
        const votingAvg = voteWeights && voteWeights.length > 0
          ? Math.round(voteWeights.reduce((a, b) => a + b, 0) / voteWeights.length)
          : undefined;

        return {
          criterion_name: c.name,
          criterion_name_ar: c.name_ar,
          original: c.weight,
          nomination: nomWeight,
          manager: mgrWeight,
          votingAvg,
        };
      });

      return {
        nominationId: nom.id,
        nomineeName: empMap.get(nom.nominee_id) ?? 'Unknown',
        stages,
      };
    });

    return {
      themeId: theme.id,
      themeName: theme.name,
      themeNameAr: theme.name_ar,
      nominees,
    };
  });

  const isPending = !themes.length && !!cycleId;

  return { themeFairness, isPending };
}
