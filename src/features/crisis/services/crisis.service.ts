import { supabase } from '@/integrations/supabase/client';
import type { TableRow, TableInsert, TableUpdate } from '@/shared/utils/supabase-types';
import type { FirstAider, FirstAiderSchedule, CrisisCase, EmergencyContact, CrisisMessage } from '../types';
import { createCrisisNotification } from '../hooks/crisis/useCrisisNotifications'; // We need to move this later, or adjust imports. Wait, creating notifications inside services is okay if imported right. Let's fix imports next.

export function mapIntentToRisk(intent: string): string {
  const high = ['self_harm', 'unsafe'];
  const low = ['talk'];
  if (high.includes(intent)) return 'high';
  if (low.includes(intent)) return 'low';
  return 'moderate';
}

export async function fetchFirstAiders(tenantId?: string): Promise<FirstAider[]> {
  let query = supabase.from('mh_first_aiders').select('*').is('deleted_at', null).order('display_name');
  if (tenantId) query = query.eq('tenant_id', tenantId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as FirstAider[];
}

export async function fetchFirstAiderSchedules(tenantId?: string): Promise<FirstAiderSchedule[]> {
  let query = supabase.from('mh_first_aider_schedule').select('*');
  if (tenantId) query = query.eq('tenant_id', tenantId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as FirstAiderSchedule[];
}

export async function createFirstAider(data: Partial<FirstAider>): Promise<FirstAider> {
  const insert = data as TableInsert<'mh_first_aiders'>;
  const { data: result, error } = await supabase.from('mh_first_aiders').insert(insert).select().single();
  if (error) throw error;
  return result as FirstAider;
}

export async function updateFirstAider(id: string, data: Partial<FirstAider>): Promise<void> {
  const update = data as TableUpdate<'mh_first_aiders'>;
  const { error } = await supabase.from('mh_first_aiders').update(update).eq('id', id);
  if (error) throw error;
}

export async function deleteFirstAider(id: string): Promise<void> {
  const update: TableUpdate<'mh_first_aiders'> = { deleted_at: new Date().toISOString() };
  const { error } = await supabase.from('mh_first_aiders').update(update).eq('id', id);
  if (error) throw error;
}

export async function fetchFirstAiderScheduleByFaId(firstAiderId: string): Promise<FirstAiderSchedule | null> {
  const { data, error } = await supabase
    .from('mh_first_aider_schedule')
    .select('*')
    .eq('first_aider_id', firstAiderId)
    .maybeSingle();
  if (error) throw error;
  return data as FirstAiderSchedule | null;
}

export async function upsertFirstAiderSchedule(data: Partial<FirstAiderSchedule> & { first_aider_id: string; tenant_id: string }): Promise<void> {
  const { data: existing } = await supabase
    .from('mh_first_aider_schedule')
    .select('id')
    .eq('first_aider_id', data.first_aider_id)
    .maybeSingle();

  if (existing) {
    const update = data as TableUpdate<'mh_first_aider_schedule'>;
    const { error } = await supabase.from('mh_first_aider_schedule').update(update).eq('id', existing.id);
    if (error) throw error;
  } else {
    const insert = data as TableInsert<'mh_first_aider_schedule'>;
    const { error } = await supabase.from('mh_first_aider_schedule').insert(insert);
    if (error) throw error;
  }
}

export async function fetchEmergencyContacts(tenantId?: string): Promise<EmergencyContact[]> {
  let query = supabase.from('mh_emergency_contacts').select('*').is('deleted_at', null).order('sort_order');
  if (tenantId) query = query.eq('tenant_id', tenantId);
  const { data, error } = await query;
  if (error) throw error;
  return (data || []) as EmergencyContact[];
}

export async function createEmergencyContact(data: Partial<EmergencyContact>): Promise<void> {
  const insert = data as TableInsert<'mh_emergency_contacts'>;
  const { error } = await supabase.from('mh_emergency_contacts').insert(insert);
  if (error) throw error;
}

export async function updateEmergencyContact(id: string, data: Partial<EmergencyContact>): Promise<void> {
  const update = data as TableUpdate<'mh_emergency_contacts'>;
  const { error } = await supabase.from('mh_emergency_contacts').update(update).eq('id', id);
  if (error) throw error;
}

export async function deleteEmergencyContact(id: string): Promise<void> {
  const update: TableUpdate<'mh_emergency_contacts'> = { deleted_at: new Date().toISOString() };
  const { error } = await supabase.from('mh_emergency_contacts').update(update).eq('id', id);
  if (error) throw error;
}

export async function fetchCrisisCases(limit: number = 100): Promise<CrisisCase[]> {
  const { data, error } = await supabase
    .from('mh_crisis_cases')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data || []) as CrisisCase[];
}

export async function createCrisisCase(
  data: { tenant_id: string; intent: string; anonymity_mode: string; summary?: string; urgency_level?: number; preferred_contact_method?: string },
  userId: string
): Promise<CrisisCase> {
  const risk_level = mapIntentToRisk(data.intent);
  const status = risk_level === 'high' ? 'escalated' : 'pending_assignment';

  const insert: TableInsert<'mh_crisis_cases'> = {
    tenant_id: data.tenant_id,
    requester_user_id: userId,
    intent: data.intent,
    risk_level,
    status,
    anonymity_mode: data.anonymity_mode,
    summary: data.summary || null,
    urgency_level: data.urgency_level || 3,
    preferred_contact_method: data.preferred_contact_method || 'chat',
  };

  const { data: result, error } = await supabase
    .from('mh_crisis_cases')
    .insert(insert)
    .select()
    .single();
  if (error) throw error;

  if (risk_level === 'high') {
    const escInsert: TableInsert<'mh_crisis_escalations'> = {
      tenant_id: data.tenant_id,
      case_id: result.id,
      escalation_type: 'emergency_contacts_shown',
      triggered_by: 'system',
      notes: `High-risk intent: ${data.intent}`,
    };
    await supabase.from('mh_crisis_escalations').insert(escInsert);
  } else {
    const { data: assignedId } = await supabase.rpc('auto_assign_crisis_case', {
      p_case_id: result.id,
      p_tenant_id: data.tenant_id,
    });

    if (assignedId) {
      const { data: fa } = await supabase
        .from('mh_first_aiders')
        .select('user_id')
        .eq('id', assignedId)
        .single();
      if (fa?.user_id) {
        await createCrisisNotification({
          tenant_id: data.tenant_id,
          user_id: fa.user_id,
          case_id: result.id,
          type: 'case_assigned',
          title: 'New support case assigned',
          body: `A new ${data.intent.replace('_', ' ')} support request needs your attention.`,
        });
      }
    }
  }

  return result as CrisisCase;
}

export async function updateCrisisCaseStatus(
  id: string,
  status: string,
  extra: Record<string, unknown>
): Promise<void> {
  const updateData: TableUpdate<'mh_crisis_cases'> = { status, ...extra };
  if (status === 'active') updateData.accepted_at = new Date().toISOString();
  if (status === 'resolved') updateData.resolved_at = new Date().toISOString();
  if (status === 'closed') updateData.closed_at = new Date().toISOString();

  const { error } = await supabase.from('mh_crisis_cases').update(updateData).eq('id', id);
  if (error) throw error;

  const { data: caseData } = await supabase.from('mh_crisis_cases').select('*').eq('id', id).single();
  if (!caseData) return;

  if (status === 'active') {
    await createCrisisNotification({
      tenant_id: caseData.tenant_id,
      user_id: caseData.requester_user_id,
      case_id: id,
      type: 'case_accepted',
      title: 'Support request accepted',
      body: 'A first aider has accepted your request and will respond shortly.',
    });
  } else if (status === 'resolved') {
    await createCrisisNotification({
      tenant_id: caseData.tenant_id,
      user_id: caseData.requester_user_id,
      case_id: id,
      type: 'case_resolved',
      title: 'Support case resolved',
      body: 'Your support case has been marked as resolved.',
    });
  } else if (status === 'pending_assignment' && extra.assigned_first_aider_id === null) {
    const { data: newAiderId } = await supabase.rpc('auto_assign_crisis_case', {
      p_case_id: id,
      p_tenant_id: caseData.tenant_id,
    });

    const rerouteUpdate: TableUpdate<'mh_crisis_cases'> = { reroute_count: (caseData.reroute_count || 0) + 1 };
    await supabase.from('mh_crisis_cases').update(rerouteUpdate).eq('id', id);

    const escInsert: TableInsert<'mh_crisis_escalations'> = {
      tenant_id: caseData.tenant_id,
      case_id: id,
      escalation_type: 'declined',
      triggered_by: 'first_aider',
      notes: 'First aider declined the case',
    };
    await supabase.from('mh_crisis_escalations').insert(escInsert);

    if (newAiderId) {
      const { data: fa } = await supabase.from('mh_first_aiders').select('user_id').eq('id', newAiderId).single();
      if (fa?.user_id) {
        await createCrisisNotification({
          tenant_id: caseData.tenant_id,
          user_id: fa.user_id,
          case_id: id,
          type: 'case_assigned',
          title: 'New support case assigned',
          body: 'A rerouted support request needs your attention.',
        });
      }
    }
  }
}

export async function fetchCrisisMessages(caseId: string): Promise<CrisisMessage[]> {
  const { data, error } = await supabase
    .from('mh_crisis_messages')
    .select('*')
    .eq('case_id', caseId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data || []) as CrisisMessage[];
}

export async function sendCrisisMessage(
  data: { case_id: string; tenant_id: string; message: string },
  userId: string
): Promise<void> {
  const insert: TableInsert<'mh_crisis_messages'> = {
    case_id: data.case_id,
    tenant_id: data.tenant_id,
    sender_user_id: userId,
    message: data.message,
  };
  const { error } = await supabase.from('mh_crisis_messages').insert(insert);
  if (error) throw error;

  const { data: caseData } = await supabase
    .from('mh_crisis_cases')
    .select('requester_user_id, assigned_first_aider_id, tenant_id')
    .eq('id', data.case_id)
    .single();

  if (caseData) {
    const isRequester = caseData.requester_user_id === userId;
    let recipientUserId: string | null = null;

    if (isRequester && caseData.assigned_first_aider_id) {
      const { data: fa } = await supabase.from('mh_first_aiders').select('user_id').eq('id', caseData.assigned_first_aider_id).single();
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

    if (!isRequester) {
      const update: TableUpdate<'mh_crisis_cases'> = { first_response_at: new Date().toISOString() };
      await supabase.from('mh_crisis_cases')
        .update(update)
        .eq('id', data.case_id)
        .is('first_response_at', null);
    }
  }
}

export async function checkIsFirstAider(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('mh_first_aiders')
    .select('id')
    .eq('user_id', userId)
    .eq('is_active', true)
    .is('deleted_at', null)
    .maybeSingle();
  if (error) throw error;
  return data?.id || null;
}
