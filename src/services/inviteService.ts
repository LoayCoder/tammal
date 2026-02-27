/**
 * Invite Service — handles invitation verification and acceptance.
 * No React imports — pure async functions.
 */

import { supabase } from '@/integrations/supabase/client';

export interface InvitationData {
  id: string;
  code: string;
  email: string;
  full_name: string | null;
  tenant_id: string;
  employee_id: string | null;
  tenants: { name: string } | null;
}

export type VerifyResult =
  | { status: 'valid'; invitation: InvitationData }
  | { status: 'used' }
  | { status: 'invalid' };

/**
 * Verify an invitation code and return the invitation data.
 */
export async function verifyInviteCode(code: string): Promise<VerifyResult> {
  const upperCode = code.toUpperCase();

  const { data, error } = await supabase
    .from('invitations')
    .select('id, code, email, full_name, tenant_id, employee_id, tenants(name)')
    .eq('code', upperCode)
    .is('deleted_at', null)
    .is('used', false)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !data) {
    // Check if it exists but was already used
    const { data: usedCheck } = await supabase
      .from('invitations')
      .select('used')
      .eq('code', upperCode)
      .single();

    if (usedCheck?.used) {
      return { status: 'used' };
    }
    return { status: 'invalid' };
  }

  return { status: 'valid', invitation: data as unknown as InvitationData };
}

export interface AcceptInviteParams {
  invitation: InvitationData;
  fullName: string;
  password: string;
  redirectUrl: string;
}

/**
 * Accept an invitation: create user account, link profile/employee, mark invitation used.
 */
export async function acceptInvite(params: AcceptInviteParams): Promise<void> {
  const { invitation, fullName, password, redirectUrl } = params;

  // 1. Create user account
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: invitation.email,
    password,
    options: {
      emailRedirectTo: redirectUrl,
      data: { full_name: fullName },
    },
  });

  if (signUpError) throw signUpError;
  if (!signUpData.user) throw new Error('User creation failed');

  const userId = signUpData.user.id;

  // 2. Update profile with tenant_id
  await supabase
    .from('profiles')
    .update({ tenant_id: invitation.tenant_id, full_name: fullName })
    .eq('user_id', userId);

  // 3. Link or create employee record
  if (invitation.employee_id) {
    await supabase
      .from('employees')
      .update({ user_id: userId })
      .eq('id', invitation.employee_id);
  } else {
    const { data: newEmp } = await supabase
      .from('employees')
      .insert({
        tenant_id: invitation.tenant_id,
        user_id: userId,
        full_name: fullName,
        email: invitation.email,
        status: 'active',
      })
      .select('id')
      .single();

    if (newEmp) {
      await supabase
        .from('invitations')
        .update({ employee_id: newEmp.id })
        .eq('id', invitation.id);
    }
  }

  // 4. Mark invitation as used
  await supabase
    .from('invitations')
    .update({
      used: true,
      used_at: new Date().toISOString(),
      used_by: userId,
    })
    .eq('id', invitation.id);

  // 5. Assign default user role
  await supabase.from('user_roles').insert({
    user_id: userId,
    role: 'user' as const,
  });
}
