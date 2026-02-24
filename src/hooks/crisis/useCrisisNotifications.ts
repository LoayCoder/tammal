import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { useEffect } from 'react';

export interface CrisisNotification {
  id: string;
  tenant_id: string;
  user_id: string;
  case_id: string | null;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
}

export function useCrisisNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['mh-crisis-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mh_crisis_notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return (data || []) as CrisisNotification[];
    },
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('mh_crisis_notifications')
        .update({ is_read: true } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-crisis-notifications'] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('mh_crisis_notifications')
        .update({ is_read: true } as any)
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

  return { notifications, unreadCount, isLoading, markAsRead, markAllAsRead };
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
  await supabase.from('mh_crisis_notifications').insert({
    tenant_id: data.tenant_id,
    user_id: data.user_id,
    case_id: data.case_id || null,
    type: data.type,
    title: data.title,
    body: data.body || null,
  } as any);
}
