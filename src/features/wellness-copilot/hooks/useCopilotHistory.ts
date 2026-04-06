import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";

export interface CopilotHistoryEntry {
  id: string;
  mode: string;
  urgency_level: string;
  primary_insight: string;
  secondary_insight: string | null;
  recommended_action: string | null;
  reasoning: string | null;
  basis_statement: string | null;
  action_cta: string | null;
  recommendations: any;
  insight_date: string;
  created_at: string;
}

export function useCopilotHistory(limit = 30) {
  const { user } = useAuth();

  return useQuery<CopilotHistoryEntry[]>({
    queryKey: ["copilot-history", user?.id, limit],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("copilot_insight_history" as any)
        .select("*")
        .eq("user_id", user.id)
        .is("deleted_at", null)
        .order("insight_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as unknown as CopilotHistoryEntry[];
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5,
  });
}
