import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid3X3 } from "lucide-react";
import { TOOLKIT } from "@/config/toolkit-colors";
import { cn } from "@/lib/utils";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

interface MoodHeatmapProps {
  dayActivity: number[];
}

export function MoodHeatmap({ dayActivity }: MoodHeatmapProps) {
  const { t } = useTranslation();
  const max = Math.max(...dayActivity, 1);
  const maxIdx = dayActivity.indexOf(max);

  return (
    <Card className={cn("premium-card rounded-2xl")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Grid3X3 className="h-4 w-4" style={{ color: TOOLKIT.plum }} strokeWidth={1.5} />
          {t("mentalToolkit.moodDashboard.weeklyActivity")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-3 mt-2">
          {DAY_KEYS.map((dayKey, i) => {
            const count = dayActivity[i];
            const intensity = count / max;
            const isMax = i === maxIdx && count > 0;
            return (
              <div key={dayKey} className="flex flex-col items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">{t(`wellness.days.${dayKey}`)}</span>
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-xs font-semibold transition-all duration-200",
                    isMax && "ring-2 ring-offset-2 ring-offset-card"
                  )}
                  style={{
                    backgroundColor: count === 0
                      ? "hsl(var(--muted) / 0.25)"
                      : `hsl(var(--primary) / ${0.15 + intensity * 0.50})`,
                    color: count > 0 ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
                    ...(isMax ? { ringColor: TOOLKIT.plum, borderColor: TOOLKIT.plum } : {}),
                  }}
                >
                  {count}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
