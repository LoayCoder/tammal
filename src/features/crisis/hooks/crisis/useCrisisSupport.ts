import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/hooks/auth/useAuth';
import * as CrisisService from '../../services/crisis.service';
import type { FirstAider, FirstAiderSchedule, CrisisCase, EmergencyContact, CrisisMessage } from '../../types';

// Export types again so components depending on them don't break
export type { FirstAider, FirstAiderSchedule, CrisisCase, EmergencyContact, CrisisMessage };
export { mapIntentToRisk } from '../../services/crisis.service';

function computeFirstAiderStatus(schedule: FirstAiderSchedule | null): { statusLabel: string; isAvailable: boolean } {
  if (!schedule || !schedule.is_enabled) return { statusLabel: 'offline', isAvailable: false };
  if (schedule.temp_unavailable) return { statusLabel: 'temporarily_unavailable', isAvailable: false };

  const tz = schedule.timezone || 'Asia/Riyadh';
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
    hour: 'numeric',
    minute: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const weekday = parts.find(p => p.type === 'weekday')?.value?.toLowerCase()?.slice(0, 3) || '';
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);

  const dayName = weekday;
  const rules = schedule.weekly_rules?.[dayName] || [];
  const nowMinutes = hour * 60 + minute;

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
    queryFn: () => CrisisService.fetchFirstAiders(tenantId),
    enabled: !!user?.id,
  });

  const { data: schedules = [] } = useQuery({
    queryKey: ['mh-first-aider-schedules', tenantId],
    queryFn: () => CrisisService.fetchFirstAiderSchedules(tenantId),
    enabled: !!user?.id,
  });

  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 60_000);
    return () => clearInterval(interval);
  }, []);

  const firstAidersWithStatus = useMemo(() => firstAiders.map(fa => {
    const schedule = schedules.find(s => s.first_aider_id === fa.id) || null;
    const statusInfo = computeFirstAiderStatus(schedule);
    return { ...fa, schedule, ...statusInfo };
  }), [firstAiders, schedules, tick]);

  const createFirstAider = useMutation({
    mutationFn: CrisisService.createFirstAider,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-first-aiders'] }),
  });

  const updateFirstAider = useMutation({
    mutationFn: async ({ id, ...data }: Partial<FirstAider> & { id: string }) => {
      await CrisisService.updateFirstAider(id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-first-aiders'] }),
  });

  const deleteFirstAider = useMutation({
    mutationFn: CrisisService.deleteFirstAider,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-first-aiders'] }),
  });

  return { firstAiders: firstAidersWithStatus, schedules, isPending, createFirstAider, updateFirstAider, deleteFirstAider };
}

// ─── Hook: Schedules ─────────────────────────────────────────────────
export function useFirstAiderSchedule(firstAiderId?: string) {
  const queryClient = useQueryClient();

  const { data: schedule, isPending } = useQuery({
    queryKey: ['mh-schedule', firstAiderId],
    queryFn: () => CrisisService.fetchFirstAiderScheduleByFaId(firstAiderId!),
    enabled: !!firstAiderId,
  });

  const upsertSchedule = useMutation({
    mutationFn: CrisisService.upsertFirstAiderSchedule,
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
    queryFn: () => CrisisService.fetchEmergencyContacts(tenantId),
    enabled: !!user?.id,
  });

  const createContact = useMutation({
    mutationFn: CrisisService.createEmergencyContact,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-emergency-contacts'] }),
  });

  const updateContact = useMutation({
    mutationFn: async ({ id, ...data }: Partial<EmergencyContact> & { id: string }) => {
      await CrisisService.updateEmergencyContact(id, data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-emergency-contacts'] }),
  });

  const deleteContact = useMutation({
    mutationFn: CrisisService.deleteEmergencyContact,
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
    queryFn: () => CrisisService.fetchCrisisCases(100),
    enabled: !!user?.id,
  });

  const createCase = useMutation({
    mutationFn: (data: { tenant_id: string; intent: string; anonymity_mode: string; summary?: string; urgency_level?: number; preferred_contact_method?: string }) => 
      CrisisService.createCrisisCase(data, user!.id),
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
      await CrisisService.updateCrisisCaseStatus(id, status, extra);
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
    queryFn: () => CrisisService.fetchCrisisMessages(caseId!),
    enabled: !!caseId && !!user?.id,
    refetchInterval: 5000,
  });

  const sendMessage = useMutation({
    mutationFn: (data: { case_id: string; tenant_id: string; message: string }) =>
      CrisisService.sendCrisisMessage(data, user!.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-crisis-messages', caseId] }),
  });

  return { messages, isPending, sendMessage };
}

// ─── Hook: Is current user a first aider? ────────────────────────────
export function useIsFirstAider() {
  const { user } = useAuth();

  const { data: firstAiderId, isPending } = useQuery({
    queryKey: ['is-first-aider', user?.id],
    queryFn: () => CrisisService.checkIsFirstAider(user!.id),
    enabled: !!user?.id,
  });

  return { isFirstAider: !!firstAiderId, firstAiderId, isPending };
}
