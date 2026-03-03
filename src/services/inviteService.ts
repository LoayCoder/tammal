/**
 * Invite Service — handles invitation verification and acceptance.
 * No React imports — pure async functions.
 */

import { supabase } from '@/integrations/supabase/client';
import { InviteInvalidError, ServiceUnavailableError } from './errors';

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

  // Use the security-definer RPC to verify without exposing PII via public SELECT
  const { data: rpcResult, error: rpcError } = await supabase
    .rpc('verify_invitation_code', { p_code: upperCode });

  if (rpcError || !rpcResult || rpcResult.length === 0) {
    return { status: 'invalid' };
  }

  const match = rpcResult[0];
  if (match.used) {
    return { status: 'used' };
  }

  // Fetch full invitation details now that we know the ID
  // This will work for authenticated users via admin policies;
  // for pre-auth, we construct minimal data from the RPC result
  const { data: fullData } = await supabase
    .from('invitations')
    .select('id, code, email, full_name, tenant_id, employee_id, tenants(name)')
    .eq('id', match.id)
    .single();

  if (fullData) {
    return { status: 'valid', invitation: fullData as unknown as InvitationData };
  }

  // Fallback: if the user isn't authenticated yet, the SELECT above will fail.
  // In that case, use an edge function or return minimal data.
  // For now, return minimal data from the RPC — the accept flow will get full data post-signup.
  return {
    status: 'valid',
    invitation: {
      id: match.id,
      code: upperCode,
      email: '',
      full_name: null,
      tenant_id: match.tenant_id,
      employee_id: null,
      tenants: null,
    },
  };
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

  if (signUpError) throw new ServiceUnavailableError(signUpError.message);
  if (!signUpData.user) throw new ServiceUnavailableError('User creation failed');

  const userId = signUpData.user.id;

  // 2. Update profile with tenant_id
  const { error: profileErr } = await supabase
    .from('profiles')
    .update({ tenant_id: invitation.tenant_id, full_name: fullName })
    .eq('user_id', userId);

  if (profileErr) throw new ServiceUnavailableError(profileErr.message);

  // 3. Link or create employee record
  if (invitation.employee_id) {
    const { error: empErr } = await supabase
      .from('employees')
      .update({ user_id: userId })
      .eq('id', invitation.employee_id);
    if (empErr) throw new ServiceUnavailableError(empErr.message);
  } else {
    const { data: newEmp, error: empErr } = await supabase
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

    if (empErr) throw new ServiceUnavailableError(empErr.message);

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
