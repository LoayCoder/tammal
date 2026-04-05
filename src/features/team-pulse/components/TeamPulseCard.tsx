import { useTranslation } from "react-i18next";
import { Activity, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { cardVariants } from "@/theme/tokens";
import { useTeamPulse } from "../hooks/useTeamPulse";
import { usePulseModes } from "../hooks/usePulseModes";
import { PulseModeSwitcher } from "./PulseModeSwitcher";
import { PulseInsightBlock } from "./PulseInsightBlock";
import { PulseTargetBlock } from "./PulseTargetBlock";
import { PulseActionPath } from "./PulseActionPath";
import { PulseEmptyState } from "./PulseEmptyState";
import { PulseSkeleton } from "./PulseSkeleton";

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
  const { allowedModes, selectedMode, setMode, showModeSwitcher } = usePulseModes(employeeId);
  const { pulse, insufficientData, isPending, error, refetch } = useTeamPulse(
    selectedMode,
    employeeId
  );

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

      <div className="p-4 space-y-4">
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
          <div className="space-y-4">
            <PulseInsightBlock
              insight={pulse.primaryInsight}
              trend={pulse.trend}
              engagementScore={pulse.engagementScore}
            />
            <PulseTargetBlock
              targetMetric={pulse.targetMetric}
              currentValue={pulse.currentValue}
              targetValue={pulse.targetValue}
            />
            <PulseActionPath
              recommendedAction={pulse.recommendedAction}
              actionPath={pulse.actionPath}
              actionCta={pulse.actionCta}
            />
          </div>
        ) : null}
      </div>
    </div>
  );
}
