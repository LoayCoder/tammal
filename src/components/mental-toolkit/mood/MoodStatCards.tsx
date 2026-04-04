import { useTranslation } from "react-i18next";
import { Card, CardContent } from "@/components/ui/card";
import { Flame, TrendingUp, CalendarCheck, Activity } from "lucide-react";
import { TOOLKIT, ZONE_COLORS } from "@/config/toolkit-colors";
import { typography } from "@/theme/tokens";
import { cn } from "@/lib/utils";

interface MoodStatCardsProps {
  streak: number;
  avgMood7d: number;
  burnoutZone: string;
  monthlyCheckins: number;
  daysInMonth: number;
  todayDef: { emoji: string; label_en: string; label_ar: string } | null;
  isRTL: boolean;
}

const statCard = "premium-card rounded-2xl hover:shadow-md hover:-translate-y-0.5 transition-all duration-200";

export function MoodStatCards({ streak, avgMood7d, burnoutZone, monthlyCheckins, daysInMonth, todayDef, isRTL }: MoodStatCardsProps) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <Card className={cn(statCard)}>
        <CardContent className="p-5 flex flex-col items-center text-center gap-1">
          <Flame className="h-5 w-5" style={{ color: TOOLKIT.lavender }} strokeWidth={1.75} />
          <span className={typography.pageTitle}>{streak}</span>
          <span className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.currentStreak")}</span>
        </CardContent>
      </Card>

      <Card className={cn(statCard)}>
        <CardContent className="p-5 flex flex-col items-center text-center gap-1">
          <TrendingUp className="h-5 w-5" style={{ color: ZONE_COLORS[burnoutZone] }} strokeWidth={1.75} />
          <span className={typography.pageTitle}>{avgMood7d}</span>
          <span className="text-xs font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: ZONE_COLORS[burnoutZone] + "22", color: ZONE_COLORS[burnoutZone] }}>
            {t(`mentalToolkit.moodDashboard.${burnoutZone}`)}
          </span>
          <span className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.avgMood7d")}</span>
        </CardContent>
      </Card>

      <Card className={cn(statCard)}>
        <CardContent className="p-5 flex flex-col items-center text-center gap-1">
          <CalendarCheck className="h-5 w-5" style={{ color: TOOLKIT.sage }} strokeWidth={1.75} />
          <span className={typography.pageTitle}>
            {monthlyCheckins}<span className="text-sm font-normal text-muted-foreground">/{daysInMonth}</span>
          </span>
          <span className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.monthlyCheckins")}</span>
        </CardContent>
      </Card>

      <Card className={cn(statCard)}>
        <CardContent className="p-5 flex flex-col items-center text-center gap-1">
          {todayDef ? (
            <>
              <span className="text-3xl">{todayDef.emoji}</span>
              <span className="text-sm font-medium text-foreground">{isRTL ? todayDef.label_ar : todayDef.label_en}</span>
            </>
          ) : (
            <>
              <Activity className="h-5 w-5 text-muted-foreground" strokeWidth={1.75} />
              <span className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.notCheckedIn")}</span>
            </>
          )}
          <span className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.todayMood")}</span>
        </CardContent>
      </Card>
    </div>
  );
}
