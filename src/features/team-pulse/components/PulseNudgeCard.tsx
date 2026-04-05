import { useTranslation } from "react-i18next";
import { Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useEngagementActionLog } from "../hooks/useEngagementActionLog";

interface Props {
  engagementScore: number;
}

export function PulseNudgeCard({ engagementScore }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logAction } = useEngagementActionLog();

  if (engagementScore >= 50) return null;

  const isLow = engagementScore < 30;

  return (
    <div
      className={cn(
        "rounded-xl p-3 space-y-2 border animate-fade-in",
        isLow
          ? "bg-destructive/[0.04] border-destructive/10"
          : "bg-chart-4/[0.04] border-chart-4/10"
      )}
    >
      <div className="flex items-center gap-2">
        <Zap
          className={cn("h-3.5 w-3.5", isLow ? "text-destructive" : "text-chart-4")}
          strokeWidth={1.5}
        />
        <span className={cn("text-xs font-semibold", isLow ? "text-destructive" : "text-chart-4")}>
          {t(isLow ? "pulse.nudgeLowTitle" : "pulse.nudgeMedTitle")}
        </span>
      </div>
      <p className="text-2xs text-foreground/70">
        {t(isLow ? "pulse.nudgeLowDesc" : "pulse.nudgeMedDesc")}
      </p>
      <button
        onClick={() => {
          logAction.mutate({ actionType: "nudge_acted", source: "nudge_card", metadata: { score: engagementScore } });
          navigate("/employee/survey");
        }}
        className={cn(
          "flex w-full items-center justify-center gap-1.5 rounded-lg min-h-[44px] py-2.5 sm:py-2 text-2xs font-semibold transition-all duration-200 active:scale-[0.97]",
          isLow
            ? "bg-destructive/10 text-destructive hover:bg-destructive/15"
            : "bg-chart-4/10 text-chart-4 hover:bg-chart-4/15"
        )}
      >
        {t("pulse.nudgeCta")}
        <ArrowRight className="h-3 w-3 rtl:rotate-180" strokeWidth={2} />
      </button>
    </div>
  );
}
