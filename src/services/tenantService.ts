/**
 * Tenant Service — wraps tenant-related database operations.
 * No React imports — pure async functions.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Get the tenant ID for a user via the database RPC function.
 */
export async function getTenantIdForUser(userId: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('get_user_tenant_id', { _user_id: userId });
  if (error) throw error;
  return (data as string | null) ?? null;
}

/**
 * Get the tenant ID from the profiles table for a user.
 */
export async function getTenantIdFromProfile(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('tenant_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) throw error;
  return data?.tenant_id ?? null;
}
