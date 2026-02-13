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

    const { data: callerRoles, error: rolesError } = await supabaseUser
      .from('user_roles')
      .select('role')
      .eq('user_id', callingUser.id);

    if (rolesError) {
      return new Response(
        JSON.stringify({ error: 'Failed to verify permissions' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const hasAdminRole = callerRoles?.some(r => 
      r.role === 'super_admin' || r.role === 'tenant_admin'
    );

    if (!hasAdminRole) {
      return new Response(
        JSON.stringify({ error: 'Insufficient permissions. Only admins can reset passwords.' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { user_id, email, new_password } = await req.json();
    
    if (!user_id && !email) {
      return new Response(
        JSON.stringify({ error: 'user_id or email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // If new_password is provided, set it directly
    if (new_password) {
      let targetUserId = user_id;
      if (!targetUserId && email) {
        // Find user by email
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

      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        password: new_password,
      });

      if (updateError) {
        console.error('Password update error:', updateError);
        return new Response(
          JSON.stringify({ error: 'Failed to update password', details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Password updated successfully' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Otherwise send reset email
    let targetEmail = email;
    if (!targetEmail && user_id) {
      const { data: userData, error: userDataError } = await supabaseAdmin.auth.admin.getUserById(user_id);
      if (userDataError || !userData?.user?.email) {
        return new Response(
          JSON.stringify({ error: 'User not found' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      targetEmail = userData.user.email;
    }

    const { error: resetError } = await supabaseAdmin.auth.resetPasswordForEmail(targetEmail, {
      redirectTo: `${req.headers.get('origin') || supabaseUrl}/auth?mode=reset`,
    });

    if (resetError) {
      console.error('Password reset error:', resetError);
      return new Response(
        JSON.stringify({ error: 'Failed to send password reset email', details: resetError.message }),
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
