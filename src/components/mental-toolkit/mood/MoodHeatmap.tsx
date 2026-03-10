import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Grid3X3 } from "lucide-react";
import { TOOLKIT } from "@/config/toolkit-colors";

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

interface MoodHeatmapProps {
  dayActivity: number[];
}

export function MoodHeatmap({ dayActivity }: MoodHeatmapProps) {
  const { t } = useTranslation();

  return (
    <Card className="glass-card border-0 rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Grid3X3 className="h-4 w-4" style={{ color: TOOLKIT.plum }} />
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
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium"
                  style={{
                    backgroundColor: count === 0 ? "hsl(var(--muted))" : `rgba(201, 184, 232, ${0.2 + intensity * 0.8})`,
                    color: count > 0 ? TOOLKIT.plum : "hsl(var(--muted-foreground))",
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
