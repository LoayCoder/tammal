import { useTranslation } from "react-i18next";
import { Zap, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface Props {
  engagementScore: number;
}

export function PulseNudgeCard({ engagementScore }: Props) {
  const { t } = useTranslation();

  if (engagementScore >= 50) return null;

  const isLow = engagementScore < 30;

  return (
    <div
      className={cn(
        "rounded-xl p-3 space-y-2 border",
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
      <Link
        to="/employee/survey"
        className={cn(
          "flex items-center gap-1 text-2xs font-semibold transition-colors",
          isLow ? "text-destructive hover:text-destructive/80" : "text-chart-4 hover:text-chart-4/80"
        )}
      >
        {t("pulse.nudgeCta")}
        <ArrowRight className="h-3 w-3 rtl:rotate-180" strokeWidth={2} />
      </Link>
    </div>
  );
}
