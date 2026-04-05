import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles, RefreshCw, EyeOff, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import { cardVariants } from "@/theme/tokens";
import { useCopilotInsight } from "../hooks/useCopilotInsight";
import { useCopilotModes } from "../hooks/useCopilotModes";
import { CopilotModeSwitcher } from "./CopilotModeSwitcher";
import { CopilotInsightBlock } from "./CopilotInsightBlock";
import { CopilotActionBlock } from "./CopilotActionBlock";
import { CopilotReasoningBlock } from "./CopilotReasoningBlock";
import { CopilotEmptyState } from "./CopilotEmptyState";
import { CopilotSkeleton } from "./CopilotSkeleton";

interface Props {
  employeeId: string;
}

const HIDDEN_KEY = 'wellness-copilot-card-hidden';

const modeSubLabels: Record<string, string> = {
  personal: "copilot.modePersonal",
  team: "copilot.modeTeam",
  organization: "copilot.modeOrganization",
};

export function WellnessCopilotCard({ employeeId }: Props) {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const [isHidden, setIsHidden] = useState(() => localStorage.getItem(HIDDEN_KEY) === '1');
  const hide = useCallback(() => { localStorage.setItem(HIDDEN_KEY, '1'); setIsHidden(true); }, []);
  const show = useCallback(() => { localStorage.removeItem(HIDDEN_KEY); setIsHidden(false); }, []);
  const { allowedModes, selectedMode, setMode, showModeSwitcher } = useCopilotModes(employeeId);
  const { insight, insufficientData, isPending, error, refetch } = useCopilotInsight(
    selectedMode,
    employeeId
  );

  if (error && !insight && !insufficientData && !isPending) return null;

  if (isHidden) {
    return (
      <button
        onClick={show}
        className="flex w-full items-center gap-2 rounded-2xl border border-border/30 bg-card/50 px-4 min-h-[44px] py-3 text-xs text-muted-foreground hover:text-foreground hover:bg-card transition-all active:scale-[0.98]"
      >
        <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
        <span>{t("copilot.title")}</span>
      </button>
    );
  }

  return (
    <div className={cn(cardVariants.premiumVip, "rounded-2xl overflow-hidden group")}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 pb-0">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-chart-1/10">
            <Sparkles className="h-4 w-4 text-primary" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{t("copilot.title")}</h3>
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
            onClick={() => refetch()}
            disabled={isPending}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all duration-200 disabled:opacity-40"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", isPending && "animate-spin")} strokeWidth={1.5} />
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Mode Switcher */}
        {showModeSwitcher && (
          <CopilotModeSwitcher
            allowedModes={allowedModes}
            selectedMode={selectedMode}
            onModeChange={setMode}
          />
        )}

        {/* Content */}
        {isPending ? (
          <CopilotSkeleton />
        ) : insufficientData ? (
          <CopilotEmptyState fallbackCta={insufficientData.fallbackCta} />
        ) : insight ? (
          <div className="space-y-4">
            <CopilotInsightBlock
              insight={insight.primaryInsight}
              urgencyLevel={insight.urgencyLevel}
              secondaryInsight={insight.secondaryInsight}
            />
            <CopilotActionBlock action={insight.recommendedAction} actionCta={insight.actionCta} />
            <CopilotReasoningBlock reasoning={insight.reasoning} basisStatement={insight.basisStatement} />
          </div>
        ) : null}
      </div>
    </div>
  );
}