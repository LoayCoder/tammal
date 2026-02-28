import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { useEffect } from 'react';
import type { TableRow, TableInsert, TableUpdate } from '@/lib/supabase-types';

export type CrisisNotification = TableRow<'mh_crisis_notifications'>;

export function useCrisisNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isPending } = useQuery({
    queryKey: ['mh-crisis-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mh_crisis_notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const update: TableUpdate<'mh_crisis_notifications'> = { is_read: true };
      const { error } = await supabase
        .from('mh_crisis_notifications')
        .update(update)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-crisis-notifications'] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const update: TableUpdate<'mh_crisis_notifications'> = { is_read: true };
      const { error } = await supabase
        .from('mh_crisis_notifications')
        .update(update)
        .eq('user_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-crisis-notifications'] }),
  });

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('crisis-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'mh_crisis_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['mh-crisis-notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return { notifications, unreadCount, isPending, markAsRead, markAllAsRead };
}

// Helper to create a notification (used in hooks/pages after mutations)
export async function createCrisisNotification(data: {
  tenant_id: string;
  user_id: string;
  case_id?: string;
  type: string;
  title: string;
  body?: string;
}) {
  const insert: TableInsert<'mh_crisis_notifications'> = {
    tenant_id: data.tenant_id,
    user_id: data.user_id,
    case_id: data.case_id || null,
    type: data.type,
    title: data.title,
    body: data.body || null,
  };
  await supabase.from('mh_crisis_notifications').insert(insert);
}
