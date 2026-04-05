import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/shared/data-table/DataTable";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import type { ActionLogEntry } from "../hooks/useEngagementTrends";

interface Props {
  data: ActionLogEntry[];
  isLoading?: boolean;
}

const ACTION_BADGE_MAP: Record<string, string> = {
  cta_clicked: "default",
  nudge_dismissed: "secondary",
  nudge_acted: "default",
  appreciation_sent: "default",
  checkin_from_nudge: "default",
};

export const EngagementActionTable = memo(function EngagementActionTable({ data, isLoading }: Props) {
  const { t } = useTranslation();

  const columns = useMemo<ColumnDef<ActionLogEntry>[]>(() => [
    {
      accessorKey: "createdAt",
      header: t("engagementInsights.colDate"),
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground tabular-nums">
          {format(new Date(getValue() as string), "MMM dd, HH:mm")}
        </span>
      ),
    },
    {
      accessorKey: "actionType",
      header: t("engagementInsights.colAction"),
      cell: ({ getValue }) => {
        const v = getValue() as string;
        return (
          <Badge variant={(ACTION_BADGE_MAP[v] as any) ?? "outline"} className="text-2xs">
            {v.replace(/_/g, " ")}
          </Badge>
        );
      },
    },
    {
      accessorKey: "source",
      header: t("engagementInsights.colSource"),
      cell: ({ getValue }) => (
        <span className="text-xs text-muted-foreground capitalize">
          {(getValue() as string).replace(/_/g, " ")}
        </span>
      ),
    },
  ], [t]);

  return (
    <DataTable
      columns={columns}
      data={data}
      isLoading={isLoading}
      emptyTitle={t("engagementInsights.noActions")}
      emptyDescription={t("engagementInsights.noActionsDesc")}
    />
  );
});
