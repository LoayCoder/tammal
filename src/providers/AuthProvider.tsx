import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { parseUserAgent, getLocationInfo } from '@/lib/deviceInfo';
import { logger } from '@/lib/logger';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

// Record login event (fire-and-forget, never blocks auth)
async function recordLoginEvent(userId: string | null, success: boolean, failureReason?: string) {
  try {
    const { data: profile } = userId
      ? await supabase
          .from('profiles')
          .select('tenant_id')
          .eq('user_id', userId)
          .single()
      : { data: null };

    const userAgent = navigator.userAgent;
    const deviceInfo = parseUserAgent(userAgent);
    const locationInfo = await getLocationInfo();

    await supabase.from('login_history').insert({
      user_id: userId ?? '',
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
    logger.error('AuthProvider', 'Failed to record login event', error);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Set up the listener FIRST (as per Supabase best practices).
    //    onAuthStateChange fires INITIAL_SESSION synchronously with the
    //    cached session, so we don't need a separate getSession() call.
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setLoading(false);
      }
    );

    // 2. Safety net: if onAuthStateChange never fires (e.g. stale/corrupt
    //    localStorage in preview), force loading to false after a timeout.
    const safetyTimer = setTimeout(() => {
      setLoading((prev) => {
        if (prev) {
          logger.warn('AuthProvider', 'Auth loading timeout – forcing signed-out state');
        }
        return false;
      });
    }, 3000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(safetyTimer);
    };
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl },
    });
    return { error };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (data.user) {
      recordLoginEvent(data.user.id, true);
    } else {
      recordLoginEvent(null, false, error?.message ?? 'Unknown error');
    }
    return { error };
  }, []);

  const signOut = useCallback(async () => {
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
        logger.error('AuthProvider', 'Failed to record logout event', error);
      }
    }

    const { error } = await supabase.auth.signOut();
    return { error };
  }, [user?.id]);

  const value = useMemo<AuthContextValue>(
    () => ({ user, session, loading, signUp, signIn, signOut }),
    [user, session, loading, signUp, signIn, signOut]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within <AuthProvider>');
  }
  return ctx;
}
