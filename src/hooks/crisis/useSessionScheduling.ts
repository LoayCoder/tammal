import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/auth/useAuth';
import { createCrisisNotification } from './useCrisisNotifications';

// ─── Types ───────────────────────────────────────────────────────────
export interface SupportSession {
  id: string;
  tenant_id: string;
  case_id: string | null;
  first_aider_id: string;
  requester_user_id: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  channel: string;
  session_notes: string | null;
  outcome: string | null;
  status: string;
  created_at: string;
  deleted_at: string | null;
}

export interface AvailabilitySlot {
  start: string; // HH:mm
  end: string;
  is_available: boolean;
  source: string;
}

export interface DailyAvailability {
  id: string;
  first_aider_id: string;
  date: string;
  time_slots: AvailabilitySlot[];
}

export interface BookableSlot {
  date: string;
  start: string;
  end: string;
}

// ─── Constants ───────────────────────────────────────────────────────
const SESSION_DURATION_MINUTES = 45;
const BUFFER_MINUTES = 15;
const DAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const;

// ─── Hook: Support Sessions ─────────────────────────────────────────
export function useSupportSessions(options?: { firstAiderId?: string; requesterUserId?: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['mh-support-sessions', options?.firstAiderId, options?.requesterUserId],
    queryFn: async () => {
      let query = supabase
        .from('mh_support_sessions')
        .select('*')
        .is('deleted_at', null)
        .order('scheduled_start', { ascending: false });

      if (options?.firstAiderId) query = query.eq('first_aider_id', options.firstAiderId);
      if (options?.requesterUserId) query = query.eq('requester_user_id', options.requesterUserId);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SupportSession[];
    },
    enabled: !!user?.id,
  });

  return { sessions, isLoading };
}

