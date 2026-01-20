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

// Parse user agent to extract device info
function parseUserAgent(ua: string): DeviceInfo {
  let device_type = 'Desktop';
  if (/mobile/i.test(ua)) device_type = 'Mobile';
  if (/tablet|ipad/i.test(ua)) device_type = 'Tablet';

  let browser = 'Unknown';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS') || ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  return { device_type, browser, os };
}

// Fetch IP and location info
async function getLocationInfo(): Promise<LocationInfo | null> {
  try {
    // Get IP address
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    const ip = ipData.ip;

    // Get location from IP (using ip-api.com - free, no API key required)
    const geoResponse = await fetch(`https://ip-api.com/json/${ip}?fields=country,city`);
    const geoData = await geoResponse.json();

    return {
      ip,
      country: geoData.country || 'Unknown',
      city: geoData.city || 'Unknown',
    };
  } catch (error) {
    console.error('Failed to get location info:', error);
    return null;
  }
}

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
    isLoading: loginHistoryQuery.isLoading,
    recordLogin: recordLoginMutation.mutateAsync,
    isRecording: recordLoginMutation.isPending,
  };
}
