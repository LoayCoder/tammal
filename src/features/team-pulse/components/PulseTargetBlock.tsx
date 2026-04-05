import { useTranslation } from "react-i18next";
import { Target } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="rounded-xl bg-muted/5 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <Target className="h-3.5 w-3.5 text-primary" strokeWidth={1.5} />
        <span className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("pulse.targetLabel")}
        </span>
      </div>

      <p className="text-xs text-foreground/80">{targetMetric}</p>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-muted/15 overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-500", progressColor)}
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-2xs font-semibold text-foreground">
          {currentValue}/{targetValue}
        </span>
      </div>
    </div>
  );
}
