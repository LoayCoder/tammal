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
    const { tenant_id, mode } = body;

    if (!tenant_id) {
      return new Response(JSON.stringify({ error: 'Missing tenant_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all representative assignments for this user
    const { data: assignments, error: assignErr } = await supabase
      .from('representative_assignments')
      .select('*')
      .eq('user_id', user.id)
      .eq('tenant_id', tenant_id)
      .is('deleted_at', null);

    if (assignErr) {
      return new Response(JSON.stringify({ error: 'Failed to fetch assignments' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!assignments || assignments.length === 0) {
      return new Response(JSON.stringify({ error: 'No representative assignments found' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Helper: check if an employee is within the representative's scope
    async function isEmployeeInScope(employeeId: string): Promise<boolean> {
      const { data: emp } = await supabase
        .from('employees')
        .select('id, department_id, section_id')
        .eq('id', employeeId)
        .eq('tenant_id', tenant_id)
        .eq('status', 'active')
        .is('deleted_at', null)
        .maybeSingle();

      if (!emp) return false;

      for (const a of assignments!) {
        if (a.scope_type === 'section' && emp.section_id === a.scope_id) return true;
        if (a.scope_type === 'department' && emp.department_id === a.scope_id) return true;
        if (a.scope_type === 'division') {
          // Check if employee's department belongs to this division
          if (emp.department_id) {
            const { data: dept } = await supabase
              .from('departments')
              .select('division_id')
              .eq('id', emp.department_id)
              .maybeSingle();
            if (dept?.division_id === a.scope_id) return true;
          }
        }
      }
      return false;
    }

    // BULK MODE: array of tasks
    if (mode === 'bulk' && Array.isArray(body.tasks)) {
      const tasks = body.tasks as Array<{
        employee_id: string;
        title: string;
        title_ar?: string;
        description?: string;
        due_date?: string;
        priority?: number;
        estimated_minutes?: number;
      }>;

      if (tasks.length === 0) {
        return new Response(JSON.stringify({ error: 'No tasks provided', distributed: 0 }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Validate all employees
      const validatedTasks = [];
      const errors = [];
      for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];
        if (!t.employee_id || !t.title) {
          errors.push({ row: i, error: 'Missing employee_id or title' });
          continue;
        }
        const inScope = await isEmployeeInScope(t.employee_id);
        if (!inScope) {
          errors.push({ row: i, error: 'Employee not in representative scope' });
          continue;
        }
        validatedTasks.push(t);
      }

      if (validatedTasks.length === 0) {
        return new Response(JSON.stringify({ error: 'No valid tasks', errors, distributed: 0 }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const batchId = crypto.randomUUID();
      const rows = validatedTasks.map((t) => ({
        tenant_id,
        employee_id: t.employee_id,
        title: t.title,
        title_ar: t.title_ar ?? null,
        description: t.description ?? null,
        due_date: t.due_date ?? null,
        priority: t.priority ?? 3,
        estimated_minutes: t.estimated_minutes ?? null,
        source_type: 'representative_assigned',
        source_id: batchId,
        is_locked: true,
        locked_by: user.id,
        locked_at: new Date().toISOString(),
        created_by: user.id,
        status: 'open',
      }));

      const { error: insertErr } = await supabase.from('unified_tasks').insert(rows);
      if (insertErr) {
        return new Response(JSON.stringify({ error: insertErr.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ distributed: validatedTasks.length, batch_id: batchId, errors }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // SINGLE MODE: one employee_id
    const { employee_id, title, title_ar, description, due_date, priority, estimated_minutes } = body;

    if (!employee_id || !title) {
      return new Response(JSON.stringify({ error: 'Missing required fields (employee_id, title)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const inScope = await isEmployeeInScope(employee_id);
    if (!inScope) {
      return new Response(JSON.stringify({ error: 'Employee is not within your representative scope' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const batchId = crypto.randomUUID();
    const { error: insertErr } = await supabase.from('unified_tasks').insert({
      tenant_id,
      employee_id,
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
      status: 'open',
    });

    if (insertErr) {
      return new Response(JSON.stringify({ error: insertErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ distributed: 1, batch_id: batchId }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
