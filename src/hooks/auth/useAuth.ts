import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { parseUserAgent, getLocationInfo } from '@/lib/deviceInfo';
import { logger } from '@/lib/logger';

// Record login event (fire-and-forget, never blocks auth)
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
    logger.error('useAuth', 'Failed to record login event', error);
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

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
      options: { emailRedirectTo: redirectUrl },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data.user) {
      recordLoginEvent(data.user.id, true);
    }
    return { error };
  };

  const signOut = async () => {
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
        logger.error('useAuth', 'Failed to record logout event', error);
      }
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  };

  return { user, session, loading, signUp, signIn, signOut };
}
