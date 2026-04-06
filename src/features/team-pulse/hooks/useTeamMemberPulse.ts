import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useTenantId } from "@/hooks/org/useTenantId";
import { subDays, differenceInDays, parseISO } from "date-fns";

export type RiskLevel = "high" | "medium" | "healthy";

export interface TeamMemberPulse {
  id: string;
  fullName: string;
  roleTitle: string | null;
  avgMoodScore: number | null;
  moodLevel: string | null;
  activeTasks: number;
  overdueTasks: number;
  lastCheckInDate: string | null;
  riskLevel: RiskLevel;
}

function computeRisk(
  avgMood: number | null,
  overdue: number,
  lastCheckIn: string | null
): RiskLevel {
  const daysSinceCheckIn = lastCheckIn
    ? differenceInDays(new Date(), parseISO(lastCheckIn))
    : 999;

  const lowMood = avgMood !== null && avgMood <= 2;
  const noRecentCheckIn = daysSinceCheckIn >= 5;

  if ((lowMood && overdue > 2) || (lowMood && noRecentCheckIn) || (noRecentCheckIn && overdue > 2)) {
    return "high";
  }
  if (lowMood || overdue > 0 || daysSinceCheckIn >= 3) {
    return "medium";
  }
  return "healthy";
}

export function useTeamMemberPulse(employeeId: string, enabled: boolean) {
  const { tenantId } = useTenantId();
  const sevenDaysAgo = subDays(new Date(), 7).toISOString();

  return useQuery<TeamMemberPulse[]>({
    queryKey: ["team-member-pulse", employeeId, tenantId],
    queryFn: async () => {
      if (!tenantId) return [];

      // 1. Get direct reports
      const { data: reports } = await supabase
        .from("employees")
        .select("id, full_name, role_title")
        .eq("tenant_id", tenantId)
        .eq("manager_id", employeeId)
        .is("deleted_at", null)
        .eq("status", "active")
        .limit(200);

      if (!reports?.length) return [];

      const reportIds = reports.map((r) => r.id);

      // 2. Get mood entries (last 7 days) — parallel
      const [moodResult, taskResult, checkinResult] = await Promise.all([
        supabase
          .from("mood_entries")
          .select("employee_id, mood_score")
          .eq("tenant_id", tenantId)
          .in("employee_id", reportIds)
          .gte("entry_date", sevenDaysAgo.split("T")[0]),

        supabase
          .from("unified_tasks")
          .select("employee_id, status, due_date")
          .eq("tenant_id", tenantId)
          .in("employee_id", reportIds)
          .is("deleted_at", null)
          .in("status", ["todo", "in_progress", "overdue", "blocked"]),

        supabase
          .from("mood_entries")
          .select("employee_id, entry_date")
          .eq("tenant_id", tenantId)
          .in("employee_id", reportIds)
          .order("entry_date", { ascending: false })
          .limit(200),
      ]);

      // Aggregate mood per employee
      const moodMap = new Map<string, number[]>();
      (moodResult.data ?? []).forEach((m) => {
        const arr = moodMap.get(m.employee_id) ?? [];
        arr.push(m.mood_score);
        moodMap.set(m.employee_id, arr);
      });

      // Aggregate tasks per employee
      const taskMap = new Map<string, { active: number; overdue: number }>();
      const now = new Date();
      (taskResult.data ?? []).forEach((t) => {
        const entry = taskMap.get(t.employee_id) ?? { active: 0, overdue: 0 };
        entry.active++;
        if (t.due_date && new Date(t.due_date) < now && t.status !== "done") {
          entry.overdue++;
        }
        taskMap.set(t.employee_id, entry);
      });

      // Last check-in per employee
      const lastCheckInMap = new Map<string, string>();
      (checkinResult.data ?? []).forEach((c) => {
        if (!lastCheckInMap.has(c.employee_id)) {
          lastCheckInMap.set(c.employee_id, c.entry_date);
        }
      });

      // Build result
      const members: TeamMemberPulse[] = reports.map((r) => {
        const moods = moodMap.get(r.id);
        const avgMood = moods?.length
          ? Math.round((moods.reduce((a, b) => a + b, 0) / moods.length) * 10) / 10
          : null;
        const moodLevel = avgMood !== null
          ? avgMood >= 4 ? "great" : avgMood >= 3 ? "good" : avgMood >= 2 ? "okay" : "low"
          : null;
        const tasks = taskMap.get(r.id) ?? { active: 0, overdue: 0 };
        const lastCheckIn = lastCheckInMap.get(r.id) ?? null;

        return {
          id: r.id,
          fullName: r.full_name,
          roleTitle: r.role_title,
          avgMoodScore: avgMood,
          moodLevel,
          activeTasks: tasks.active,
          overdueTasks: tasks.overdue,
          lastCheckInDate: lastCheckIn,
          riskLevel: computeRisk(avgMood, tasks.overdue, lastCheckIn),
        };
      });

      // Sort: high risk first
      const order: Record<RiskLevel, number> = { high: 0, medium: 1, healthy: 2 };
      members.sort((a, b) => order[a.riskLevel] - order[b.riskLevel]);

      return members;
    },
    enabled: !!employeeId && !!tenantId && enabled,
    staleTime: 1000 * 60 * 5,
  });
}
