import { memo } from "react";
import { useTranslation } from "react-i18next";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { typography } from "@/theme/tokens";

interface Props {
  targetMetric: string;
  currentValue: number;
  targetValue: number;
}

export function PulseTargetBlock({ targetMetric, currentValue, targetValue }: Props) {
  const { t } = useTranslation();
  const progress = targetValue > 0 ? Math.min(Math.round((currentValue / targetValue) * 100), 100) : 0;

  const progressColor =
    progress >= 75 ? "bg-chart-1" :
    progress >= 50 ? "bg-chart-2" :
    progress >= 25 ? "bg-chart-4" :
    "bg-destructive";

  return (
    <div className="rounded-xl premium-badge p-3 space-y-2 animate-fade-in">
      <div className="flex items-center gap-2">
        <Target className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
        <span className={typography.statLabel}>
          {t("pulse.targetLabel")}
        </span>
      </div>

      <p className="text-xs text-foreground/80">{targetMetric}</p>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted/15 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700 ease-out", progressColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-2xs font-semibold text-foreground">
            {currentValue}/{targetValue}
          </span>
          <span className={cn(
            "text-2xs font-bold rounded-full px-1.5 py-0.5",
            progress >= 75 ? "bg-chart-1/10 text-chart-1" :
            progress >= 50 ? "bg-chart-2/10 text-chart-2" :
            progress >= 25 ? "bg-chart-4/10 text-chart-4" :
            "bg-destructive/10 text-destructive"
          )}>
            {progress}%
          </span>
        </div>
      </div>
    </div>
  );
}
