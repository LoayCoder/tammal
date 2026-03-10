import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart } from "lucide-react";
import { PieChart as RechartsPie, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import { TOOLKIT, DONUT_COLORS } from "@/config/toolkit-colors";

interface DonutDataItem {
  name: string;
  value: number;
}

interface MoodDistributionDonutProps {
  data: DonutDataItem[];
}

export function MoodDistributionDonut({ data }: MoodDistributionDonutProps) {
  const { t } = useTranslation();

  return (
    <Card className="glass-card border-0 rounded-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <PieChart className="h-4 w-4" style={{ color: TOOLKIT.sage }} />
          {t("mentalToolkit.moodDashboard.moodDistribution")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">{t("mentalToolkit.moodDashboard.noDataYet")}</p>
        ) : (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3}>
                  {data.map((_, idx) => <Cell key={idx} fill={DONUT_COLORS[idx % DONUT_COLORS.length]} />)}
                </Pie>
                <Legend iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => [value, t("mentalToolkit.moodDashboard.days")]} />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
