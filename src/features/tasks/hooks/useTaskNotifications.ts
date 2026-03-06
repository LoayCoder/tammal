import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { useTenantId } from '@/hooks/org/useTenantId';
import { usePushNotifications } from '@/hooks/ui/usePushNotifications';
import { useEffect } from 'react';

export interface TaskNotification {
  id: string;
  tenant_id: string;
  recipient_id: string;
  task_id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
  deleted_at: string | null;
}

export function useTaskNotifications() {
  const { employee } = useCurrentEmployee();
  const { tenantId } = useTenantId();
  const queryClient = useQueryClient();
  const { isGranted, sendServiceWorkerNotification, sendNotification } = usePushNotifications();

  const query = useQuery({
    queryKey: ['task-notifications', employee?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_notifications')
        .select('*')
        .eq('tenant_id', tenantId!)
        .eq('recipient_id', employee!.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as TaskNotification[];
    },
    enabled: !!employee?.id && !!tenantId,
  });

  // Realtime subscription + push notification bridge
  useEffect(() => {
    if (!employee?.id) return;

    const channel = supabase
      .channel('task-notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'task_notifications',
          filter: `recipient_id=eq.${employee.id}`,
        },
        (payload) => {
          queryClient.invalidateQueries({ queryKey: ['task-notifications'] });

          // Bridge to browser push notification if permission granted
          if (isGranted && payload.new) {
            const n = payload.new as TaskNotification;
            const opts: NotificationOptions = {
              body: n.body ?? undefined,
              tag: `task-${n.task_id}`,
              data: { taskId: n.task_id },
            };
            // Prefer SW notification (works in background), fall back to basic
            sendServiceWorkerNotification(n.title, opts).catch(() => {
              sendNotification(n.title, opts);
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [employee?.id, queryClient, isGranted, sendServiceWorkerNotification, sendNotification]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('task_notifications')
        .update({ is_read: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-notifications'] });
    },
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('task_notifications')
        .update({ is_read: true })
        .eq('recipient_id', employee!.id)
        .eq('is_read', false)
        .is('deleted_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task-notifications'] });
    },
  });

  const notifications = query.data ?? [];
  const unreadCount = notifications.filter(n => !n.is_read).length;

  return {
    notifications,
    unreadCount,
    isPending: query.isPending,
    markRead: markRead.mutate,
    markAllRead: markAllRead.mutate,
  };
}
