import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/auth/useAuth";
import { useTenantId } from "@/hooks/org/useTenantId";
import { useCurrentEmployee } from "@/hooks/auth/useCurrentEmployee";
import { useEngagementActionLog } from "./useEngagementActionLog";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

export type AppreciationCategory = "teamwork" | "innovation" | "support" | "leadership" | "above_beyond";

export interface Appreciation {
  id: string;
  tenant_id: string;
  from_employee_id: string;
  to_employee_id: string;
  message: string;
  category: AppreciationCategory;
  created_at: string;
  from_employee?: { id: string; full_name: string };
  to_employee?: { id: string; full_name: string };
}

export function useAppreciations() {
  const { user } = useAuth();
  const { tenantId } = useTenantId();
  const { employee } = useCurrentEmployee();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { logAction } = useEngagementActionLog();

  const { data: received = [], isPending: receivedLoading } = useQuery({
    queryKey: ["appreciations-received", employee?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appreciations")
        .select("*, from_employee:employees!appreciations_from_employee_id_fkey(id, full_name)")
        .eq("to_employee_id", employee!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as unknown as Appreciation[];
    },
    enabled: !!employee?.id,
  });

  const { data: sent = [], isPending: sentLoading } = useQuery({
    queryKey: ["appreciations-sent", employee?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("appreciations")
        .select("*, to_employee:employees!appreciations_to_employee_id_fkey(id, full_name)")
        .eq("from_employee_id", employee!.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as unknown as Appreciation[];
    },
    enabled: !!employee?.id,
  });

  const sendAppreciation = useMutation({
    mutationFn: async (params: {
      toEmployeeId: string;
      message: string;
      category: AppreciationCategory;
    }) => {
      if (!employee || !tenantId) throw new Error("Not ready");

      const { error } = await supabase.from("appreciations").insert({
        tenant_id: tenantId,
        from_employee_id: employee.id,
        to_employee_id: params.toEmployeeId,
        message: params.message,
        category: params.category,
      });
      if (error) throw error;

      // Award points to sender
      if (user?.id) {
        await supabase.from("points_transactions").insert({
          user_id: user.id,
          tenant_id: tenantId,
          amount: 5,
          source_type: "appreciation_sent",
          status: "credited",
          description: "Points for sending appreciation",
        });
      }
    },
    onSuccess: (_data, variables) => {
      toast.success(t("pulse.appreciationSent"));
      queryClient.invalidateQueries({ queryKey: ["appreciations-sent"] });
      queryClient.invalidateQueries({ queryKey: ["appreciations-received"] });
      queryClient.invalidateQueries({ queryKey: ["points-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["team-pulse"] });
      logAction.mutate({
        actionType: "appreciation_sent",
        source: "appreciation_widget",
        metadata: { category: variables.category },
      });
    },
    onError: (err: any) => {
      toast.error(err?.message || t("common.somethingWentWrong"));
    },
  });

  return {
    received,
    sent,
    receivedLoading,
    sentLoading,
    sendAppreciation,
    receivedCount: received.length,
    sentCount: sent.length,
  };
}
