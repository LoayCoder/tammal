import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callingUser }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !callingUser) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Resolve caller's roles
    const { data: callerRoles, error: rolesError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id);

    if (rolesError) {
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isSuperAdmin = callerRoles?.some(r => r.role === 'super_admin');
    const isTenantAdmin = callerRoles?.some(r => r.role === 'tenant_admin');

    if (!isSuperAdmin && !isTenantAdmin) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only admins can reset passwords.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolve caller's tenant_id server-side
    const { data: callerProfile } = await supabaseAdmin
      .from('profiles')
      .select('tenant_id')
      .eq('user_id', callingUser.id)
      .maybeSingle();

    const callerTenantId = callerProfile?.tenant_id;

    const { user_id, email, new_password } = await req.json();

    if (!user_id && !email) {
      return new Response(
        JSON.stringify({ error: 'user_id or email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Resolve target user ID
    let targetUserId = user_id;
    if (!targetUserId && email) {
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (listError) {
        return new Response(
          JSON.stringify({ error: 'Failed to find user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      const targetUser = users?.find(u => u.email === email);
      if (!targetUser) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      targetUserId = targetUser.id;
    }

    // ── Tenant boundary & privilege escalation checks ──────────────
    if (!isSuperAdmin) {
      // 1. Prevent tenant_admin from resetting super_admin passwords
      const { data: targetRoles } = await supabaseAdmin
        .from('user_roles')
        .select('role')
        .eq('user_id', targetUserId);

      if (targetRoles?.some(r => r.role === 'super_admin')) {
        return new Response(
          JSON.stringify({ error: 'Tenant admins cannot reset super admin passwords.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // 2. Verify target user belongs to the same tenant
      const { data: targetProfile } = await supabaseAdmin
        .from('profiles')
        .select('tenant_id')
        .eq('user_id', targetUserId)
        .maybeSingle();

      if (!targetProfile || targetProfile.tenant_id !== callerTenantId) {
        return new Response(
          JSON.stringify({ error: 'Cannot reset password for users outside your organization.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    // ── End checks ─────────────────────────────────────────────────

    // If new_password is provided, set it directly
    if (new_password) {
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: new_password,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update password' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Password updated successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Otherwise send reset email
    const { data: userData, error: userDataError } = await supabaseAdmin.auth.admin.getUserById(targetUserId);
    if (userDataError || !userData?.user?.email) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(userData.user.email, {
      redirectTo: `${req.headers.get('origin') || supabaseUrl}/auth?mode=reset`,
    });

    if (resetError) {
      console.error('Password reset error:', resetError);
      return new Response(
        JSON.stringify({ error: 'Failed to send password reset email' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Password reset email sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
