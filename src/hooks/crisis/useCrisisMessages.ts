import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { createCrisisNotification } from './useCrisisNotifications';
import type { TableInsert, TableUpdate } from '@/lib/supabase-types';
import type { CrisisMessage } from './types';

export function useCrisisMessages(caseId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: messages = [], isPending } = useQuery({
    queryKey: ['mh-crisis-messages', caseId],
    queryFn: async () => {
      const { data, error } = await supabase.from('mh_crisis_messages').select('*').eq('case_id', caseId!).order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as CrisisMessage[];
    },
    enabled: !!caseId && !!user?.id,
    refetchInterval: 5000,
  });

  const sendMessage = useMutation({
    mutationFn: async (data: { case_id: string; tenant_id: string; message: string }) => {
      const { error } = await supabase.from('mh_crisis_messages').insert({ case_id: data.case_id, tenant_id: data.tenant_id, sender_user_id: user!.id, message: data.message } as TableInsert<'mh_crisis_messages'>);
      if (error) throw error;
      const { data: caseData } = await supabase.from('mh_crisis_cases').select('requester_user_id, assigned_first_aider_id, tenant_id').eq('id', data.case_id).single();
      if (!caseData) return;
      const isRequester = caseData.requester_user_id === user!.id;
      let recipientUserId: string | null = null;
      if (isRequester && caseData.assigned_first_aider_id) {
        const { data: fa } = await supabase.from('mh_first_aiders').select('user_id').eq('id', caseData.assigned_first_aider_id).single();
        recipientUserId = fa?.user_id || null;
      } else if (!isRequester) recipientUserId = caseData.requester_user_id;
      if (recipientUserId) await createCrisisNotification({ tenant_id: caseData.tenant_id, user_id: recipientUserId, case_id: data.case_id, type: 'new_message', title: 'New message', body: data.message.substring(0, 100) });
      if (!isRequester) await supabase.from('mh_crisis_cases').update({ first_response_at: new Date().toISOString() } as TableUpdate<'mh_crisis_cases'>).eq('id', data.case_id).is('first_response_at', null);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-crisis-messages', caseId] }),
  });

  return { messages, isPending, sendMessage };
}