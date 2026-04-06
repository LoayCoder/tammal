import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_THRESHOLDS = [
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

    if (token !== serviceKey) {
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

    // Build per-tenant threshold cache from governance_config
    const tenantIds = [...new Set((overdueTasks ?? []).map((t: any) => t.tenant_id))];
    const thresholdMap: Record<string, typeof DEFAULT_THRESHOLDS> = {};

    if (tenantIds.length > 0) {
      const { data: configs } = await supabase
        .from("governance_config")
        .select("tenant_id, config_value")
        .eq("config_key", "escalation_thresholds")
        .is("deleted_at", null)
        .in("tenant_id", tenantIds);

      for (const cfg of configs ?? []) {
        try {
          const val = cfg.config_value;
          if (Array.isArray(val) && val.length > 0) {
            thresholdMap[cfg.tenant_id] = val;
          }
        } catch {
          // fallback to defaults
        }
      }
    }

    let escalationsCreated = 0;

    for (const task of overdueTasks ?? []) {
      const daysOverdue = Math.floor(
        (Date.now() - new Date(task.planned_end).getTime()) / 86400000
      );

      const tenantThresholds = thresholdMap[task.tenant_id] ?? DEFAULT_THRESHOLDS;

      const applicableLevel = tenantThresholds
        .filter((t: any) => daysOverdue >= t.daysOverdue)
        .sort((a: any, b: any) => b.level - a.level)[0];

      if (!applicableLevel) continue;

      const { data: existing } = await supabase
        .from("escalation_events")
        .select("id")
        .eq("task_id", task.id)
        .eq("escalation_level", applicableLevel.level)
        .is("deleted_at", null)
        .limit(1);

      if (existing && existing.length > 0) continue;

      const escalationReason = `Task "${task.title}" is ${daysOverdue} days overdue. Auto-escalated to ${applicableLevel.target}.`;

      const { error: insertErr } = await supabase
        .from("escalation_events")
        .insert({
          tenant_id: task.tenant_id,
          task_id: task.id,
          escalation_level: applicableLevel.level,
          reason: escalationReason,
        });

      if (!insertErr) {
        escalationsCreated++;

        if (task.assignee_id) {
          await supabase.from("task_notifications").insert({
            tenant_id: task.tenant_id,
            recipient_id: task.assignee_id,
            task_id: task.id,
            type: "overdue",
            title: `Task overdue: ${task.title}`,
            body: escalationReason,
            metadata: {
              escalation_level: applicableLevel.level,
              days_overdue: daysOverdue,
            },
          });
        }
      }
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
