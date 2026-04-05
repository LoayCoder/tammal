import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { Lightbulb } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { UrgencyLevel } from "../hooks/useCopilotInsight";

interface Props {
  insight: string;
  urgencyLevel: UrgencyLevel;
  secondaryInsight?: string;
}

const urgencyStyles: Record<UrgencyLevel, string> = {
  opportunity: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  neutral: "bg-muted/20 text-muted-foreground border-muted/30",
  attention: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
};

const urgencyLabels: Record<UrgencyLevel, string> = {
  opportunity: "copilot.urgencyOpportunity",
  neutral: "copilot.urgencyNeutral",
  attention: "copilot.urgencyAttention",
  urgent: "copilot.urgencyUrgent",
};

export function CopilotInsightBlock({ insight, urgencyLevel, secondaryInsight }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/[0.06]">
          <Lightbulb className="h-4 w-4 text-primary" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-2xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("copilot.insight")}
            </span>
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0 border", urgencyStyles[urgencyLevel])}
            >
              {t(urgencyLabels[urgencyLevel])}
            </Badge>
          </div>
          <p className="text-sm font-medium text-foreground leading-relaxed">{insight}</p>
          {secondaryInsight && (
            <p className="text-xs text-muted-foreground leading-relaxed">{secondaryInsight}</p>
          )}
        </div>
      </div>
    </div>
  );
}
