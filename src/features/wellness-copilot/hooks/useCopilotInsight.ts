import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTranslation } from "react-i18next";

const LEGACY_RECOMMENDATION_ROUTE_MAP: Record<string, string> = {
  "/team-pulse": "/engagement-insights",
  "/admin/wellness-analytics": "/engagement-insights",
  "/admin/workload": "/admin/workload/dashboard",
};

const TEAM_CHECKIN_DEEP_LINK = "/dashboard?focus=team-pulse&mode=team";

export type CopilotMode = "personal" | "team" | "organization";
export type UrgencyLevel = "opportunity" | "neutral" | "attention" | "urgent";
export type ActionCta =
  | "complete_checkin"
  | "review_workload"
  | "view_team"
  | "launch_survey"
  | "view_insights"
  | "take_break"
  | "review_tasks";

export interface CopilotRecommendation {
  type: 'practice' | 'resource' | 'support';
  key: string;
  title: string;
  description: string;
  route: string;
}

export interface CopilotInsight {
  primaryInsight: string;
  recommendedAction: string;
  reasoning: string;
  basisStatement: string;
  urgencyLevel: UrgencyLevel;
  secondaryInsight?: string;
  actionCta: ActionCta;
  insufficientData: false;
  mode: CopilotMode;
  generatedAt: string;
  recommendations?: CopilotRecommendation[];
}

export interface CopilotInsufficientData {
  insufficientData: true;
  fallbackCta: string;
  error?: string;
}

export type CopilotResponse = CopilotInsight | CopilotInsufficientData;

function isCopilotInsight(data: CopilotResponse): data is CopilotInsight {
  return data.insufficientData === false;
}

function normalizeRecommendationRoute(
  recommendation: CopilotRecommendation,
  mode: CopilotMode
) {
  if (
    mode === "team" &&
    recommendation.key === "launch_survey" &&
    ["/admin/surveys", "/admin/questions"].includes(recommendation.route)
  ) {
    return "/engagement-insights";
  }

  if (mode === "organization" && recommendation.route === "/admin/surveys") {
    return "/admin/questions";
  }

  return LEGACY_RECOMMENDATION_ROUTE_MAP[recommendation.route] ?? recommendation.route;
}

function normalizeCopilotResponse(data: CopilotResponse): CopilotResponse {
  if (!isCopilotInsight(data) || !data.recommendations?.length) return data;

  return {
    ...data,
    recommendations: data.recommendations.map((recommendation) => ({
      ...recommendation,
      route: normalizeRecommendationRoute(recommendation, data.mode),
    })),
  };
}

export function useCopilotInsight(
  mode: CopilotMode,
  employeeId: string | null | undefined,
  enabled = true
) {
  const { i18n } = useTranslation();

  const query = useQuery<CopilotResponse>({
    queryKey: ["copilot-insight", "route-fix-v2", mode, employeeId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("wellness-copilot", {
        body: { mode, language: i18n.language },
      });
      if (error) throw error;
      return normalizeCopilotResponse(data as CopilotResponse);
    },
    enabled: !!employeeId && enabled,
    staleTime: 1000 * 60 * 30, // 30 minutes
    retry: 1,
  });

  const isInsufficientData = query.data?.insufficientData === true;

  return {
    insight: isInsufficientData ? null : (query.data as CopilotInsight | undefined),
    insufficientData: isInsufficientData ? (query.data as CopilotInsufficientData) : null,
    isPending: query.isPending,
    error: query.error,
    refetch: query.refetch,
  };
}
