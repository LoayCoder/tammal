import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHasRole } from "@/hooks/auth/useUserPermissions";
import type { CopilotMode } from "./useCopilotInsight";

const STORAGE_KEY = "copilot-last-mode";

export function useCopilotModes(employeeId: string | null | undefined) {
  const { hasRole: isSuperAdmin } = useHasRole("super_admin");
  const { hasRole: isTenantAdmin } = useHasRole("tenant_admin");
  const { hasRole: isManager } = useHasRole("manager");

  const isAdmin = isSuperAdmin || isTenantAdmin;
  const isManagerRole = isManager || isAdmin;

  // Check direct reports
  const { data: hasDirectReports } = useQuery({
    queryKey: ["has-direct-reports", employeeId],
    queryFn: async () => {
      if (!employeeId) return false;
      const { count } = await supabase
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("manager_id", employeeId)
        .is("deleted_at", null);
      return (count ?? 0) > 0;
    },
    enabled: !!employeeId,
    staleTime: 1000 * 60 * 10,
  });

  const allowedModes = useMemo<CopilotMode[]>(() => {
    const modes: CopilotMode[] = ["personal"];
    if (isManagerRole || hasDirectReports) modes.push("team");
    if (isAdmin) modes.push("organization");
    return modes;
  }, [isManagerRole, isAdmin, hasDirectReports]);

  const [selectedMode, setSelectedMode] = useState<CopilotMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as CopilotMode;
      return saved && ["personal", "team", "organization"].includes(saved) ? saved : "personal";
    } catch {
      return "personal";
    }
  });

  // Ensure selected mode is allowed
  useEffect(() => {
    if (!allowedModes.includes(selectedMode)) {
      setSelectedMode("personal");
    }
  }, [allowedModes, selectedMode]);

  const setMode = (mode: CopilotMode) => {
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
