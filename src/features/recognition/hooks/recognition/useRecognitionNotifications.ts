import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/hooks/auth/useAuth';
import { useEffect } from 'react';

export interface RecognitionNotification {
  id: string;
  tenant_id: string;
  user_id: string;
  nomination_id: string | null;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  deleted_at: string | null;
}

export function useRecognitionNotifications() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifications = [], isPending } = useQuery({
    queryKey: ['recognition-notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('recognition_notifications')
        .select('*')
        .eq('user_id', user!.id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as unknown as RecognitionNotification[];
    },
    enabled: !!user?.id,
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('recognition_notifications')
        .update({ is_read: true } as any)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recognition-notifications'] }),
  });

  const markAllAsRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('recognition_notifications')
        .update({ is_read: true } as any)
        .eq('user_id', user!.id)
        .eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['recognition-notifications'] }),
  });

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('recognition-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'recognition_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['recognition-notifications'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  return { notifications, unreadCount, isPending, markAsRead, markAllAsRead };
}

