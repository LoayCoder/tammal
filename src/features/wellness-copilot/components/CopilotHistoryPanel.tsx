import { useState } from "react";
import { useTranslation } from "react-i18next";
import { format, parseISO } from "date-fns";
import { ar } from "date-fns/locale";
import { History, ChevronDown, ChevronUp, Lightbulb, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cardVariants } from "@/theme/tokens";
import { useCopilotHistory, type CopilotHistoryEntry } from "../hooks/useCopilotHistory";
import type { UrgencyLevel } from "../hooks/useCopilotInsight";

const urgencyStyles: Record<string, string> = {
  opportunity: "bg-chart-1/10 text-chart-1 border-chart-1/20",
  neutral: "bg-muted/20 text-muted-foreground border-muted/30",
  attention: "bg-chart-4/10 text-chart-4 border-chart-4/20",
  urgent: "bg-destructive/10 text-destructive border-destructive/20",
};

const urgencyLabels: Record<string, { en: string; ar: string }> = {
  opportunity: { en: "Opportunity", ar: "فرصة" },
  neutral: { en: "Neutral", ar: "محايد" },
  attention: { en: "Attention", ar: "انتباه" },
  urgent: { en: "Urgent", ar: "عاجل" },
};

const modeLabels: Record<string, { en: string; ar: string }> = {
  personal: { en: "Personal", ar: "شخصي" },
  team: { en: "Team", ar: "فريق" },
  organization: { en: "Organization", ar: "مؤسسة" },
};

function HistoryItem({ entry, isAr }: { entry: CopilotHistoryEntry; isAr: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const dateStr = format(parseISO(entry.insight_date), "d MMM yyyy", {
    locale: isAr ? ar : undefined,
  });
  const urgency = entry.urgency_level as UrgencyLevel;
  const mode = entry.mode;

  return (
    <div className="border border-border/50 rounded-xl p-3 space-y-2 transition-all duration-200 hover:border-border">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] font-medium text-muted-foreground">{dateStr}</span>
            <Badge
              variant="outline"
              className={cn("text-[10px] px-1.5 py-0 border", urgencyStyles[urgency] ?? urgencyStyles.neutral)}
            >
              {(urgencyLabels[urgency] ?? urgencyLabels.neutral)[isAr ? "ar" : "en"]}
            </Badge>
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 border bg-muted/10 text-muted-foreground border-muted/30">
              {(modeLabels[mode] ?? modeLabels.personal)[isAr ? "ar" : "en"]}
            </Badge>
          </div>
          <p className="text-sm font-medium text-foreground leading-relaxed line-clamp-2">
            {entry.primary_insight}
          </p>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="shrink-0 flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/10 transition-all"
        >
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="space-y-2 pt-1 border-t border-border/30 animate-in fade-in slide-in-from-top-1 duration-200">
          {entry.secondary_insight && (
            <p className="text-xs text-muted-foreground leading-relaxed">{entry.secondary_insight}</p>
          )}
          {entry.recommended_action && (
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {isAr ? "الإجراء الموصى به" : "Recommended Action"}
              </span>
              <p className="text-xs text-foreground/80">{entry.recommended_action}</p>
            </div>
          )}
          {entry.reasoning && (
            <div className="space-y-0.5">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {isAr ? "التحليل" : "Reasoning"}
              </span>
              <p className="text-xs text-muted-foreground">{entry.reasoning}</p>
            </div>
          )}
          {entry.basis_statement && (
            <p className="text-[10px] italic text-muted-foreground/70">{entry.basis_statement}</p>
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  className?: string;
}

export function CopilotHistoryPanel({ className }: Props) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { data: history = [], isPending, error } = useCopilotHistory(30);
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll ? history : history.slice(0, 7);
  const hasMore = history.length > 7;

  return (
    <div className={cn(cardVariants.premiumVip, "rounded-2xl overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-2 p-4 pb-0">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary/15 to-chart-1/10">
          <History className="h-4 w-4 text-primary" strokeWidth={1.5} />
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">
            {isAr ? "سجل الرؤى" : "Insight History"}
          </h3>
          <p className="text-[10px] text-muted-foreground">
            {isAr ? "رؤى الذكاء الاصطناعي السابقة" : "Your past AI wellness insights"}
          </p>
        </div>
      </div>

      <div className="p-4 space-y-3">
        {isPending ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl bg-muted/20 animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <p className="text-xs text-destructive text-center py-4">
            {isAr ? "خطأ في تحميل السجل" : "Error loading history"}
          </p>
        ) : history.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted/20">
              <Sparkles className="h-5 w-5 text-muted-foreground" strokeWidth={1.5} />
            </div>
            <p className="text-xs text-muted-foreground">
              {isAr
                ? "لا توجد رؤى سابقة بعد. ستظهر هنا بعد استخدام مساعد العافية."
                : "No insights yet. They'll appear here after using the Wellness Copilot."}
            </p>
          </div>
        ) : (
          <>
            {displayed.map((entry) => (
              <HistoryItem key={entry.id} entry={entry} isAr={isAr} />
            ))}
            {hasMore && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowAll(!showAll)}
                className="w-full text-xs text-muted-foreground"
              >
                {showAll
                  ? isAr ? "عرض أقل" : "Show Less"
                  : isAr ? `عرض الكل (${history.length})` : `View All (${history.length})`}
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
