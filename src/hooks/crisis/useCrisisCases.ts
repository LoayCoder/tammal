import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { createCrisisNotification } from './useCrisisNotifications';
import type { TableInsert, TableUpdate } from '@/lib/supabase-types';
import { mapIntentToRisk } from './helpers';
import type { CrisisCase } from './types';

export function useCrisisCases(options?: { role?: 'requester' | 'first_aider' | 'admin' }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: cases = [], isPending } = useQuery({
    queryKey: ['mh-crisis-cases', user?.id, options?.role],
    queryFn: async () => {
      const { data, error } = await supabase.from('mh_crisis_cases').select('*').order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      return (data || []) as CrisisCase[];
    },
    enabled: !!user?.id,
  });

  const createCase = useMutation({
    mutationFn: async (data: { tenant_id: string; intent: string; anonymity_mode: string; summary?: string; urgency_level?: number; preferred_contact_method?: string }) => {
      const risk_level = mapIntentToRisk(data.intent);
      const insert: TableInsert<'mh_crisis_cases'> = {
        tenant_id: data.tenant_id, requester_user_id: user!.id, intent: data.intent, risk_level,
        status: risk_level === 'high' ? 'escalated' : 'pending_assignment', anonymity_mode: data.anonymity_mode,
        summary: data.summary || null, urgency_level: data.urgency_level || 3, preferred_contact_method: data.preferred_contact_method || 'chat',
      };
      const { data: result, error } = await supabase.from('mh_crisis_cases').insert(insert).select().single();
      if (error) throw error;
      if (risk_level === 'high') {
        await supabase.from('mh_crisis_escalations').insert({ tenant_id: data.tenant_id, case_id: result.id, escalation_type: 'emergency_contacts_shown', triggered_by: 'system', notes: `High-risk intent: ${data.intent}` } as TableInsert<'mh_crisis_escalations'>);
      } else {
        const { data: assignedId } = await supabase.rpc('auto_assign_crisis_case', { p_case_id: result.id, p_tenant_id: data.tenant_id });
        if (assignedId) {
          const { data: fa } = await supabase.from('mh_first_aiders').select('user_id').eq('id', assignedId).single();
          if (fa?.user_id) await createCrisisNotification({ tenant_id: data.tenant_id, user_id: fa.user_id, case_id: result.id, type: 'case_assigned', title: 'New support case assigned', body: `A new ${data.intent.replace('_', ' ')} support request needs your attention.` });
        }
      }
      return result as CrisisCase;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-crisis-cases'] }),
  });

  const updateCaseStatus = useMutation({
    mutationFn: async ({ id, status, ...extra }: { id: string; status: string; assigned_first_aider_id?: string | null; [key: string]: unknown }) => {
      const updateData: TableUpdate<'mh_crisis_cases'> = { status, ...extra };
      if (status === 'active') updateData.accepted_at = new Date().toISOString();
      if (status === 'resolved') updateData.resolved_at = new Date().toISOString();
      if (status === 'closed') updateData.closed_at = new Date().toISOString();
      const { error } = await supabase.from('mh_crisis_cases').update(updateData).eq('id', id);
      if (error) throw error;
      const { data: caseData } = await supabase.from('mh_crisis_cases').select('*').eq('id', id).single();
      if (!caseData) return;
      if (status === 'active') await createCrisisNotification({ tenant_id: caseData.tenant_id, user_id: caseData.requester_user_id, case_id: id, type: 'case_accepted', title: 'Support request accepted', body: 'A first aider has accepted your request and will respond shortly.' });
      else if (status === 'resolved') await createCrisisNotification({ tenant_id: caseData.tenant_id, user_id: caseData.requester_user_id, case_id: id, type: 'case_resolved', title: 'Support case resolved', body: 'Your support case has been marked as resolved.' });
      else if (status === 'pending_assignment' && extra.assigned_first_aider_id === null) {
        const { data: newAiderId } = await supabase.rpc('auto_assign_crisis_case', { p_case_id: id, p_tenant_id: caseData.tenant_id });
        await supabase.from('mh_crisis_cases').update({ reroute_count: (caseData.reroute_count || 0) + 1 } as TableUpdate<'mh_crisis_cases'>).eq('id', id);
        await supabase.from('mh_crisis_escalations').insert({ tenant_id: caseData.tenant_id, case_id: id, escalation_type: 'declined', triggered_by: 'first_aider', notes: 'First aider declined the case' } as TableInsert<'mh_crisis_escalations'>);
        if (newAiderId) {
          const { data: fa } = await supabase.from('mh_first_aiders').select('user_id').eq('id', newAiderId).single();
          if (fa?.user_id) await createCrisisNotification({ tenant_id: caseData.tenant_id, user_id: fa.user_id, case_id: id, type: 'case_assigned', title: 'New support case assigned', body: 'A rerouted support request needs your attention.' });
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-crisis-cases'] }),
  });

  return { cases, isPending, createCase, updateCaseStatus };
}