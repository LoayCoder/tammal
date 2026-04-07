import { useState, useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { Activity, RefreshCw, Megaphone, ChevronRight, EyeOff, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { cardVariants } from "@/theme/tokens";
import { useTeamPulse } from "../hooks/useTeamPulse";
import { usePulseModes } from "../hooks/usePulseModes";
import { useAppreciations } from "../hooks/useAppreciations";
import { PulseModeSwitcher } from "./PulseModeSwitcher";
import { PulseInsightBlock } from "./PulseInsightBlock";
import { PulseTargetBlock } from "./PulseTargetBlock";
import { PulseActionPath } from "./PulseActionPath";
import { PulseEmptyState } from "./PulseEmptyState";
import { PulseSkeleton } from "./PulseSkeleton";
import { TeamHealthSummary } from "./TeamHealthSummary";
import { TeamMemberRiskGrid } from "./TeamMemberRiskGrid";
import { useTeamMemberPulse } from "../hooks/useTeamMemberPulse";
import { PulseNudgeCard } from "./PulseNudgeCard";
import { useCurrentEmployee } from "@/hooks/auth/useCurrentEmployee";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/hooks/org/useTenantId";
import { toast } from "sonner";

interface Props {
  employeeId: string;
}

const modeSubLabels: Record<string, string> = {
  personal: "pulse.modePersonal",
  team: "pulse.modeTeam",
  organization: "pulse.modeOrganization",
};

const HIDDEN_KEY = 'team-pulse-card-hidden';

export function TeamPulseCard({ employeeId }: Props) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const cardRef = useRef<HTMLDivElement>(null);
  const isAr = i18n.language === 'ar';
  const [isHidden, setIsHidden] = useState(() => localStorage.getItem(HIDDEN_KEY) === '1');
  const hide = useCallback(() => { localStorage.setItem(HIDDEN_KEY, '1'); setIsHidden(true); }, []);
  const show = useCallback(() => { localStorage.removeItem(HIDDEN_KEY); setIsHidden(false); }, []);
  const { employee } = useCurrentEmployee();
  const { tenantId } = useTenantId();
  const { allowedModes, selectedMode, setMode, showModeSwitcher } = usePulseModes(employeeId);
  const { pulse, insufficientData, isPending, error, refetch } = useTeamPulse(
    selectedMode,
    employeeId
  );
  const { sendAppreciation } = useAppreciations();
  const { data: teamMembers = [] } = useTeamMemberPulse(employeeId, selectedMode === "team");

  // Deep-link: ?focus=team-pulse&mode=team → switch mode, scroll into view, clean URL
  useEffect(() => {
    if (searchParams.get("focus") === "team-pulse") {
      const targetMode = searchParams.get("mode");
      if (targetMode === "team" || targetMode === "organization") {
        if (allowedModes.includes(targetMode)) {
          setMode(targetMode);
        }
      }
      // Un-hide if hidden
      if (isHidden) show();
      // Scroll into view after a short delay for render
      setTimeout(() => {
        cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 300);
      // Clean URL params
      const next = new URLSearchParams(searchParams);
      next.delete("focus");
      next.delete("mode");
      setSearchParams(next, { replace: true });
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: directReports = [] } = useQuery({
    queryKey: ["pulse-direct-report-ids", employeeId, tenantId],
    queryFn: async () => {
      const { data } = await supabase
        .from("employees")
        .select("id, full_name")
        .eq("tenant_id", tenantId!)
        .eq("manager_id", employeeId)
        .is("deleted_at", null)
        .eq("status", "active")
        .limit(200);
      return data ?? [];
    },
    enabled: !!employeeId && !!tenantId && selectedMode === "team",
    staleTime: 1000 * 60 * 10,
  });

  const handleTeamNudge = async () => {
    if (!employee || directReports.length === 0) return;
    try {
      const randomMember = directReports[Math.floor(Math.random() * directReports.length)];
      await sendAppreciation.mutateAsync({
        toEmployeeId: randomMember.id,
        message: t("pulse.teamNudgeMessage"),
        category: "teamwork",
      });
      toast.success(t("pulse.teamNudgeSent"));
    } catch {
      // Error handled by mutation
    }
  };

  if (error && !pulse && !insufficientData && !isPending) return null;

  if (isHidden) {
    return (
      <Card className={cn(cardVariants.premiumVip, "rounded-2xl opacity-80")}>
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-muted-foreground" strokeWidth={1.5} />
            <span className="text-xs text-muted-foreground">
              {t("pulse.title")} {isAr ? 'مخفي' : 'hidden'}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={show} className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
            {isAr ? 'إظهار' : 'Show'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn(cardVariants.premiumVip, "rounded-2xl overflow-hidden group")}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-chart-2/15 to-primary/10">
            <Activity className="h-4 w-4 text-chart-2" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{t("pulse.title")}</h3>
            <p className="text-[10px] text-muted-foreground">{t(modeSubLabels[selectedMode])}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={hide}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all duration-200 md:opacity-0 md:group-hover:opacity-100"
            title={isAr ? 'إخفاء' : 'Hide'}
          >
            <EyeOff className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
          <button
            onClick={() => navigate("/engagement-insights")}
            className="flex h-7 items-center gap-0.5 rounded-lg px-1.5 text-2xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all duration-200"
          >
            {t("engagementInsights.viewDetails")}
            <ChevronRight className="h-3 w-3 rtl:rotate-180" strokeWidth={2} />
          </button>
          <button
            onClick={() => refetch()}
            disabled={isPending}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all duration-200 disabled:opacity-40"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 scroll-smooth">
        {showModeSwitcher && (
          <PulseModeSwitcher
            allowedModes={allowedModes}
            selectedMode={selectedMode}
            onModeChange={setMode}
          />
        )}

        {isPending ? (
          <PulseSkeleton />
        ) : insufficientData ? (
          <PulseEmptyState fallbackCta={insufficientData.fallbackCta} />
        ) : pulse ? (
          <div className="space-y-0 transition-all duration-300">
            {/* Team Health Summary — team mode only */}
            {selectedMode === "team" && teamMembers.length > 0 && (
              <div className="mb-4">
                <TeamHealthSummary members={teamMembers} />
              </div>
            )}
            <div className="py-1">
              <PulseInsightBlock
                insight={pulse.primaryInsight}
                trend={pulse.trend}
                engagementScore={pulse.engagementScore}
                impactReason={pulse.impactReason}
              />
            </div>

            <PulseNudgeCard engagementScore={pulse.engagementScore} />

            <div className="border-t border-border/10 pt-4 mt-4">
              <PulseTargetBlock
                targetMetric={pulse.targetMetric}
                currentValue={pulse.currentValue}
                targetValue={pulse.targetValue}
              />
            </div>

            <div className="border-t border-border/10 pt-4 mt-4">
              <PulseActionPath
                recommendedAction={pulse.recommendedAction}
                actionPath={pulse.actionPath}
                actionCta={pulse.actionCta}
              />
            </div>

            {/* Manager Team Kudos Nudge */}
            {selectedMode === "team" && directReports.length > 0 && (
              <div className="border-t border-border/10 pt-4 mt-4">
                <button
                  onClick={handleTeamNudge}
                  disabled={sendAppreciation.isPending}
                  className={cn(
                    "flex w-full items-center justify-center gap-2 rounded-xl min-h-[44px] py-3 sm:py-2.5",
                    "bg-chart-3/10 text-chart-3 border border-chart-3/15",
                    "text-xs font-semibold hover:bg-chart-3/15 hover:-translate-y-0.5",
                    "active:scale-[0.97] transition-all duration-200 disabled:opacity-40"
                  )}
                >
                  <Megaphone className="h-3.5 w-3.5" strokeWidth={1.5} />
                  {t("pulse.teamKudgeNudge")}
                </button>
              </div>
            )}

            {/* Team Member Risk Grid — team mode only */}
            {selectedMode === "team" && teamMembers.length > 0 && (
              <div className="border-t border-border/10 pt-4 mt-4">
                <TeamMemberRiskGrid members={teamMembers} />
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
