import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, Tooltip, ResponsiveContainer, Label } from "recharts";
import { TOOLKIT, DONUT_COLORS } from "@/config/toolkit-colors";
import { cn } from "@/lib/utils";

interface DonutDataItem {
  name: string;
  value: number;
}

interface MoodDistributionDonutProps {
  data: DonutDataItem[];
}

export function MoodDistributionDonut({ data }: MoodDistributionDonutProps) {
  const { t } = useTranslation();
  const total = data.reduce((sum, d) => sum + d.value, 0);

  return (
    <Card className={cn("premium-card rounded-2xl")}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <PieChart className="h-4 w-4" style={{ color: TOOLKIT.sage }} strokeWidth={1.5} />
          {t("mentalToolkit.moodDashboard.moodDistribution")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("mentalToolkit.moodDashboard.noDataYet")}</p>
        ) : (
          <>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPie>
                  <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} strokeWidth={0}>
                    {data.map((_, idx) => <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />)}
                    <Label
                      value={total}
                      position="center"
                      className="fill-foreground text-xl font-bold"
                    />
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [value, t("mentalToolkit.moodDashboard.days")]}
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 16,
                      fontSize: 12,
                    }}
                  />
                </RechartsPie>
              </ResponsiveContainer>
            </div>
            {/* Custom legend */}
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-1">
              {data.map((item, idx) => (
                <span key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: DONUT_COLORS[idx % DONUT_COLORS.length] }} />
                  {item.name}
                </span>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
