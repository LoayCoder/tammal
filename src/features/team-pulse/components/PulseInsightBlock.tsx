import { useTranslation } from "react-i18next";
import { TrendingUp, TrendingDown, Minus, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { typography } from "@/theme/tokens";
import { useIsMobile } from "@/hooks/ui/use-mobile";

interface Props {
  insight: string;
  trend: "up" | "down" | "stable";
  engagementScore: number;
  impactReason?: string;
}

function ScoreGauge({ score, large }: { score: number; large?: boolean }) {
  const radius = large ? 32 : 28;
  const strokeWidth = large ? 6 : 5;
  const svgW = large ? 72 : 64;
  const svgH = large ? 42 : 38;
  const center = svgW / 2;
  const circumference = Math.PI * radius;
  const progress = Math.min(score, 100) / 100;
  const offset = circumference * (1 - progress);

  const color =
    score >= 75 ? "hsl(var(--chart-1))" :
    score >= 50 ? "hsl(var(--chart-2))" :
    score >= 30 ? "hsl(var(--chart-4))" :
    "hsl(var(--destructive))";

  return (
    <div className="relative flex flex-col items-center">
      <svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`} className="overflow-visible">
        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke="hsl(var(--muted) / 0.15)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />
        <path
          d={`M ${center - radius} ${center} A ${radius} ${radius} 0 0 1 ${center + radius} ${center}`}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-700 ease-out"
        />
      </svg>
      <span
        className={cn("absolute bottom-0 font-bold tracking-tight", large ? "text-xl" : "text-lg")}
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

export function PulseInsightBlock({ insight, trend, engagementScore, impactReason }: Props) {
  const { t } = useTranslation();
  const isMobile = useIsMobile();

  const trendConfig = {
    up: { icon: TrendingUp, color: "text-chart-1", bg: "bg-chart-1/10", label: t("pulse.trendUp") },
    down: { icon: TrendingDown, color: "text-destructive", bg: "bg-destructive/10", label: t("pulse.trendDown") },
    stable: { icon: Minus, color: "text-chart-4", bg: "bg-chart-4/10", label: t("pulse.trendStable") },
  };

  const { icon: TrendIcon, color, bg, label } = trendConfig[trend];

  return (
    <div className="space-y-3 animate-fade-in">
      {/* Section label */}
      <span className={typography.statLabel}>{t("pulse.engagementScore")}</span>

      {/* Score gauge + Trend */}
      <div className="flex items-end gap-3">
        <ScoreGauge score={engagementScore} />
        <div className={cn("flex items-center gap-1 rounded-full px-2 py-0.5", bg)}>
          <TrendIcon className={cn("h-3 w-3", color)} strokeWidth={2} />
          <span className={cn("text-2xs font-medium", color)}>{label}</span>
        </div>
      </div>

      {/* Insight text */}
      <p className="text-sm text-foreground/90 leading-relaxed">{insight}</p>

      {/* Impact reason callout */}
      {impactReason && (
        <div className="flex items-start gap-2 rounded-xl border border-border/10 bg-primary/[0.03] p-2.5">
          <Sparkles className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" strokeWidth={1.5} />
          <p className="text-xs text-muted-foreground leading-relaxed">
            {impactReason}
          </p>
        </div>
      )}
    </div>
  );
}
