import { useTranslation } from "react-i18next";
import { BarChart3, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { cardVariants } from "@/theme/tokens";
import { useAppreciationStats } from "../hooks/useAppreciationStats";
import type { PulseMode } from "../hooks/useTeamPulse";

const CATEGORY_COLORS: Record<string, string> = {
  teamwork: "bg-chart-1",
  innovation: "bg-chart-2",
  support: "bg-chart-4",
  leadership: "bg-primary",
  above_beyond: "bg-chart-3",
};

const CATEGORY_LABEL_KEYS: Record<string, string> = {
  teamwork: "pulse.catTeamwork",
  innovation: "pulse.catInnovation",
  support: "pulse.catSupport",
  leadership: "pulse.catLeadership",
  above_beyond: "pulse.catAboveBeyond",
};

interface Props {
  mode: PulseMode;
}

export function AppreciationActivityWidget({ mode }: Props) {
  const { t } = useTranslation();
  const { data: stats, isPending } = useAppreciationStats(mode);

  if (isPending || !stats) return null;

  const totalActivity = stats.totalSent + stats.totalReceived;
  if (totalActivity === 0 && stats.categories.length === 0) return null;

  const maxCount = Math.max(...stats.categories.map((c) => c.count), 1);

  return (
    <div className={cn(cardVariants.premiumVip, "rounded-2xl overflow-hidden")}>
      <div className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-chart-1/15 to-chart-3/10">
            <BarChart3 className="h-4 w-4 text-chart-1" strokeWidth={1.5} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">{t("pulse.activityTitle")}</h3>
            <p className="text-[10px] text-muted-foreground">{t("pulse.activitySubtitle")}</p>
          </div>
        </div>

        {/* Stats row */}
        {mode === "personal" && (
          <div className="flex gap-4">
            <div className="flex-1 rounded-xl premium-badge p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">{stats.totalSent}</p>
              <p className="text-2xs text-muted-foreground">{t("pulse.sent")}</p>
            </div>
            <div className="flex-1 rounded-xl premium-badge p-2.5 text-center">
              <p className="text-lg font-bold text-foreground">{stats.totalReceived}</p>
              <p className="text-2xs text-muted-foreground">{t("pulse.received")}</p>
            </div>
          </div>
        )}

        {/* Category breakdown */}
        {stats.categories.length > 0 && (
          <div className="space-y-1.5">
            {stats.categories.slice(0, 5).map((cat) => (
              <div key={cat.category} className="flex items-center gap-2">
                <span className="text-2xs text-muted-foreground w-20 truncate text-end">
                  {t(CATEGORY_LABEL_KEYS[cat.category] ?? "pulse.catTeamwork")}
                </span>
                <div className="flex-1 h-1.5 rounded-full bg-muted/10 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", CATEGORY_COLORS[cat.category] ?? "bg-primary")}
                    style={{ width: `${(cat.count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="text-2xs font-semibold text-foreground w-5 text-end">{cat.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Top category badge */}
        {stats.topCategory && (
          <div className="flex items-center gap-1.5 rounded-lg bg-primary/5 px-2.5 py-1.5">
            <Award className="h-3 w-3 text-primary" strokeWidth={1.5} />
            <span className="text-2xs text-muted-foreground">{t("pulse.topCategory")}</span>
            <span className="text-2xs font-semibold text-foreground">
              {t(CATEGORY_LABEL_KEYS[stats.topCategory] ?? "pulse.catTeamwork")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
