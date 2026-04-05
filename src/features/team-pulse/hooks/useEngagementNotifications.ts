import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentEmployee } from "@/hooks/auth/useCurrentEmployee";
import { useTenantId } from "@/hooks/org/useTenantId";

export interface EngagementNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  action_path: string | null;
  metadata: Record<string, unknown> | null;
}

export function useEngagementNotifications() {
  const { employee } = useCurrentEmployee();
  const { tenantId } = useTenantId();
  const queryClient = useQueryClient();
  const employeeId = employee?.id;

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["engagement-notifications", tenantId, employeeId],
    enabled: !!employeeId && !!tenantId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("engagement_notifications")
        .select("id, type, title, body, is_read, created_at, action_path, metadata")
        .eq("tenant_id", tenantId!)
        .eq("recipient_id", employeeId!)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data ?? []) as unknown as EngagementNotification[];
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!employeeId) return;

    const channel = supabase
      .channel("engagement-notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "engagement_notifications",
          filter: `recipient_id=eq.${employeeId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["engagement-notifications", tenantId, employeeId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employeeId, tenantId, queryClient]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications]
  );

  const markAsRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from("engagement_notifications")
        .update({ is_read: true })
        .eq("id", notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-notifications", tenantId, employeeId] });
    },
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
      if (unreadIds.length === 0) return;
      const { error } = await supabase
        .from("engagement_notifications")
        .update({ is_read: true })
        .in("id", unreadIds);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["engagement-notifications", tenantId, employeeId] });
    },
  });

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead };
}
