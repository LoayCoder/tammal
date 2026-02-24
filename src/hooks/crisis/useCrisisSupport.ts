import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { useCurrentEmployee } from '@/hooks/auth/useCurrentEmployee';
import { createCrisisNotification } from './useCrisisNotifications';

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
  first_aider?: FirstAider;
}

export interface CrisisMessage {
  id: string;
  tenant_id: string;
  case_id: string;
  sender_user_id: string;
  message: string;
  attachments: any;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  tenant_id: string;
  title: string;
  phone: string | null;
  description: string | null;
  available_24_7: boolean;
  country: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// ─── Risk mapping ────────────────────────────────────────────────────
export function mapIntentToRisk(intent: string): string {
  if (intent === 'self_harm' || intent === 'unsafe') return 'high';
  if (intent === 'talk') return 'low';
  return 'moderate'; // overwhelmed, anxiety, work_stress, other
}

// ─── Online status computation ───────────────────────────────────────
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

export function computeFirstAiderStatus(schedule: FirstAiderSchedule | null) {
  if (!schedule || !schedule.is_enabled || schedule.temp_unavailable) {
    return { status: 'offline' as const, nextAvailableAt: null, slaMinutes: schedule?.response_sla_minutes ?? 60 };
  }

  const now = new Date();
  // Simple timezone offset: we use the browser's time for simplicity
  const dayIdx = now.getDay(); // 0=sun
  const dayKey = DAY_KEYS[dayIdx];
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const todaySlots = (schedule.weekly_rules?.[dayKey] || []) as { from: string; to: string }[];
  const isOnlineNow = todaySlots.some(slot => currentTime >= slot.from && currentTime < slot.to);

  if (isOnlineNow) {
    return { status: 'online' as const, nextAvailableAt: null, slaMinutes: schedule.response_sla_minutes };
  }

  // Find next available slot
  for (let offset = 0; offset < 7; offset++) {
    const checkDayIdx = (dayIdx + offset) % 7;
    const checkKey = DAY_KEYS[checkDayIdx];
    const slots = (schedule.weekly_rules?.[checkKey] || []) as { from: string; to: string }[];
    for (const slot of slots) {
      if (offset === 0 && slot.from > currentTime) {
        // Later today
        const nextDate = new Date(now);
        const [h, m] = slot.from.split(':').map(Number);
        nextDate.setHours(h, m, 0, 0);
        return { status: 'offline' as const, nextAvailableAt: nextDate.toISOString(), slaMinutes: schedule.response_sla_minutes };
      }
      if (offset > 0 && slots.length > 0) {
        const nextDate = new Date(now);
        nextDate.setDate(nextDate.getDate() + offset);
        const [h, m] = slots[0].from.split(':').map(Number);
        nextDate.setHours(h, m, 0, 0);
        return { status: 'offline' as const, nextAvailableAt: nextDate.toISOString(), slaMinutes: schedule.response_sla_minutes };
      }
    }
  }

  return { status: 'offline' as const, nextAvailableAt: null, slaMinutes: schedule.response_sla_minutes };
}

// ─── Hook: First Aiders ──────────────────────────────────────────────
export function useFirstAiders(tenantId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: firstAiders = [], isLoading } = useQuery({
    queryKey: ['mh-first-aiders', tenantId],
    queryFn: async () => {
      let query = supabase
        .from('mh_first_aiders')
        .select('*')
        .is('deleted_at', null)
        .order('display_name');
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
      const { data: result, error } = await supabase.from('mh_first_aiders').insert(data as any).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-first-aiders'] }),
  });

  const updateFirstAider = useMutation({
    mutationFn: async ({ id, ...data }: Partial<FirstAider> & { id: string }) => {
      const { error } = await supabase.from('mh_first_aiders').update(data as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-first-aiders'] }),
  });

  const deleteFirstAider = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mh_first_aiders').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-first-aiders'] }),
  });

  return { firstAiders: firstAidersWithStatus, schedules, isLoading, createFirstAider, updateFirstAider, deleteFirstAider };
}

