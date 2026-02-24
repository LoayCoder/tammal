import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AIModel {
  id: string;
  model_key: string;
  display_name: string;
  accuracy_tier: string;
  cost_tier: string;
  is_active: boolean;
}

export function useAIModels() {
  const modelsQuery = useQuery({
    queryKey: ['ai-models'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_models')
        .select('*')
        .eq('is_active', true)
        .order('display_name');

      if (error) throw error;
      return data as AIModel[];
    },
  });

  return {
    models: modelsQuery.data ?? [],
    isLoading: modelsQuery.isLoading,
  };
}
