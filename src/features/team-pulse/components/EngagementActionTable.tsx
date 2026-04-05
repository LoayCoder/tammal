import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { DataTable } from "@/shared/data-table/DataTable";
import type { ColumnDef } from "@/shared/data-table/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ar as arLocale } from "date-fns/locale/ar";
import { enUS } from "date-fns/locale/en-US";
import type { ActionLogEntry } from "../hooks/useEngagementTrends";

interface Props {
  data: ActionLogEntry[];
  isLoading?: boolean;
}

const ACTION_BADGE_MAP: Record<string, "default" | "secondary" | "outline"> = {
  cta_clicked: "default",
  nudge_dismissed: "secondary",
  nudge_acted: "default",
  appreciation_sent: "default",
  checkin_from_nudge: "default",
};

export const EngagementActionTable = memo(function EngagementActionTable({ data, isLoading }: Props) {
  const { t, i18n } = useTranslation();

  const columns = useMemo<ColumnDef<ActionLogEntry>[]>(() => [
    {
      id: "createdAt",
      header: t("engagementInsights.colDate"),
      cell: (row) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {format(new Date(row.createdAt), "MMM dd, HH:mm")}
        </span>
      ),
    },
    {
      id: "actionType",
      header: t("engagementInsights.colAction"),
      cell: (row) => (
        <Badge variant={ACTION_BADGE_MAP[row.actionType] ?? "outline"} className="text-2xs">
          {row.actionType.replace(/_/g, " ")}
        </Badge>
      ),
    },
    {
      id: "source",
      header: t("engagementInsights.colSource"),
      cell: (row) => (
        <span className="text-xs text-muted-foreground capitalize">
          {row.source.replace(/_/g, " ")}
        </span>
      ),
    },
  ], [t]);

  return (
    <DataTable
      columns={columns}
      data={data}
      rowKey={(r) => r.id}
      isLoading={isLoading}
      emptyMessage={t("engagementInsights.noActions")}
      emptyDescription={t("engagementInsights.noActionsDesc")}
    />
  );
});
