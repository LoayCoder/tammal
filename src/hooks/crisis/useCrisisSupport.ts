import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { createCrisisNotification } from './useCrisisNotifications';
import type { TableRow, TableInsert, TableUpdate } from '@/lib/supabase-types';
import type { Json } from '@/integrations/supabase/types';

// ─── Types ───────────────────────────────────────────────────────────
export interface FirstAider {
  id: string;
  tenant_id: string;
  user_id: string;
  display_name: string;
  department: string | null;
  role_title: string | null;
  languages: string[] | null;
  bio: string | null;
  contact_modes: { chat?: boolean; call?: boolean; meeting?: boolean };
  max_active_cases: number;
  is_active: boolean;
  allow_anonymous_requests: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface FirstAiderSchedule {
  id: string;
  tenant_id: string;
  first_aider_id: string;
  timezone: string;
  weekly_rules: Record<string, { from: string; to: string }[]>;
  response_sla_minutes: number;
  is_enabled: boolean;
  temp_unavailable: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrisisCase {
  id: string;
  tenant_id: string;
  requester_user_id: string;
  assigned_first_aider_id: string | null;
  intent: string;
  risk_level: string;
  status: string;
  anonymity_mode: string;
  summary: string | null;
  reroute_count: number;
  created_at: string;
  accepted_at: string | null;
  first_response_at: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  matched_at: string | null;
  urgency_level: number | null;
  preferred_contact_method: string | null;
  scheduled_session_id: string | null;
}

export interface CrisisMessage {
  id: string;
  case_id: string;
  tenant_id: string;
  sender_user_id: string;
  message: string;
  created_at: string;
  read_at: string | null;
}

export interface EmergencyContact {
  id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  phone: string | null;
  country: string;
  available_24_7: boolean;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ─── Helpers ─────────────────────────────────────────────────────────
export function mapIntentToRisk(intent: string): string {
  const high = ['self_harm', 'unsafe'];
  const low = ['talk'];
  if (high.includes(intent)) return 'high';
  if (low.includes(intent)) return 'low';
  return 'moderate';
}

function computeFirstAiderStatus(schedule: FirstAiderSchedule | null): { statusLabel: string; isAvailable: boolean } {
  if (!schedule || !schedule.is_enabled) return { statusLabel: 'offline', isAvailable: false };
  if (schedule.temp_unavailable) return { statusLabel: 'temporarily_unavailable', isAvailable: false };

  const now = new Date();
  const dayName = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][now.getDay()];
  const rules = schedule.weekly_rules?.[dayName] || [];
  const nowMinutes = now.getHours() * 60 + now.getMinutes();

  for (const slot of rules) {
    const [fh, fm] = slot.from.split(':').map(Number);
    const [th, tm] = slot.to.split(':').map(Number);
    if (nowMinutes >= fh * 60 + fm && nowMinutes <= th * 60 + tm) {
      return { statusLabel: 'available', isAvailable: true };
    }
  }
  return { statusLabel: 'outside_hours', isAvailable: false };
}

// ─── Hook: First Aiders ──────────────────────────────────────────────
export function useFirstAiders(tenantId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: firstAiders = [], isPending } = useQuery({
    queryKey: ['mh-first-aiders', tenantId],
    queryFn: async () => {
      let query = supabase.from('mh_first_aiders').select('*').is('deleted_at', null).order('display_name');
      if (tenantId) query = query.eq('tenant_id', tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FirstAider[];
    },
    enabled: !!user?.id,
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['mh-first-aider-schedules', tenantId],
    queryFn: async () => {
      let query = supabase.from('mh_first_aider_schedule').select('*');
      if (tenantId) query = query.eq('tenant_id', tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as FirstAiderSchedule[];
    },
    enabled: !!user?.id,
  });

  const firstAidersWithStatus = firstAiders.map(fa => {
    const schedule = schedules.find(s => s.first_aider_id === fa.id) || null;
    const statusInfo = computeFirstAiderStatus(schedule);
    return { ...fa, schedule, ...statusInfo };
  });

  const createFirstAider = useMutation({
    mutationFn: async (data: Partial<FirstAider>) => {
      const insert = data as TableInsert<'mh_first_aiders'>;
      const { data: result, error } = await supabase.from('mh_first_aiders').insert(insert).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-first-aiders'] }),
  });

  const updateFirstAider = useMutation({
    mutationFn: async ({ id, ...data }: Partial<FirstAider> & { id: string }) => {
      const update = data as TableUpdate<'mh_first_aiders'>;
      const { error } = await supabase.from('mh_first_aiders').update(update).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-first-aiders'] }),
  });

  const deleteFirstAider = useMutation({
    mutationFn: async (id: string) => {
      const update: TableUpdate<'mh_first_aiders'> = { deleted_at: new Date().toISOString() };
      const { error } = await supabase.from('mh_first_aiders').update(update).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-first-aiders'] }),
  });

  return { firstAiders: firstAidersWithStatus, schedules, isPending, createFirstAider, updateFirstAider, deleteFirstAider };
}

// ─── Hook: Schedules ─────────────────────────────────────────────────
export function useFirstAiderSchedule(firstAiderId?: string) {
  const queryClient = useQueryClient();

  const { data: schedule, isPending } = useQuery({
    queryKey: ['mh-schedule', firstAiderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mh_first_aider_schedule')
        .select('*')
        .eq('first_aider_id', firstAiderId!)
        .maybeSingle();
      if (error) throw error;
      return data as FirstAiderSchedule | null;
    },
    enabled: !!firstAiderId,
  });

  const upsertSchedule = useMutation({
    mutationFn: async (data: Partial<FirstAiderSchedule> & { first_aider_id: string; tenant_id: string }) => {
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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mh-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['mh-first-aider-schedules'] });
    },
  });

  return { schedule, isPending, upsertSchedule };
}

// ─── Hook: Emergency Contacts ────────────────────────────────────────
export function useEmergencyContacts(tenantId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: contacts = [], isPending } = useQuery({
    queryKey: ['mh-emergency-contacts', tenantId],
    queryFn: async () => {
      let query = supabase.from('mh_emergency_contacts').select('*').is('deleted_at', null).order('sort_order');
      if (tenantId) query = query.eq('tenant_id', tenantId);
      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as EmergencyContact[];
    },
    enabled: !!user?.id,
  });

  const createContact = useMutation({
    mutationFn: async (data: Partial<EmergencyContact>) => {
      const insert = data as TableInsert<'mh_emergency_contacts'>;
      const { error } = await supabase.from('mh_emergency_contacts').insert(insert);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-emergency-contacts'] }),
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...data }: Partial<EmergencyContact> & { id: string }) => {
      const update = data as TableUpdate<'mh_emergency_contacts'>;
      const { error } = await supabase.from('mh_emergency_contacts').update(update).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-emergency-contacts'] }),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const update: TableUpdate<'mh_emergency_contacts'> = { deleted_at: new Date().toISOString() };
      const { error } = await supabase.from('mh_emergency_contacts').update(update).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-emergency-contacts'] }),
  });

  return { contacts, isPending, createContact, updateContact, deleteContact };
}

// ─── Hook: Crisis Cases ──────────────────────────────────────────────
export function useCrisisCases(options?: { role?: 'requester' | 'first_aider' | 'admin' }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cases = [], isPending } = useQuery({
    queryKey: ['mh-crisis-cases', user?.id, options?.role],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mh_crisis_cases')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data || []) as CrisisCase[];
    },
    enabled: !!user?.id,
  });

  const createCase = useMutation({
    mutationFn: async (data: { tenant_id: string; intent: string; anonymity_mode: string; summary?: string; urgency_level?: number; preferred_contact_method?: string }) => {
      const risk_level = mapIntentToRisk(data.intent);
      const status = risk_level === 'high' ? 'escalated' : 'pending_assignment';

      const insert: TableInsert<'mh_crisis_cases'> = {
        tenant_id: data.tenant_id,
        requester_user_id: user!.id,
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

      // If high risk, create escalation record
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
        // Auto-assign to best available first aider
        const { data: assignedId } = await supabase.rpc('auto_assign_crisis_case', {
          p_case_id: result.id,
          p_tenant_id: data.tenant_id,
        });

        // Notify assigned first aider
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
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-crisis-cases'] }),
  });

  interface CaseStatusUpdate {
    id: string;
    status: string;
    assigned_first_aider_id?: string | null;
    [key: string]: unknown;
  }

  const updateCaseStatus = useMutation({
    mutationFn: async ({ id, status, ...extra }: CaseStatusUpdate) => {
      const updateData: TableUpdate<'mh_crisis_cases'> = { status, ...extra };
      if (status === 'active') updateData.accepted_at = new Date().toISOString();
      if (status === 'resolved') updateData.resolved_at = new Date().toISOString();
      if (status === 'closed') updateData.closed_at = new Date().toISOString();

      const { error } = await supabase.from('mh_crisis_cases').update(updateData).eq('id', id);
      if (error) throw error;

      // Fetch the case for notification context
      const { data: caseData } = await supabase.from('mh_crisis_cases').select('*').eq('id', id).single();
      if (!caseData) return;

      // Send notification based on status change
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
        // Declined — re-assign automatically
        const { data: newAiderId } = await supabase.rpc('auto_assign_crisis_case', {
          p_case_id: id,
          p_tenant_id: caseData.tenant_id,
        });
        // Increment reroute count
        const rerouteUpdate: TableUpdate<'mh_crisis_cases'> = { reroute_count: (caseData.reroute_count || 0) + 1 };
        await supabase.from('mh_crisis_cases').update(rerouteUpdate).eq('id', id);

        // Log decline as escalation
        const escInsert: TableInsert<'mh_crisis_escalations'> = {
          tenant_id: caseData.tenant_id,
          case_id: id,
          escalation_type: 'declined',
          triggered_by: 'first_aider',
          notes: 'First aider declined the case',
        };
        await supabase.from('mh_crisis_escalations').insert(escInsert);

        // Notify new aider
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
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-crisis-cases'] }),
  });

  return { cases, isPending, createCase, updateCaseStatus };
}

// ─── Hook: Crisis Messages ───────────────────────────────────────────
export function useCrisisMessages(caseId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isPending } = useQuery({
    queryKey: ['mh-crisis-messages', caseId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mh_crisis_messages')
        .select('*')
        .eq('case_id', caseId!)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as CrisisMessage[];
    },
    enabled: !!caseId && !!user?.id,
    refetchInterval: 5000,
  });

  const sendMessage = useMutation({
    mutationFn: async (data: { case_id: string; tenant_id: string; message: string }) => {
      const insert: TableInsert<'mh_crisis_messages'> = {
        case_id: data.case_id,
        tenant_id: data.tenant_id,
        sender_user_id: user!.id,
        message: data.message,
      };
      const { error } = await supabase.from('mh_crisis_messages').insert(insert);
      if (error) throw error;

      // Notify the other party
      const { data: caseData } = await supabase.from('mh_crisis_cases').select('requester_user_id, assigned_first_aider_id, tenant_id').eq('id', data.case_id).single();
      if (caseData) {
        const isRequester = caseData.requester_user_id === user!.id;
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

        // Update first_response_at if first aider sends first message
        if (!isRequester) {
          const update: TableUpdate<'mh_crisis_cases'> = { first_response_at: new Date().toISOString() };
          await supabase.from('mh_crisis_cases')
            .update(update)
            .eq('id', data.case_id)
            .is('first_response_at', null);
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-crisis-messages', caseId] }),
  });

  return { messages, isPending, sendMessage };
}

// ─── Hook: Is current user a first aider? ────────────────────────────
export function useIsFirstAider() {
  const { user } = useAuth();

  const { data: firstAiderId, isPending } = useQuery({
    queryKey: ['is-first-aider', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mh_first_aiders')
        .select('id')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .is('deleted_at', null)
        .maybeSingle();
      if (error) throw error;
      return data?.id || null;
    },
    enabled: !!user?.id,
  });

  return { isFirstAider: !!firstAiderId, firstAiderId, isPending };
}
