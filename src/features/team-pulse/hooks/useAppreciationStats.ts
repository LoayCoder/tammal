import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentEmployee } from "@/hooks/auth/useCurrentEmployee";
import { useTenantId } from "@/hooks/org/useTenantId";
import type { PulseMode } from "./useTeamPulse";

export interface CategoryStat {
  category: string;
  count: number;
}

export interface AppreciationStats {
  totalSent: number;
  totalReceived: number;
  categories: CategoryStat[];
  topCategory: string | null;
}

export function useAppreciationStats(mode: PulseMode) {
  const { employee } = useCurrentEmployee();
  const { tenantId } = useTenantId();

  return useQuery<AppreciationStats>({
    queryKey: ["appreciation-stats", mode, employee?.id],
    queryFn: async () => {
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

      if (mode === "personal") {
        const [{ data: sent }, { data: received }] = await Promise.all([
          supabase
            .from("appreciations")
            .select("category")
            .eq("tenant_id", tenantId!)
            .eq("from_employee_id", employee!.id)
            .is("deleted_at", null)
            .gte("created_at", thirtyDaysAgo),
          supabase
            .from("appreciations")
            .select("category")
            .eq("tenant_id", tenantId!)
            .eq("to_employee_id", employee!.id)
            .is("deleted_at", null)
            .gte("created_at", thirtyDaysAgo),
        ]);

        const all = [...(received ?? [])];
        const catMap = new Map<string, number>();
        for (const a of all) {
          catMap.set(a.category, (catMap.get(a.category) ?? 0) + 1);
        }
        const categories = Array.from(catMap.entries())
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count);

        return {
          totalSent: sent?.length ?? 0,
          totalReceived: received?.length ?? 0,
          categories,
          topCategory: categories[0]?.category ?? null,
        };
      }

      // Team / Org — fetch by tenant
      const query = supabase
        .from("appreciations")
        .select("category")
        .eq("tenant_id", tenantId!)
        .is("deleted_at", null)
        .gte("created_at", thirtyDaysAgo);

      const { data } = await query;
      const catMap = new Map<string, number>();
      for (const a of data ?? []) {
        catMap.set(a.category, (catMap.get(a.category) ?? 0) + 1);
      }
      const categories = Array.from(catMap.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count);

      return {
        totalSent: 0,
        totalReceived: data?.length ?? 0,
        categories,
        topCategory: categories[0]?.category ?? null,
      };
    },
    enabled: !!employee?.id && !!tenantId,
    staleTime: 1000 * 60 * 10,
  });
}
