import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

// Parse user agent to extract device info
function parseUserAgent(ua: string) {
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
async function getLocationInfo() {
  try {
    const ipResponse = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipResponse.json();
    const ip = ipData.ip;

    const geoResponse = await fetch(`https://ip-api.com/json/${ip}?fields=country,city`);
    const geoData = await geoResponse.json();

    return {
      ip,
      country: geoData.country || 'Unknown',
      city: geoData.city || 'Unknown',
    };
  } catch {
    return null;
  }
}

// Record login event
async function recordLoginEvent(userId: string, success: boolean, failureReason?: string) {
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', userId)
      .single();

    const userAgent = navigator.userAgent;
    const deviceInfo = parseUserAgent(userAgent);
    const locationInfo = await getLocationInfo();

    await supabase.from('login_history').insert({
      user_id: userId,
      tenant_id: profile?.tenant_id || null,
      event_type: success ? 'login' : 'failed_login',
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
  } catch (error) {
    console.error('Failed to record login event:', error);
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl
      }
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    // Record login event (success or failure)
    if (data.user) {
      recordLoginEvent(data.user.id, true);
    } else if (error) {
      // For failed logins, we can't get user_id, so we skip recording
      // In a production app, you might want to log failed attempts differently
    }

    return { error };
  };

  const signOut = async () => {
    // Record logout event before signing out
    if (user?.id) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('user_id', user.id)
          .single();

        const userAgent = navigator.userAgent;
        const deviceInfo = parseUserAgent(userAgent);

        await supabase.from('login_history').insert({
          user_id: user.id,
          tenant_id: profile?.tenant_id || null,
          event_type: 'logout',
          user_agent: userAgent,
          device_type: deviceInfo.device_type,
          browser: deviceInfo.browser,
          os: deviceInfo.os,
          success: true,
        });
      } catch (error) {
        console.error('Failed to record logout event:', error);
      }
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
}
