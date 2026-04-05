import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentEmployee } from "@/hooks/auth/useCurrentEmployee";
import { useTenantId } from "@/hooks/org/useTenantId";

type ActionType = "cta_clicked" | "nudge_dismissed" | "nudge_acted" | "appreciation_sent" | "checkin_from_nudge";
type ActionSource = "pulse_card" | "nudge_card" | "appreciation_widget";

interface LogActionInput {
  actionType: ActionType;
  source: ActionSource;
  metadata?: Record<string, unknown> | undefined;
}

export function useEngagementActionLog() {
  const { employee } = useCurrentEmployee();
  const { tenantId } = useTenantId();

  const logAction = useMutation({
    mutationFn: async ({ actionType, source, metadata = {} }: LogActionInput) => {
      if (!employee?.id || !tenantId) return;

      const { error } = await supabase
        .from("engagement_action_log")
        .insert([{
          tenant_id: tenantId,
          employee_id: employee.id,
          action_type: actionType,
          source,
          metadata,
        }]);

      if (error && import.meta.env.DEV) {
        console.error("Failed to log engagement action:", error);
      }
    },
  });

  return { logAction };
}
