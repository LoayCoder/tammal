import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentEmployee } from "@/hooks/auth/useCurrentEmployee";
import { useTenantId } from "@/hooks/org/useTenantId";
import { subDays, startOfWeek, format } from "date-fns";
import type { PulseMode } from "./useTeamPulse";

export interface PulseTrendPoint {
  date: string;
  score: number;
  target: number;
}

export interface AppreciationWeek {
  week: string;
  count: number;
}

export interface ActionLogEntry {
  id: string;
  actionType: string;
  source: string;
  createdAt: string;
}

export function useEngagementTrends(mode: PulseMode, employeeId: string | null | undefined) {
  const { employee } = useCurrentEmployee();
  const { tenantId } = useTenantId();

  const scope = mode === "personal" ? "personal" : mode === "team" ? "team" : "organization";

  const pulseTrend = useQuery({
    queryKey: ["engagement-pulse-trend", scope, employeeId],
    queryFn: async (): Promise<PulseTrendPoint[]> => {
      const since = subDays(new Date(), 30).toISOString().split("T")[0];
      let query = supabase
        .from("pulse_targets")
        .select("target_date, current_value, target_value")
        .eq("tenant_id", tenantId!)
        .eq("scope", scope)
        .eq("target_metric", "engagement_score")
        .gte("target_date", since)
        .is("deleted_at", null)
        .order("target_date", { ascending: true })
        .limit(60);

      if (scope === "personal" && employeeId) {
        query = query.eq("employee_id", employeeId);
      }

      const { data } = await query;
      return (data ?? []).map((r) => ({
        date: r.target_date,
        score: r.current_value,
        target: r.target_value,
      }));
    },
    enabled: !!employeeId && !!tenantId,
    staleTime: 1000 * 60 * 5,
  });

  const appreciationTrend = useQuery({
    queryKey: ["engagement-appreciation-trend", tenantId, employeeId, scope],
    queryFn: async (): Promise<AppreciationWeek[]> => {
      const since = subDays(new Date(), 90).toISOString();
      let query = supabase
        .from("appreciations")
        .select("created_at")
        .gte("created_at", since)
        .is("deleted_at", null)
        .order("created_at", { ascending: true })
        .limit(500);

      if (scope === "personal" && employeeId) {
        query = query.or(`from_employee_id.eq.${employeeId},to_employee_id.eq.${employeeId}`);
      }

      const { data } = await query;
      const weekMap = new Map<string, number>();
      (data ?? []).forEach((r) => {
        const w = format(startOfWeek(new Date(r.created_at), { weekStartsOn: 0 }), "MMM dd");
        weekMap.set(w, (weekMap.get(w) ?? 0) + 1);
      });
      return Array.from(weekMap.entries()).map(([week, count]) => ({ week, count }));
    },
    enabled: !!tenantId,
    staleTime: 1000 * 60 * 5,
  });

  const actionLog = useQuery({
    queryKey: ["engagement-action-log", employee?.id],
    queryFn: async (): Promise<ActionLogEntry[]> => {
      const { data } = await supabase
        .from("engagement_action_log")
        .select("id, action_type, source, created_at")
        .eq("employee_id", employee!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);

      return (data ?? []).map((r) => ({
        id: r.id,
        actionType: r.action_type,
        source: r.source,
        createdAt: r.created_at,
      }));
    },
    enabled: !!employee?.id,
    staleTime: 1000 * 60 * 2,
  });

  return {
    pulseTrend: pulseTrend.data ?? [],
    appreciationTrend: appreciationTrend.data ?? [],
    actionLog: actionLog.data ?? [],
    isPending: pulseTrend.isPending || appreciationTrend.isPending || actionLog.isPending,
  };
}
