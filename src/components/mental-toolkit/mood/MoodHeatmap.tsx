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

  return (
    <Card className={cn("premium-card rounded-2xl")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Grid3X3 className="h-4 w-4" style={{ color: TOOLKIT.plum }} strokeWidth={1.75} />
          {t("mentalToolkit.moodDashboard.weeklyActivity")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2 mt-2">
          {DAY_KEYS.map((dayKey, i) => {
            const count = dayActivity[i];
            const max = Math.max(...dayActivity, 1);
            const intensity = count / max;
            return (
              <div key={dayKey} className="flex flex-col items-center gap-1">
                <span className="text-2xs text-muted-foreground">{t(`wellness.days.${dayKey}`)}</span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-medium transition-colors duration-200"
                  style={{
                    backgroundColor: count === 0
                      ? "hsl(var(--muted) / 0.3)"
                      : `hsl(var(--primary) / ${0.15 + intensity * 0.45})`,
                    color: count > 0 ? "hsl(var(--primary-foreground))" : "hsl(var(--muted-foreground))",
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
