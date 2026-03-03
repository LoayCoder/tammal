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
    const { action, task_id, justification } = body;

    if (!task_id || !action) {
      return new Response(JSON.stringify({ error: 'Missing task_id or action' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!justification || typeof justification !== 'string' || justification.trim().length < 3) {
      return new Response(JSON.stringify({ error: 'Justification is required (min 3 chars)' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch the task and verify ownership
    const { data: task, error: fetchErr } = await supabase
      .from('unified_tasks')
      .select('*')
      .eq('id', task_id)
      .eq('source_type', 'representative_assigned')
      .is('deleted_at', null)
      .maybeSingle();

    if (fetchErr || !task) {
      return new Response(JSON.stringify({ error: 'Task not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only the creator (representative) can manage
    if (task.created_by !== user.id) {
      return new Response(JSON.stringify({ error: 'Only the task creator can manage this task' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: edit
    if (action === 'edit') {
      const { title, title_ar, description, priority, estimated_minutes } = body;
      if (!title || typeof title !== 'string' || title.trim().length === 0) {
        return new Response(JSON.stringify({ error: 'Title is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const previousValue = { title: task.title, title_ar: task.title_ar, description: task.description, priority: task.priority, estimated_minutes: task.estimated_minutes };

      const { error: updateErr } = await supabase
        .from('unified_tasks')
        .update({
          title: title.trim(),
          title_ar: title_ar ?? task.title_ar,
          description: description ?? task.description,
          priority: priority ?? task.priority,
          estimated_minutes: estimated_minutes ?? task.estimated_minutes,
          updated_at: new Date().toISOString(),
        })
        .eq('id', task_id);

      if (updateErr) {
        return new Response(JSON.stringify({ error: updateErr.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Audit log
      await supabase.from('audit_logs').insert({
        tenant_id: task.tenant_id,
        user_id: user.id,
        entity_type: 'unified_tasks',
        entity_id: task_id,
        action: 'representative_edit',
        changes: { previous_value: previousValue, justification: justification.trim() },
      });

      return new Response(JSON.stringify({ success: true, action: 'edit' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: delete (soft delete)
    if (action === 'delete') {
      const { error: deleteErr } = await supabase
        .from('unified_tasks')
        .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', task_id);

      if (deleteErr) {
        return new Response(JSON.stringify({ error: deleteErr.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('audit_logs').insert({
        tenant_id: task.tenant_id,
        user_id: user.id,
        entity_type: 'unified_tasks',
        entity_id: task_id,
        action: 'representative_delete',
        changes: { previous_value: { title: task.title, employee_id: task.employee_id }, justification: justification.trim() },
      });

      return new Response(JSON.stringify({ success: true, action: 'delete' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ACTION: extend_due_date
    if (action === 'extend_due_date') {
      const { new_due_date } = body;
      if (!new_due_date) {
        return new Response(JSON.stringify({ error: 'new_due_date is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Build history entry
      const oldHistory = Array.isArray(task.due_date_history) ? task.due_date_history : [];
      const historyEntry = {
        old_due_date: task.due_date,
        new_due_date,
        changed_at: new Date().toISOString(),
        changed_by: user.id,
        justification: justification.trim(),
      };

      const { error: extendErr } = await supabase
        .from('unified_tasks')
        .update({
          due_date: new_due_date,
          due_date_history: [...oldHistory, historyEntry],
          updated_at: new Date().toISOString(),
        })
        .eq('id', task_id);

      if (extendErr) {
        return new Response(JSON.stringify({ error: extendErr.message }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await supabase.from('audit_logs').insert({
        tenant_id: task.tenant_id,
        user_id: user.id,
        entity_type: 'unified_tasks',
        entity_id: task_id,
        action: 'representative_extend_due_date',
        changes: { previous_value: { due_date: task.due_date }, new_value: { due_date: new_due_date }, justification: justification.trim() },
      });

      return new Response(JSON.stringify({ success: true, action: 'extend_due_date' }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
