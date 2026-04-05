import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  insight: string;
  trend: "up" | "down" | "stable";
  engagementScore: number;
  impactReason?: string;
}

export function PulseInsightBlock({ insight, trend, engagementScore }: Props) {
  const { t } = useTranslation();

  const trendConfig = {
    up: { icon: TrendingUp, color: "text-chart-1", bg: "bg-chart-1/10", label: t("pulse.trendUp") },
    down: { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10", label: t("pulse.trendDown") },
    stable: { icon: Minus, color: "text-chart-4", bg: "bg-chart-4/10", label: t("pulse.trendStable") },
  };

  const { icon: TrendIcon, color, bg, label } = trendConfig[trend];

  const scoreColor =
    engagementScore >= 75 ? "text-chart-1" :
    engagementScore >= 50 ? "text-chart-2" :
    engagementScore >= 30 ? "text-chart-4" :
    "text-destructive";

  return (
    <div className="space-y-3">
      {/* Score + Trend */}
      <div className="flex items-center gap-3">
        <div className="flex items-baseline gap-1">
          <span className={cn("text-3xl font-bold tracking-tight", scoreColor)}>
            {engagementScore}
          </span>
          <span className="text-xs text-muted-foreground">/100</span>
        </div>
        <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5", bg)}>
          <TrendIcon className={cn("h-3 w-3", color)} strokeWidth={2} />
          <span className={cn("text-2xs font-medium", color)}>{label}</span>
        </div>
      </div>

      {/* Insight text */}
      <p className="text-sm text-foreground/90 leading-relaxed">{insight}</p>
    </div>
  );
}