// ─── Hook: Session Scheduling ────────────────────────────────────────
export function useSessionScheduling() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Get available slots for a first aider over a date range
  const getAvailableSlots = async (
    firstAiderId: string,
    startDate: string,
    endDate: string,
    tenantId: string
  ): Promise<BookableSlot[]> => {
    // 1. Get the first aider's schedule (weekly rules)
    const { data: schedule } = await supabase
      .from('mh_first_aider_schedule')
      .select('*')
      .eq('first_aider_id', firstAiderId)
      .maybeSingle();

    if (!schedule || !schedule.is_enabled || schedule.temp_unavailable) return [];

    // 2. Get existing booked sessions in the range
    const { data: existingSessions } = await supabase
      .from('mh_support_sessions')
      .select('scheduled_start, scheduled_end')
      .eq('first_aider_id', firstAiderId)
      .is('deleted_at', null)
      .in('status', ['scheduled', 'active'])
      .gte('scheduled_start', `${startDate}T00:00:00`)
      .lte('scheduled_start', `${endDate}T23:59:59`);

    const bookedSlots = (existingSessions || []).map(s => ({
      start: new Date(s.scheduled_start!),
      end: new Date(s.scheduled_end!),
    }));

    // 3. Get any custom availability overrides
    const { data: customAvail } = await supabase
      .from('mh_first_aider_availability')
      .select('*')
      .eq('first_aider_id', firstAiderId)
      .gte('date', startDate)
      .lte('date', endDate);

    const customMap = new Map<string, AvailabilitySlot[]>();
    (customAvail || []).forEach((a: any) => {
      customMap.set(a.date, a.time_slots as AvailabilitySlot[]);
    });

    // 4. Generate bookable slots
    const slots: BookableSlot[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    const now = new Date();

    // Get first aider's availability config for min notice
    const { data: faData } = await supabase
      .from('mh_first_aiders')
      .select('availability_config, max_concurrent_sessions')
      .eq('id', firstAiderId)
      .single();

    const minNoticeHours = (faData?.availability_config as any)?.min_notice_hours ?? 4;
    const maxDailySessions = (faData?.availability_config as any)?.max_daily_sessions ?? 6;
    const earliestBookable = new Date(now.getTime() + minNoticeHours * 60 * 60 * 1000);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayIdx = d.getDay();
      const dayKey = DAY_KEYS[dayIdx];

      // Check custom availability first, fall back to weekly rules
      let daySlots: { from: string; to: string }[];
      if (customMap.has(dateStr)) {
        daySlots = customMap.get(dateStr)!
          .filter(s => s.is_available)
          .map(s => ({ from: s.start, to: s.end }));
      } else {
        daySlots = ((schedule.weekly_rules as any)?.[dayKey] || []) as { from: string; to: string }[];
      }

      // Count existing sessions for this day
      const daySessions = bookedSlots.filter(b => b.start.toISOString().startsWith(dateStr));
      if (daySessions.length >= maxDailySessions) continue;

      // Generate time slots within available windows
      for (const window of daySlots) {
        const [startH, startM] = window.from.split(':').map(Number);
        const [endH, endM] = window.to.split(':').map(Number);

        let slotStart = new Date(d);
        slotStart.setHours(startH, startM, 0, 0);

        const windowEnd = new Date(d);
        windowEnd.setHours(endH, endM, 0, 0);

        while (slotStart.getTime() + SESSION_DURATION_MINUTES * 60000 <= windowEnd.getTime()) {
          const slotEnd = new Date(slotStart.getTime() + SESSION_DURATION_MINUTES * 60000);

          // Check minimum notice
          if (slotStart > earliestBookable) {
            // Check no conflict with existing bookings (including buffer)
            const hasConflict = bookedSlots.some(b => {
              const bufferStart = new Date(b.start.getTime() - BUFFER_MINUTES * 60000);
              const bufferEnd = new Date(b.end.getTime() + BUFFER_MINUTES * 60000);
              return slotStart < bufferEnd && slotEnd > bufferStart;
            });

            if (!hasConflict) {
              slots.push({
                date: dateStr,
                start: `${String(slotStart.getHours()).padStart(2, '0')}:${String(slotStart.getMinutes()).padStart(2, '0')}`,
                end: `${String(slotEnd.getHours()).padStart(2, '0')}:${String(slotEnd.getMinutes()).padStart(2, '0')}`,
              });
            }
          }

          // Move to next slot (session + buffer)
          slotStart = new Date(slotStart.getTime() + (SESSION_DURATION_MINUTES + BUFFER_MINUTES) * 60000);
        }
      }
    }

    return slots;
  };

  // Book a session
  const bookSession = useMutation({
    mutationFn: async (data: {
      tenant_id: string;
      first_aider_id: string;
      case_id?: string;
      date: string;
      start_time: string;
      end_time: string;
      communication_channel: string; // maps to DB column 'channel'
    }) => {
      const scheduledStart = `${data.date}T${data.start_time}:00`;
      const scheduledEnd = `${data.date}T${data.end_time}:00`;

      const { data: session, error } = await supabase
        .from('mh_support_sessions')
        .insert({
          tenant_id: data.tenant_id,
          case_id: data.case_id || null,
          first_aider_id: data.first_aider_id,
          requester_user_id: user!.id,
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
          channel: data.communication_channel,
          status: 'scheduled',
        } as any)
        .select()
        .single();

      if (error) throw error;

      // If there's a linked case, update it with the session reference
      if (data.case_id) {
        await supabase
          .from('mh_crisis_cases')
          .update({ scheduled_session_id: session.id } as any)
          .eq('id', data.case_id);
      }

      // Notify the first aider
      const { data: fa } = await supabase
        .from('mh_first_aiders')
        .select('user_id')
        .eq('id', data.first_aider_id)
        .single();

      if (fa?.user_id) {
        await createCrisisNotification({
          tenant_id: data.tenant_id,
          user_id: fa.user_id,
          case_id: data.case_id || session.id,
          type: 'session_scheduled',
          title: 'New session booked',
          body: `Session scheduled for ${data.date} at ${data.start_time}`,
        });
      }

      return session as SupportSession;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mh-support-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['mh-crisis-cases'] });
    },
  });

  // Cancel a session
  const cancelSession = useMutation({
    mutationFn: async ({ sessionId, reason }: { sessionId: string; reason?: string }) => {
      const { data: session } = await supabase
        .from('mh_support_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (!session) throw new Error('Session not found');

      const { error } = await supabase
        .from('mh_support_sessions')
        .update({ status: 'cancelled', session_notes: reason || null } as any)
        .eq('id', sessionId);

      if (error) throw error;

      // Notify the other party
      const isRequester = session.requester_user_id === user!.id;
      if (isRequester) {
        const { data: fa } = await supabase
          .from('mh_first_aiders')
          .select('user_id')
          .eq('id', session.first_aider_id)
          .single();
        if (fa?.user_id) {
          await createCrisisNotification({
            tenant_id: session.tenant_id,
            user_id: fa.user_id,
            case_id: session.case_id || sessionId,
            type: 'session_cancelled',
            title: 'Session cancelled',
            body: reason || 'The scheduled session has been cancelled.',
          });
        }
      } else {
        await createCrisisNotification({
          tenant_id: session.tenant_id,
          user_id: session.requester_user_id,
          case_id: session.case_id || sessionId,
          type: 'session_cancelled',
          title: 'Session cancelled',
          body: reason || 'The scheduled session has been cancelled by the first aider.',
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-support-sessions'] }),
  });

  // Reschedule a session
  const rescheduleSession = useMutation({
    mutationFn: async (data: { sessionId: string; date: string; start_time: string; end_time: string }) => {
      const scheduledStart = `${data.date}T${data.start_time}:00`;
      const scheduledEnd = `${data.date}T${data.end_time}:00`;

      const { data: session } = await supabase
        .from('mh_support_sessions')
        .select('*')
        .eq('id', data.sessionId)
        .single();

      if (!session) throw new Error('Session not found');

      const { error } = await supabase
        .from('mh_support_sessions')
        .update({
          scheduled_start: scheduledStart,
          scheduled_end: scheduledEnd,
        } as any)
        .eq('id', data.sessionId);

      if (error) throw error;

      // Notify both parties
      const { data: fa } = await supabase
        .from('mh_first_aiders')
        .select('user_id')
        .eq('id', session.first_aider_id)
        .single();

      const notifBody = `Session rescheduled to ${data.date} at ${data.start_time}`;

      if (fa?.user_id && fa.user_id !== user!.id) {
        await createCrisisNotification({
          tenant_id: session.tenant_id,
          user_id: fa.user_id,
          case_id: session.case_id || data.sessionId,
          type: 'session_rescheduled',
          title: 'Session rescheduled',
          body: notifBody,
        });
      }
      if (session.requester_user_id !== user!.id) {
        await createCrisisNotification({
          tenant_id: session.tenant_id,
          user_id: session.requester_user_id,
          case_id: session.case_id || data.sessionId,
          type: 'session_rescheduled',
          title: 'Session rescheduled',
          body: notifBody,
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-support-sessions'] }),
  });

  // Start a session (set actual_start)
  const startSession = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase
        .from('mh_support_sessions')
        .update({ actual_start: new Date().toISOString(), status: 'active' } as any)
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-support-sessions'] }),
  });

  // End a session
  const endSession = useMutation({
    mutationFn: async ({ sessionId, outcome, notes }: { sessionId: string; outcome: string; notes?: string }) => {
      const { error } = await supabase
        .from('mh_support_sessions')
        .update({
          actual_end: new Date().toISOString(),
          status: 'completed',
          outcome,
          session_notes: notes || null,
        } as any)
        .eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-support-sessions'] }),
  });

  return {
    getAvailableSlots,
    bookSession,
    cancelSession,
    rescheduleSession,
    startSession,
    endSession,
  };
}

// ─── Hook: Session Ratings ───────────────────────────────────────────
export function useSessionRating(sessionId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: rating } = useQuery({
    queryKey: ['mh-session-rating', sessionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mh_session_ratings')
        .select('*')
        .eq('session_id', sessionId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!sessionId && !!user?.id,
  });

  const submitRating = useMutation({
    mutationFn: async (data: { session_id: string; tenant_id: string; rating: number; comment?: string }) => {
      const { error } = await supabase.from('mh_session_ratings').insert({
        session_id: data.session_id,
        tenant_id: data.tenant_id,
        rater_user_id: user!.id,
        rating: data.rating,
        comment: data.comment || null,
      } as any);
      if (error) throw error;

      // Update first aider's average rating
      const { data: session } = await supabase
        .from('mh_support_sessions')
        .select('first_aider_id')
        .eq('id', data.session_id)
        .single();

      if (session?.first_aider_id) {
        const { data: allRatings } = await supabase
          .from('mh_session_ratings')
          .select('rating')
          .eq('session_id', data.session_id);

        // Get all ratings for this first aider's sessions
        const { data: faSessions } = await supabase
          .from('mh_support_sessions')
          .select('id')
          .eq('first_aider_id', session.first_aider_id);

        if (faSessions && faSessions.length > 0) {
          const sessionIds = faSessions.map(s => s.id);
          const { data: faRatings } = await supabase
            .from('mh_session_ratings')
            .select('rating')
            .in('session_id', sessionIds);

          if (faRatings && faRatings.length > 0) {
            const avg = faRatings.reduce((sum, r) => sum + (r as any).rating, 0) / faRatings.length;
            await supabase
              .from('mh_first_aiders')
              .update({ rating: Math.round(avg * 10) / 10 } as any)
              .eq('id', session.first_aider_id);
          }
        }
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['mh-session-rating'] }),
  });

  return { rating, submitRating };
}