// ─── Hook: Schedules ─────────────────────────────────────────────────
export function useFirstAiderSchedule(firstAiderId?: string) {
  const queryClient = useQueryClient();

  const { data: schedule, isLoading } = useQuery({
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
        const { error } = await supabase.from('mh_first_aider_schedule').update(data as any).eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('mh_first_aider_schedule').insert(data as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mh-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['mh-first-aider-schedules'] });
    },
  });

  return { schedule, isLoading, upsertSchedule };
}

// ─── Hook: Emergency Contacts ────────────────────────────────────────
export function useEmergencyContacts(tenantId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: contacts = [], isLoading } = useQuery({
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
      const { error } = await supabase.from('mh_emergency_contacts').insert(data as any);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-emergency-contacts'] }),
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...data }: Partial<EmergencyContact> & { id: string }) => {
      const { error } = await supabase.from('mh_emergency_contacts').update(data as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-emergency-contacts'] }),
  });

  const deleteContact = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('mh_emergency_contacts').update({ deleted_at: new Date().toISOString() } as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-emergency-contacts'] }),
  });

  return { contacts, isLoading, createContact, updateContact, deleteContact };
}

// ─── Hook: Crisis Cases ──────────────────────────────────────────────
export function useCrisisCases(options?: { role?: 'requester' | 'first_aider' | 'admin' }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: cases = [], isLoading } = useQuery({
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
    mutationFn: async (data: { tenant_id: string; intent: string; anonymity_mode: string; summary?: string }) => {
      const risk_level = mapIntentToRisk(data.intent);
      const status = risk_level === 'high' ? 'escalated' : 'pending_assignment';
      
      const { data: result, error } = await supabase
        .from('mh_crisis_cases')
        .insert({
          tenant_id: data.tenant_id,
          requester_user_id: user!.id,
          intent: data.intent,
          risk_level,
          status,
          anonymity_mode: data.anonymity_mode,
          summary: data.summary || null,
        } as any)
        .select()
        .single();
      if (error) throw error;

      // If high risk, create escalation record
      if (risk_level === 'high') {
        await supabase.from('mh_crisis_escalations').insert({
          tenant_id: data.tenant_id,
          case_id: result.id,
          escalation_type: 'emergency_contacts_shown',
          triggered_by: 'system',
          notes: `High-risk intent: ${data.intent}`,
        } as any);
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

  const updateCaseStatus = useMutation({
    mutationFn: async ({ id, status, ...extra }: { id: string; status: string; [key: string]: any }) => {
      const updateData: any = { status, ...extra };
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
        // Notify requester that case was accepted
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
        await supabase.from('mh_crisis_cases').update({ reroute_count: (caseData.reroute_count || 0) + 1 } as any).eq('id', id);

        // Log decline as escalation
        await supabase.from('mh_crisis_escalations').insert({
          tenant_id: caseData.tenant_id,
          case_id: id,
          escalation_type: 'declined',
          triggered_by: 'first_aider',
          notes: 'First aider declined the case',
        } as any);

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

  return { cases, isLoading, createCase, updateCaseStatus };
}

// ─── Hook: Crisis Messages ───────────────────────────────────────────
export function useCrisisMessages(caseId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
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
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  const sendMessage = useMutation({
    mutationFn: async (data: { case_id: string; tenant_id: string; message: string }) => {
      const { error } = await supabase.from('mh_crisis_messages').insert({
        case_id: data.case_id,
        tenant_id: data.tenant_id,
        sender_user_id: user!.id,
        message: data.message,
      } as any);
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
          await supabase.from('mh_crisis_cases')
            .update({ first_response_at: new Date().toISOString() } as any)
            .eq('id', data.case_id)
            .is('first_response_at', null);
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-crisis-messages', caseId] }),
  });

  // Subscribe to realtime updates
  // The polling above handles this for now

  return { messages, isLoading, sendMessage };
}

// ─── Hook: Is current user a first aider? ────────────────────────────
export function useIsFirstAider() {
  const { user } = useAuth();

  const { data: firstAiderId, isLoading } = useQuery({
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

  return { isFirstAider: !!firstAiderId, firstAiderId, isLoading };
}
