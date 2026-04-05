import { memo } from "react";
import { useTranslation } from "react-i18next";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from "recharts";
import ChartCard from "@/components/system/ChartCard";
import { CHART_AXIS_TICK, CHART_TOOLTIP_STYLE, CHART_GRID_STROKE } from "@/config/chart-styles";
import type { PulseTrendPoint } from "../hooks/useEngagementTrends";

interface Props {
  data: PulseTrendPoint[];
}

export const PulseTrendChart = memo(function PulseTrendChart({ data }: Props) {
  const { t } = useTranslation();

  if (data.length === 0) {
    return (
      <ChartCard title={t("engagementInsights.pulseTrend")}>
        <div className="flex items-center justify-center h-48 text-sm text-muted-foreground">
          {t("engagementInsights.noTrendData")}
        </div>
      </ChartCard>
    );
  }

  return (
    <ChartCard title={t("engagementInsights.pulseTrend")} description={t("engagementInsights.pulseTrendDesc")}>
      <div className="h-56 sm:h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 8, bottom: 4, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} opacity={0.4} />
            <XAxis dataKey="date" tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
            <YAxis domain={[0, 100]} tick={CHART_AXIS_TICK} tickLine={false} axisLine={false} />
            <Tooltip contentStyle={CHART_TOOLTIP_STYLE} />
            <ReferenceLine y={50} stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" opacity={0.4} />
            <Line
              type="monotone"
              dataKey="score"
              stroke="hsl(var(--chart-2))"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: "hsl(var(--chart-2))" }}
              name={t("engagementInsights.score")}
            />
            <Line
              type="monotone"
              dataKey="target"
              stroke="hsl(var(--muted-foreground))"
              strokeWidth={1}
              strokeDasharray="4 4"
              dot={false}
              name={t("engagementInsights.target")}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </ChartCard>
  );
});
