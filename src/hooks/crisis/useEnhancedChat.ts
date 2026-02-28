import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { createCrisisNotification } from './useCrisisNotifications';
import type { TableRow, TableInsert, TableUpdate } from '@/lib/supabase-types';
import type { Json } from '@/integrations/supabase/types';

// ─── Types ───────────────────────────────────────────────────────────
export type EnhancedMessage = TableRow<'mh_crisis_messages'>;

export interface TypingState {
  userId: string;
  isTyping: boolean;
}

// ─── Hook ────────────────────────────────────────────────────────────
export function useEnhancedChat(caseId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const presenceChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Fetch messages ─────────────────────────────────────────────────
  const { data: messages = [], isPending } = useQuery({
    queryKey: ['mh-enhanced-messages', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mh_crisis_messages')
        .select('*')
        .eq('case_id', caseId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!caseId && !!user?.id,
  });

  // ── Realtime subscription ──────────────────────────────────────────
  useEffect(() => {
    if (!caseId || !user?.id) return;

    const channel = supabase
      .channel(`crisis-chat-${caseId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mh_crisis_messages',
          filter: `case_id=eq.${caseId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['mh-enhanced-messages', caseId] });
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [caseId, user?.id, queryClient]);

  // ── Presence channel for typing indicators ─────────────────────────
  useEffect(() => {
    if (!caseId || !user?.id) return;

    const presenceChannel = supabase
      .channel(`crisis-presence-${caseId}`)
      .on('broadcast', { event: 'typing' }, (payload) => {
        const senderId = payload.payload?.userId;
        if (!senderId || senderId === user.id) return;

        setTypingUsers(prev => {
          if (!prev.includes(senderId)) return [...prev, senderId];
          return prev;
        });

        // Clear typing after 3 seconds
        if (typingTimeoutRef.current[senderId]) {
          clearTimeout(typingTimeoutRef.current[senderId]);
        }
        typingTimeoutRef.current[senderId] = setTimeout(() => {
          setTypingUsers(prev => prev.filter(id => id !== senderId));
        }, 3000);
      })
      .subscribe();

    presenceChannelRef.current = presenceChannel;

    return () => {
      supabase.removeChannel(presenceChannel);
      Object.values(typingTimeoutRef.current).forEach(clearTimeout);
    };
  }, [caseId, user?.id]);

  // ── Broadcast typing ───────────────────────────────────────────────
  const broadcastTyping = useCallback(() => {
    if (!presenceChannelRef.current || !user?.id) return;
    presenceChannelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: user.id },
    });
  }, [user?.id]);

  // ── Send message ───────────────────────────────────────────────────
  const sendMessage = useMutation({
    mutationFn: async (data: {
      case_id: string;
      tenant_id: string;
      message: string;
      message_type?: string;
      reply_to_id?: string;
      attachments?: Json;
    }) => {
      const insert: TableInsert<'mh_crisis_messages'> = {
        case_id: data.case_id,
        tenant_id: data.tenant_id,
        sender_user_id: user!.id,
        message: data.message,
        message_type: data.message_type || 'text',
        reply_to_id: data.reply_to_id || null,
        attachments: data.attachments || null,
      };
      const { error } = await supabase.from('mh_crisis_messages').insert(insert);
      if (error) throw error;

      // Notify the other party
      const { data: caseData } = await supabase
        .from('mh_crisis_cases')
        .select('requester_user_id, assigned_first_aider_id, tenant_id')
        .eq('id', data.case_id)
        .single();

      if (caseData) {
        const isRequester = caseData.requester_user_id === user!.id;
        let recipientUserId: string | null = null;

        if (isRequester && caseData.assigned_first_aider_id) {
          const { data: fa } = await supabase
            .from('mh_first_aiders')
            .select('user_id')
            .eq('id', caseData.assigned_first_aider_id)
            .single();
          recipientUserId = fa?.user_id || null;
        } else if (!isRequester) {
          recipientUserId = caseData.requester_user_id;
        }

        if (recipientUserId) {
          await createCrisisNotification({
            tenant_id: caseData.tenant_id,
            user_id: recipientUserId,
            case_id: data.case_id,
            type: 'new_message',
            title: 'New message',
            body: data.message.substring(0, 100),
          });
        }

        // Update first_response_at if first aider sends first message
        if (!isRequester) {
          const update: TableUpdate<'mh_crisis_cases'> = { first_response_at: new Date().toISOString() };
          await supabase
            .from('mh_crisis_cases')
            .update(update)
            .eq('id', data.case_id)
            .is('first_response_at', null);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mh-enhanced-messages', caseId] });
    },
  });

  // ── Mark messages as read ──────────────────────────────────────────
  const markAsRead = useCallback(async () => {
    if (!caseId || !user?.id) return;
    const update: TableUpdate<'mh_crisis_messages'> = { read_at: new Date().toISOString() };
    await supabase
      .from('mh_crisis_messages')
      .update(update)
      .eq('case_id', caseId)
      .neq('sender_user_id', user.id)
      .is('read_at', null);
  }, [caseId, user?.id]);

  // ── Toggle reaction ────────────────────────────────────────────────
  const toggleReaction = useMutation({
    mutationFn: async ({ messageId, emoji }: { messageId: string; emoji: string }) => {
      const msg = messages.find(m => m.id === messageId);
      if (!msg) return;

      const reactions: Record<string, string[]> = (msg.reactions as Record<string, string[]>) || {};
      const users = reactions[emoji] || [];
      const userId = user!.id;

      if (users.includes(userId)) {
        reactions[emoji] = users.filter(u => u !== userId);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...users, userId];
      }

      const update: TableUpdate<'mh_crisis_messages'> = { reactions: reactions as unknown as Json };
      const { error } = await supabase
        .from('mh_crisis_messages')
        .update(update)
        .eq('id', messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mh-enhanced-messages', caseId] });
    },
  });

  return {
    messages,
    isPending,
    sendMessage,
    markAsRead,
    toggleReaction,
    broadcastTyping,
    typingUsers,
  };
}
