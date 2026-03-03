import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Authenticate caller
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!);
    const { data: { user }, error: authErr } = await anonClient.auth.getUser(authHeader.replace('Bearer ', ''));
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { tenant_id, title, title_ar, description, due_date, priority, estimated_minutes, scope_type, scope_id } = body;

    if (!tenant_id || !title || !scope_type || !scope_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the caller has a representative assignment for this scope
    const { data: assignment, error: assignErr } = await supabase
      .from('representative_assignments')
      .select('id')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant_id)
      .eq('scope_type', scope_type)
      .eq('scope_id', scope_id)
      .is('deleted_at', null)
      .maybeSingle();

    if (assignErr || !assignment) {
      return new Response(JSON.stringify({ error: 'No representative assignment for this scope' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Resolve employees based on scope
    let employeeIds: string[] = [];

    if (scope_type === 'division') {
      // Get all departments under this division, then all employees in those departments
      const { data: depts } = await supabase
        .from('departments')
        .select('id')
        .eq('division_id', scope_id)
        .is('deleted_at', null);

      const deptIds = (depts ?? []).map((d: { id: string }) => d.id);
      if (deptIds.length > 0) {
        const { data: emps } = await supabase
          .from('employees')
          .select('id')
          .in('department_id', deptIds)
          .is('deleted_at', null)
          .eq('status', 'active')
          .eq('tenant_id', tenant_id);
        employeeIds = (emps ?? []).map((e: { id: string }) => e.id);
      }
    } else if (scope_type === 'department') {
      const { data: emps } = await supabase
        .from('employees')
        .select('id')
        .eq('department_id', scope_id)
        .is('deleted_at', null)
        .eq('status', 'active')
        .eq('tenant_id', tenant_id);
      employeeIds = (emps ?? []).map((e: { id: string }) => e.id);
    } else if (scope_type === 'section') {
      const { data: emps } = await supabase
        .from('employees')
        .select('id')
        .eq('section_id', scope_id)
        .is('deleted_at', null)
        .eq('status', 'active')
        .eq('tenant_id', tenant_id);
      employeeIds = (emps ?? []).map((e: { id: string }) => e.id);
    }

    if (employeeIds.length === 0) {
      return new Response(JSON.stringify({ error: 'No employees found in this scope', distributed: 0 }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Generate a batch ID so we can track this distribution
    const batchId = crypto.randomUUID();

    // Bulk-insert locked tasks for each employee
    const tasks = employeeIds.map((empId) => ({
      tenant_id,
      employee_id: empId,
      title,
      title_ar: title_ar ?? null,
      description: description ?? null,
      due_date: due_date ?? null,
      priority: priority ?? 3,
      estimated_minutes: estimated_minutes ?? null,
      source_type: 'representative_assigned',
      source_id: batchId,
      is_locked: true,
      locked_by: user.id,
      locked_at: new Date().toISOString(),
      created_by: user.id,
      status: 'todo',
    }));

    const { error: insertErr } = await supabase.from('unified_tasks').insert(tasks);
    if (insertErr) {
      console.error('Insert error:', insertErr);
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ distributed: employeeIds.length, batch_id: batchId }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
