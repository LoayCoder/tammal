import { useState, useCallback, memo } from "react";
import { useTranslation } from "react-i18next";
import { Zap, ArrowRight, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useEngagementActionLog } from "../hooks/useEngagementActionLog";
import { useCurrentEmployee } from "@/hooks/auth/useCurrentEmployee";

interface Props {
  engagementScore: number;
}

function getStorageKey(employeeId: string) {
  return `nudge-dismissed-${employeeId}`;
}

export const PulseNudgeCard = memo(function PulseNudgeCard({ engagementScore }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logAction } = useEngagementActionLog();
  const { employee } = useCurrentEmployee();
  const employeeId = employee?.id ?? "";

  const [dismissed, setDismissed] = useState(() => {
    if (!employeeId) return false;
    try {
      return sessionStorage.getItem(getStorageKey(employeeId)) === "1";
    } catch {
      return false;
    }
  });

  const handleDismiss = useCallback(() => {
    logAction.mutate({ actionType: "nudge_dismissed", source: "nudge_card", metadata: { score: engagementScore } });
    setDismissed(true);
    if (employeeId) {
      try { sessionStorage.setItem(getStorageKey(employeeId), "1"); } catch { /* noop */ }
    }
  }, [logAction, engagementScore, employeeId]);

  const handleAct = useCallback(() => {
    logAction.mutate({ actionType: "nudge_acted", source: "nudge_card", metadata: { score: engagementScore } });
    navigate("/employee/survey");
  }, [logAction, engagementScore, navigate]);

  if (engagementScore >= 50 || dismissed) return null;

  const isLow = engagementScore < 30;

  return (
    <div
      className={cn(
        "relative rounded-xl p-3 space-y-2 border animate-fade-in",
        isLow
          ? "bg-destructive/[0.04] border-destructive/10"
          : "bg-chart-4/[0.04] border-chart-4/10"
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 end-2 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all duration-200 active:scale-[0.95]"
        aria-label="Dismiss"
      >
        <X className="h-3 w-3" strokeWidth={2} />
      </button>

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
        onClick={handleAct}
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
});
