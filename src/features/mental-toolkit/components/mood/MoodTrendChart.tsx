import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import { BarChart3 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TOOLKIT } from "@/config/toolkit-colors";

interface ChartDataItem {
  date: string;
  label: string;
  score: number | null;
  emoji: string;
  orgAvg: number | null;
}

interface MoodTrendChartProps {
  data: ChartDataItem[];
  hasOrgData: boolean;
}

export function MoodTrendChart({ data, hasOrgData }: MoodTrendChartProps) {
  const { t } = useTranslation();

  return (
    <Card className="glass-card border-0 rounded-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <BarChart3 className="h-4 w-4" style={{ color: TOOLKIT.lavender }} />
          {t("mentalToolkit.moodDashboard.moodTrend")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={TOOLKIT.lavender} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={TOOLKIT.lavender} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 5]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
              <Tooltip content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="bg-card border border-border rounded-lg px-3 py-2 text-sm shadow-md">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{payload[0]?.payload?.emoji || "—"}</span>
                      <div>
                        <div className="font-medium text-foreground">{t("mentalToolkit.moodDashboard.yourMood")}: {payload[0]?.value ?? "—"}</div>
                        {payload[0]?.payload?.orgAvg != null && (
                          <div className="text-xs text-muted-foreground">{t("mentalToolkit.moodDashboard.orgAverage")}: {payload[0].payload.orgAvg}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null
              } />
              <Area type="monotone" dataKey="score" stroke={TOOLKIT.lavender} fill="url(#moodGrad)" strokeWidth={2} dot={{ r: 3, fill: TOOLKIT.lavender }} connectNulls />
              {hasOrgData && <Area type="monotone" dataKey="orgAvg" stroke={TOOLKIT.sage} fill="none" strokeWidth={1.5} strokeDasharray="5 3" dot={false} connectNulls />}
              <ReferenceLine y={3} stroke="hsl(var(--border))" strokeDasharray="3 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {hasOrgData && (
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground justify-center">
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 rounded" style={{ backgroundColor: TOOLKIT.lavender }} />{t("mentalToolkit.moodDashboard.yourMood")}</span>
            <span className="flex items-center gap-1"><span className="inline-block w-3 h-0.5 rounded border-dashed border-t-2" style={{ borderColor: TOOLKIT.sage }} />{t("mentalToolkit.moodDashboard.orgAverage")}</span>
          </div>
        )}
        {!hasOrgData && <p className="text-xs text-muted-foreground text-center mt-2">{t("mentalToolkit.moodDashboard.orgComparisonNote")}</p>}
      </CardContent>
    </Card>
  );
}
