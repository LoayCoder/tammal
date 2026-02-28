import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface LoginEvent {
  id: string;
  user_id: string;
  tenant_id: string | null;
  event_type: string;
  ip_address: string | null;
  user_agent: string | null;
  device_type: string | null;
  browser: string | null;
  os: string | null;
  country: string | null;
  city: string | null;
  success: boolean;
  failure_reason: string | null;
  created_at: string;
}

interface DeviceInfo {
  device_type: string;
  browser: string;
  os: string;
}

interface LocationInfo {
  ip: string;
  country: string;
  city: string;
}

import { parseUserAgent, getLocationInfo } from '@/lib/deviceInfo';
export type { DeviceInfo, LocationInfo } from '@/lib/deviceInfo';

// Re-export parseUserAgent for backward compatibility
export { parseUserAgent, getLocationInfo };

// getLocationInfo is now imported from @/lib/deviceInfo

export function useLoginHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const loginHistoryQuery = useQuery({
    queryKey: ['login-history', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('login_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as LoginEvent[];
    },
    enabled: !!user?.id,
  });

  const recordLoginMutation = useMutation({
    mutationFn: async ({
      eventType = 'login',
      success = true,
      failureReason,
    }: {
      eventType?: string;
      success?: boolean;
      failureReason?: string;
    }) => {
      const currentUser = (await supabase.auth.getUser()).data.user;
      if (!currentUser?.id) throw new Error('No user');

      // Get profile for tenant_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', currentUser.id)
        .single();

      const userAgent = navigator.userAgent;
      const deviceInfo = parseUserAgent(userAgent);
      const locationInfo = await getLocationInfo();

      const { error } = await supabase.from('login_history').insert({
        user_id: currentUser.id,
        tenant_id: profile?.tenant_id || null,
        event_type: eventType,
        ip_address: locationInfo?.ip || null,
        user_agent: userAgent,
        device_type: deviceInfo.device_type,
        browser: deviceInfo.browser,
        os: deviceInfo.os,
        country: locationInfo?.country || null,
        city: locationInfo?.city || null,
        success,
        failure_reason: failureReason || null,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['login-history'] });
    },
  });

  return {
    loginHistory: loginHistoryQuery.data || [],
    isPending: loginHistoryQuery.isPending && loginHistoryQuery.isFetching,
    recordLogin: recordLoginMutation.mutateAsync,
    isRecording: recordLoginMutation.isPending,
  };
}
