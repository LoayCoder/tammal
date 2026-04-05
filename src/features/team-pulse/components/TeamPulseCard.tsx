import { useTranslation } from "react-i18next";
import { Activity, RefreshCw, Megaphone } from "lucide-react";
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
import { PulseNudgeCard } from "./PulseNudgeCard";
import { useCurrentEmployee } from "@/hooks/auth/useCurrentEmployee";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  employeeId: string;
}

const modeSubLabels: Record<string, string> = {
  personal: "pulse.modePersonal",
  team: "pulse.modeTeam",
  organization: "pulse.modeOrganization",
};

export function TeamPulseCard({ employeeId }: Props) {
  const { t } = useTranslation();
  const { employee } = useCurrentEmployee();
  const { allowedModes, selectedMode, setMode, showModeSwitcher } = usePulseModes(employeeId);
  const { pulse, insufficientData, isPending, error, refetch } = useTeamPulse(
    selectedMode,
    employeeId
  );
  const { sendAppreciation } = useAppreciations();

  const { data: directReports = [] } = useQuery({
    queryKey: ["pulse-direct-report-ids", employeeId],
    queryFn: async () => {
      const { data } = await supabase
        .from("employees")
        .select("id, full_name")
        .eq("manager_id", employeeId)
        .is("deleted_at", null)
        .eq("status", "active")
        .limit(200);
      return data ?? [];
    },
    enabled: !!employeeId && selectedMode === "team",
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

  return (
    <div className={cn(cardVariants.premiumVip, "rounded-2xl overflow-hidden")}>
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
        <button
          onClick={() => refetch()}
          disabled={isPending}
          className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all duration-200 disabled:opacity-40"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} strokeWidth={1.5} />
        </button>
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
          </div>
        ) : null}
      </div>
    </div>
  );
}
