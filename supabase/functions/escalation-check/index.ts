import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ESCALATION_THRESHOLDS = [
  { level: 1, daysOverdue: 3, target: "manager" },
  { level: 2, daysOverdue: 7, target: "department_head" },
  { level: 3, daysOverdue: 14, target: "executive" },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch all overdue tasks across tenants
    const now = new Date().toISOString();
    const { data: overdueTasks, error: tasksErr } = await supabase
      .from("objective_actions")
      .select("id, tenant_id, title, planned_end, assignee_id, status")
      .is("deleted_at", null)
      .not("planned_end", "is", null)
      .lt("planned_end", now)
      .not("status", "eq", "completed");

    if (tasksErr) throw tasksErr;

    let escalationsCreated = 0;

    for (const task of overdueTasks ?? []) {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(task.planned_end).getTime()) / 86400000
      );

      // Find the highest applicable escalation level
      const applicableLevel = ESCALATION_THRESHOLDS
        .filter((t) => daysOverdue >= t.daysOverdue)
        .sort((a, b) => b.level - a.level)[0];

      if (!applicableLevel) continue;

      // Check if this escalation level already exists for this task
      const { data: existing } = await supabase
        .from("escalation_events")
        .select("id")
        .eq("task_id", task.id)
        .eq("escalation_level", applicableLevel.level)
        .is("deleted_at", null)
        .limit(1);

      if (existing && existing.length > 0) continue;

      // Create the escalation event
      const { error: insertErr } = await supabase
        .from("escalation_events")
        .insert({
          tenant_id: task.tenant_id,
          task_id: task.id,
          escalation_level: applicableLevel.level,
          reason: `Task "${task.title}" is ${daysOverdue} days overdue. Auto-escalated to ${applicableLevel.target}.`,
        });

      if (!insertErr) escalationsCreated++;
    }

    return new Response(
      JSON.stringify({
        success: true,
        tasksChecked: overdueTasks?.length ?? 0,
        escalationsCreated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
