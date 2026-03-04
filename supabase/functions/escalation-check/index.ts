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

    // Auth: require either service role key or valid JWT with admin role
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    // If the token is the service role key, allow (cron/scheduled job)
    if (token !== serviceKey) {
      // Verify as user JWT and check for admin role
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: authErr } = await userClient.auth.getUser();
      if (authErr || !userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify user has admin or super_admin role
      const supabase = createClient(supabaseUrl, serviceKey);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);

      const hasAdmin = (roles ?? []).some(
        (r: any) => r.role === "super_admin" || r.role === "tenant_admin"
      );
      if (!hasAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

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

      const applicableLevel = ESCALATION_THRESHOLDS
        .filter((t) => daysOverdue >= t.daysOverdue)
        .sort((a, b) => b.level - a.level)[0];

      if (!applicableLevel) continue;

      const { data: existing } = await supabase
        .from("escalation_events")
        .select("id")
        .eq("task_id", task.id)
        .eq("escalation_level", applicableLevel.level)
        .is("deleted_at", null)
        .limit(1);

      if (existing && existing.length > 0) continue;

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
