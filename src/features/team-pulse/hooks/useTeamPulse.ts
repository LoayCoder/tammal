import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

export type PulseMode = "personal" | "team" | "organization";

export interface PulseInsight {
  engagementScore: number;
  trend: "up" | "down" | "stable";
  primaryInsight: string;
  recommendedAction: string;
  targetMetric: string;
  targetValue: number;
  currentValue: number;
  actionPath: string;
  actionCta: string;
  insufficientData: false;
  mode: PulseMode;
  generatedAt: string;
}

export interface PulseInsufficientData {
  insufficientData: true;
  fallbackCta: string;
}

export type PulseResponse = PulseInsight | PulseInsufficientData;

export function useTeamPulse(
  mode: PulseMode,
  employeeId: string | null | undefined,
  enabled = true
) {
  const { i18n } = useTranslation();

  const query = useQuery<PulseResponse>({
    queryKey: ["team-pulse", mode, employeeId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("team-pulse-engine", {
        body: { mode, language: i18n.language },
      });
      if (error) throw error;
      return data as PulseResponse;
    },
    enabled: !!employeeId && enabled,
    staleTime: 1000 * 60 * 30,
    retry: 1,
  });

  const isInsufficientData = query.data?.insufficientData === true;

  return {
    pulse: isInsufficientData ? null : (query.data as PulseInsight | undefined),
    insufficientData: isInsufficientData ? (query.data as PulseInsufficientData) : null,
    isPending: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
