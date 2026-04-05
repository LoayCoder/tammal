import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHasRole } from "@/hooks/auth/useUserPermissions";
import { useTenantId } from "@/hooks/org/useTenantId";
import type { PulseMode } from "./useTeamPulse";

const STORAGE_KEY = "pulse-last-mode";

export function usePulseModes(employeeId: string | null | undefined) {
  const { tenantId } = useTenantId();
  const { hasRole: isSuperAdmin } = useHasRole("super_admin");
  const { hasRole: isTenantAdmin } = useHasRole("tenant_admin");
  const { hasRole: isManager } = useHasRole("manager");

  const isAdmin = isSuperAdmin || isTenantAdmin;
  const isManagerRole = isManager || isAdmin;

  const { data: hasDirectReports } = useQuery({
    queryKey: ["pulse-direct-reports", employeeId, tenantId],
    queryFn: async () => {
      if (!employeeId) return false;
      const { count } = await supabase
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", tenantId!)
        .eq("manager_id", employeeId)
        .is("deleted_at", null);
      return (count ?? 0) > 0;
    },
    enabled: !!employeeId && !!tenantId,
    staleTime: 1000 * 60 * 10,
  });

  const allowedModes = useMemo<PulseMode[]>(() => {
    const modes: PulseMode[] = ["personal"];
    if (isManagerRole || hasDirectReports) modes.push("team");
    if (isAdmin) modes.push("organization");
    return modes;
  }, [isManagerRole, isAdmin, hasDirectReports]);

  const [selectedMode, setSelectedMode] = useState<PulseMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as PulseMode;
      return saved && ["personal", "team", "organization"].includes(saved) ? saved : "personal";
    } catch {
      return "personal";
    }
  });

  useEffect(() => {
    if (!allowedModes.includes(selectedMode)) {
      setSelectedMode("personal");
    }
  }, [allowedModes, selectedMode]);

  const setMode = (mode: PulseMode) => {
    setSelectedMode(mode);
    try { localStorage.setItem(STORAGE_KEY, mode); } catch {}
  };

  return {
    allowedModes,
    selectedMode,
    setMode,
    showModeSwitcher: allowedModes.length > 1,
  };
}
