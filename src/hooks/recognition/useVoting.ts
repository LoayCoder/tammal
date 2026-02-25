import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { useTenantId } from '@/hooks/org/useTenantId';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export interface Vote {
  id: string;
  tenant_id: string;
  cycle_id: string;
  theme_id: string;
  nomination_id: string;
  voter_id: string;
  criteria_scores: Record<string, number>;
  calculated_weighted_score: number | null;
  applied_weight: number | null;
  justifications: Record<string, string> | null;
  confidence_level: string | null;
  voted_at: string;
}

export interface Ballot {
  nomination_id: string;
  theme_id: string;
  cycle_id: string;
  nominee_name: string;
  theme_name: string;
  headline: string;
  justification: string;
  criteria: {
    id: string;
    name: string;
    name_ar: string | null;
    description: string | null;
    weight: number;
    scoring_guide: Record<string, any>;
  }[];
  already_voted: boolean;
}

interface SubmitVoteInput {
  nomination_id: string;
  theme_id: string;
  cycle_id: string;
  criteria_scores: Record<string, number>;
  justifications: Record<string, string>;
  confidence_level: 'high' | 'medium' | 'low';
}

function calculateVoterWeight(params: {
  isSameDepartment: boolean;
  isManager: boolean;
  totalPastVotes: number;
}): number {
  let weight = 1.0;
  if (params.isManager) weight += 0.3;
  if (params.isSameDepartment) weight += 0.2;
  weight += Math.min(params.totalPastVotes * 0.02, 0.2);
  return Math.round(weight * 100) / 100;
}

export function useVoting(cycleId?: string) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { tenantId } = useTenantId();
  const qc = useQueryClient();

  const { data: ballots = [], isLoading: ballotsLoading } = useQuery({
    queryKey: ['voting-ballots', tenantId, cycleId],
    queryFn: async () => {
      if (!cycleId) return [];

      const { data: themes } = await supabase
        .from('award_themes')
        .select('id, name, name_ar')
        .eq('cycle_id', cycleId)
        .is('deleted_at', null);

      if (!themes?.length) return [];
      const themeIds = themes.map(th => th.id);

      const { data: nominations } = await supabase
        .from('nominations')
        .select('id, nominee_id, theme_id, headline, justification, cycle_id')
        .in('theme_id', themeIds)
        .in('status', ['endorsed', 'shortlisted'])
        .is('deleted_at', null);

      if (!nominations?.length) return [];

      const { data: criteria } = await supabase
        .from('judging_criteria')
        .select('*')
        .in('theme_id', themeIds)
        .is('deleted_at', null)
        .order('sort_order');

      const { data: existingVotes } = await supabase
        .from('votes')
        .select('nomination_id')
        .eq('voter_id', user!.id)
        .in('nomination_id', nominations.map(n => n.id));

      const votedSet = new Set(existingVotes?.map(v => v.nomination_id) || []);

      const nomineeIds = [...new Set(nominations.map(n => n.nominee_id))];
      const { data: employees } = await supabase
        .from('employees')
        .select('user_id, full_name')
        .in('user_id', nomineeIds);

      const nameMap = new Map(employees?.map(e => [e.user_id, e.full_name]) || []);
      const themeMap = new Map(themes.map(th => [th.id, th]));

      return nominations.map(nom => ({
        nomination_id: nom.id,
        theme_id: nom.theme_id,
        cycle_id: nom.cycle_id,
        nominee_name: nameMap.get(nom.nominee_id) || 'Unknown',
        theme_name: themeMap.get(nom.theme_id)?.name || '',
        headline: nom.headline || '',
        justification: nom.justification,
        criteria: (criteria || [])
          .filter(c => c.theme_id === nom.theme_id)
          .map(c => ({
            id: c.id,
            name: c.name,
            name_ar: c.name_ar,
            description: c.description,
            weight: c.weight,
            scoring_guide: c.scoring_guide as Record<string, any>,
          })),
        already_voted: votedSet.has(nom.id),
      })) as Ballot[];
    },
    enabled: !!tenantId && !!cycleId && !!user?.id,
  });

  const { data: myVotes = [], isLoading: votesLoading } = useQuery({
    queryKey: ['my-votes', tenantId, cycleId],
    queryFn: async () => {
      if (!cycleId) return [];
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('voter_id', user!.id)
        .eq('cycle_id', cycleId);
      if (error) throw error;
      return (data || []) as unknown as Vote[];
    },
    enabled: !!tenantId && !!cycleId && !!user?.id,
  });

  const submitVote = useMutation({
    mutationFn: async (input: SubmitVoteInput) => {
      if (!tenantId || !user?.id) throw new Error('Missing context');

      // Validate extreme scores have justification
      for (const [criterionId, score] of Object.entries(input.criteria_scores)) {
        if ((score === 1 || score === 5) && (!input.justifications[criterionId] || input.justifications[criterionId].length < 50)) {
          throw new Error(t('recognition.voting.extremeScoreJustification'));
        }
      }

      // Calculate weighted total
      const criterionIds = Object.keys(input.criteria_scores);
      const { data: criteria } = await supabase
        .from('judging_criteria')
        .select('id, weight')
        .in('id', criterionIds);

      const totalWeight = criteria?.reduce((sum, c) => sum + c.weight, 0) || 100;
      const weightedTotal = criteria?.reduce((sum, c) => {
        const score = input.criteria_scores[c.id] || 0;
        return sum + (score * c.weight / totalWeight);
      }, 0) || 0;

      const { count: pastVotes } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true })
        .eq('voter_id', user.id);

      const voterWeight = calculateVoterWeight({
        isSameDepartment: false,
        isManager: false,
        totalPastVotes: pastVotes || 0,
      });

      const { data, error } = await supabase
        .from('votes')
        .insert({
          tenant_id: tenantId,
          cycle_id: input.cycle_id,
          theme_id: input.theme_id,
          nomination_id: input.nomination_id,
          voter_id: user.id,
          criteria_scores: input.criteria_scores,
          calculated_weighted_score: Math.round(weightedTotal * 100) / 100,
          applied_weight: voterWeight,
          justifications: input.justifications,
          confidence_level: input.confidence_level,
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['voting-ballots'] });
      qc.invalidateQueries({ queryKey: ['my-votes'] });
      toast.success(t('recognition.voting.submitSuccess'));
    },
    onError: (e: Error) => toast.error(e.message || t('recognition.voting.submitError')),
  });

  const pendingBallots = ballots.filter(b => !b.already_voted);
  const completedCount = ballots.filter(b => b.already_voted).length;

  return {
    ballots,
    pendingBallots,
    completedCount,
    totalCount: ballots.length,
    myVotes,
    ballotsLoading,
    votesLoading,
    submitVote,
  };
}
