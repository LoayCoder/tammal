import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const now = new Date();

    // Fetch all active templates whose next_run_at <= now
    const { data: templates, error: fetchErr } = await supabase
      .from("task_templates")
      .select("*")
      .eq("is_active", true)
      .is("deleted_at", null)
      .lte("next_run_at", now.toISOString());

    if (fetchErr) throw fetchErr;
    if (!templates?.length) {
      return new Response(JSON.stringify({ created: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let created = 0;

    for (const tpl of templates) {
      // Create unified_task from template
      const { error: insertErr } = await supabase
        .from("unified_tasks")
        .insert({
          tenant_id: tpl.tenant_id,
          title: tpl.title,
          title_ar: tpl.title_ar,
          description: tpl.description,
          description_ar: tpl.description_ar,
          priority: tpl.priority,
          visibility: tpl.visibility,
          source_type: "recurring",
          employee_id: tpl.assignee_id,
          reviewer_id: tpl.reviewer_id,
          approver_id: tpl.approver_id,
          department_id: tpl.department_id,
          initiative_id: tpl.initiative_id,
          objective_id: tpl.objective_id,
          estimated_minutes: tpl.estimated_minutes,
          status: "open",
          progress: 0,
          created_by: tpl.created_by,
          template_id: tpl.id,
        });

      if (insertErr) {
        console.error(`Failed to create task from template ${tpl.id}:`, insertErr.message);
        continue;
      }
      created++;

      // Calculate next_run_at
      const nextRun = calculateNextRun(tpl.recurrence_pattern, tpl.recurrence_day_of_week, tpl.recurrence_day_of_month, tpl.recurrence_time, now);

      await supabase
        .from("task_templates")
        .update({ last_run_at: now.toISOString(), next_run_at: nextRun.toISOString(), updated_at: now.toISOString() })
        .eq("id", tpl.id);
    }

    return new Response(JSON.stringify({ created, processed: templates.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("create-recurring-tasks error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function calculateNextRun(
  pattern: string,
  dayOfWeek: number | null,
  dayOfMonth: number | null,
  timeStr: string | null,
  from: Date,
): Date {
  const next = new Date(from);
  // Apply time
  if (timeStr) {
    const [h, m] = timeStr.split(":").map(Number);
    next.setUTCHours(h, m, 0, 0);
  }

  switch (pattern) {
    case "daily":
      next.setUTCDate(next.getUTCDate() + 1);
      break;
    case "weekly":
      next.setUTCDate(next.getUTCDate() + 7);
      break;
    case "biweekly":
      next.setUTCDate(next.getUTCDate() + 14);
      break;
    case "monthly":
      next.setUTCMonth(next.getUTCMonth() + 1);
      if (dayOfMonth) next.setUTCDate(Math.min(dayOfMonth, 28));
      break;
    case "quarterly":
      next.setUTCMonth(next.getUTCMonth() + 3);
      if (dayOfMonth) next.setUTCDate(Math.min(dayOfMonth, 28));
      break;
    default:
      next.setUTCDate(next.getUTCDate() + 7);
  }

  return next;
}
