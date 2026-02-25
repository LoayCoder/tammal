import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MatchFactors {
  specialization: number;
  language: number;
  load: number;
  responseTime: number;
  rating: number;
}

export interface MatchResult {
  first_aider_id: string;
  display_name: string;
  score: number;
  factors: MatchFactors;
  specializations: string[];
  languages: string[];
  rating: number | null;
  response_time_avg: number | null;
  active_cases: number;
  status: 'online' | 'offline';
}

export interface MatchResponse {
  matches: MatchResult[];
  assigned_id: string | null;
  case_id: string;
}

export function useSmartMatching() {
  const [matches, setMatches] = useState<MatchResult[]>([]);

  const matchMutation = useMutation({
    mutationFn: async (params: {
      case_id: string;
      tenant_id: string;
      preferred_language?: string;
      use_ai?: boolean;
    }): Promise<MatchResponse> => {
      const { data, error } = await supabase.functions.invoke('match-first-aider', {
        body: params,
      });
      if (error) throw error;
      return data as MatchResponse;
    },
    onSuccess: (data) => {
      setMatches(data.matches || []);
    },
  });

  return {
    matches,
    matchFirstAider: matchMutation.mutateAsync,
    isMatching: matchMutation.isPending,
    matchError: matchMutation.error,
    clearMatches: () => setMatches([]),
  };
}
