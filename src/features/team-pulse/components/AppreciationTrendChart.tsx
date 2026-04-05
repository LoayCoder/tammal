import { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import ChartCard from "@/components/system/ChartCard";
import { CHART_AXIS_TICK, CHART_TOOLTIP_STYLE, CHART_GRID_STROKE } from "@/config/chart-styles";
import type { AppreciationWeek } from "../hooks/useEngagementTrends";

interface Props {
  data: AppreciationWeek[];
}

export const AppreciationTrendChart = memo(function AppreciationTrendChart({ data }: Props) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <ChartCard title={t("engagementInsights.appreciationTrend")}>
        <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
          {t("engagementInsights.noAppreciationData")}
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={t("engagementInsights.appreciationTrend")} description={t("engagementInsights.appreciationTrendDesc")}>
      <div className="h-48 sm:h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
            <defs>
              <linearGradient id="appreciationFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--chart-3))" stopOpacity={0.2} />
                <stop offset="95%" stopColor="hsl(var(--chart-3))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} opacity={0.4} />
            <XAxis dataKey="week" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
            <YAxis allowDecimals={false} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <Area
              type="monotone"
              dataKey="count"
              stroke="hsl(var(--chart-3))"
              strokeWidth={2}
              fill="url(#appreciationFill)"
              name={t("engagementInsights.appreciations")}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
});
