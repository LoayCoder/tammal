/**
 * Account Service — handles account deletion and related operations.
 * No React imports — pure async functions.
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Delete user data (profile + roles). Does NOT delete the auth user itself
 * — that requires admin API or an edge function.
 */
export async function deleteUserData(userId: string): Promise<void> {
  // Remove from profiles table
  await supabase.from('profiles').delete().eq('user_id', userId);

  // Remove from user_roles table
  await supabase.from('user_roles').delete().eq('user_id', userId);
}
