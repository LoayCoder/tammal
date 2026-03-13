import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface CriterionEvaluationInput {
  tenant_id: string;
  nomination_id: string;
  criterion_id: string;
  weight: number;
  justification: string | null;
}

export function useNominationCriteria() {
  const saveCriteriaEvaluations = useMutation({
    mutationFn: async (rows: CriterionEvaluationInput[]) => {
      const { error } = await supabase
        .from('nomination_criteria_evaluations')
        .insert(rows);
      if (error) throw error;
    },
  });

  return { saveCriteriaEvaluations };
}
