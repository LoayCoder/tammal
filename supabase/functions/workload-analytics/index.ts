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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
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

    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", userData.user.id)
      .single();

    if (!profile?.tenant_id) {
      return new Response(JSON.stringify({ error: "No tenant found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenantId = profile.tenant_id;
    const { action, period_days } = await req.json();
    const todayStr = new Date().toISOString().split("T")[0];

    // ──────────────── COMPUTE VELOCITY ────────────────
    if (action === "compute_velocity") {
      const days = period_days ?? 30;
      const periodStart = new Date();
      periodStart.setDate(periodStart.getDate() - days);

      const { data: actions } = await supabase
        .from("objective_actions")
        .select("id, initiative_id, assignee_id, updated_at")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .eq("status", "completed")
        .gte("updated_at", periodStart.toISOString());

      const { data: employees } = await supabase
        .from("employees")
        .select("id, department_id")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null);

      const empDeptMap: Record<string, string | null> = {};
      (employees ?? []).forEach((e: any) => { empDeptMap[e.id] = e.department_id; });

      const deptGroups: Record<string, number> = {};
      (actions ?? []).forEach((a: any) => {
        const dept = empDeptMap[a.assignee_id ?? ""] ?? "unassigned";
        deptGroups[dept] = (deptGroups[dept] ?? 0) + 1;
      });

      // Upsert velocity metrics
      const periodStartDate = periodStart.toISOString().split("T")[0];
      for (const [dept, count] of Object.entries(deptGroups)) {
        await supabase.from("execution_velocity_metrics").upsert(
          {
            tenant_id: tenantId,
            department_id: dept === "unassigned" ? null : dept,
            initiative_id: null,
            actions_completed: count,
            period_start: periodStartDate,
            period_end: todayStr,
            velocity_score: Math.round((count / days) * 100) / 100,
          },
          { onConflict: "id" }
        );
      }

      return new Response(
        JSON.stringify({ data: { departments: Object.keys(deptGroups).length, totalCompleted: (actions ?? []).length } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──────────────── SNAPSHOT HEATMAP ────────────────
    if (action === "snapshot_heatmap") {
      const { data: employees } = await supabase
        .from("employees")
        .select("id, department_id")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .eq("status", "active");

      const { data: capacities } = await supabase
        .from("employee_capacity")
        .select("user_id, daily_capacity_minutes")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null);

      const capMap: Record<string, number> = {};
      (capacities ?? []).forEach((c: any) => { capMap[c.user_id] = c.daily_capacity_minutes; });

      const { data: actions } = await supabase
        .from("objective_actions")
        .select("assignee_id, estimated_hours")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .neq("status", "completed");

      const loadMap: Record<string, number> = {};
      (actions ?? []).forEach((a: any) => {
        if (a.assignee_id) {
          loadMap[a.assignee_id] = (loadMap[a.assignee_id] ?? 0) + (a.estimated_hours ?? 0) * 60;
        }
      });

      let count = 0;
      for (const emp of employees ?? []) {
        const capacity = capMap[(emp as any).id] ?? 480;
        const activeMin = loadMap[(emp as any).id] ?? 0;
        const pct = capacity > 0 ? Math.round((activeMin / capacity) * 100) : 0;
        const classification = pct < 60 ? "underutilized" : pct <= 90 ? "healthy" : pct <= 110 ? "high_load" : "burnout_risk";

        await supabase.from("workload_heatmap_metrics").insert({
          tenant_id: tenantId,
          employee_id: (emp as any).id,
          department_id: (emp as any).department_id,
          utilization_pct: pct,
          classification,
          snapshot_date: todayStr,
        });
        count++;
      }

      return new Response(
        JSON.stringify({ data: { snapshotDate: todayStr, employeesProcessed: count } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──────────────── COMPUTE INITIATIVE RISK ────────────────
    if (action === "compute_initiative_risk") {
      const { data: initiatives } = await supabase
        .from("initiatives")
        .select("id")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .in("status", ["planned", "in_progress"]);

      const results = [];
      for (const init of initiatives ?? []) {
        const { data: actions } = await supabase
          .from("objective_actions")
          .select("id, status, planned_end, assignee_id")
          .eq("initiative_id", (init as any).id)
          .eq("tenant_id", tenantId)
          .is("deleted_at", null);

        const total = (actions ?? []).length;
        const completed = (actions ?? []).filter((a: any) => a.status === "completed").length;
        const overdue = (actions ?? []).filter(
          (a: any) => a.planned_end && a.planned_end.split("T")[0] < todayStr && a.status !== "completed"
        ).length;

        const incomplete = total - completed;
        const overdueScore = incomplete > 0 ? Math.round((overdue / incomplete) * 100) : 0;
        const velocityScore = total > 0 ? Math.round((1 - completed / total) * 100) : 0;

        // Resource score
        const assigneeIds = [...new Set((actions ?? []).map((a: any) => a.assignee_id).filter(Boolean))];
        let resourceScore = 0;
        if (assigneeIds.length > 0) {
          const { data: metrics } = await supabase
            .from("workload_metrics")
            .select("utilization_percentage")
            .eq("tenant_id", tenantId)
            .in("employee_id", assigneeIds)
            .is("deleted_at", null);
          const overloaded = (metrics ?? []).filter((m: any) => m.utilization_percentage > 100).length;
          resourceScore = Math.round((overloaded / assigneeIds.length) * 100);
        }

        // Escalation score
        const actionIds = (actions ?? []).map((a: any) => a.id);
        let escalationScore = 0;
        if (actionIds.length > 0) {
          const { data: escalations } = await supabase
            .from("escalation_events")
            .select("id")
            .eq("tenant_id", tenantId)
            .in("task_id", actionIds)
            .is("deleted_at", null);
          escalationScore = Math.min((escalations ?? []).length * 20, 100);
        }

        const riskScore = Math.round(
          overdueScore * 0.4 + velocityScore * 0.3 + resourceScore * 0.2 + escalationScore * 0.1
        );

        await supabase.from("initiative_risk_metrics").insert({
          tenant_id: tenantId,
          initiative_id: (init as any).id,
          overdue_score: overdueScore,
          velocity_score: velocityScore,
          resource_score: resourceScore,
          escalation_score: escalationScore,
          risk_score: riskScore,
          snapshot_date: todayStr,
        });

        results.push({ initiativeId: (init as any).id, riskScore });
      }

      return new Response(
        JSON.stringify({ data: results }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──────────────── SNAPSHOT ALIGNMENT ────────────────
    if (action === "snapshot_alignment") {
      const { data: actions } = await supabase
        .from("objective_actions")
        .select("assignee_id, initiative_id")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null);

      const userMap: Record<string, { total: number; linked: number }> = {};
      (actions ?? []).forEach((a: any) => {
        if (!a.assignee_id) return;
        if (!userMap[a.assignee_id]) userMap[a.assignee_id] = { total: 0, linked: 0 };
        userMap[a.assignee_id].total++;
        if (a.initiative_id) userMap[a.assignee_id].linked++;
      });

      let count = 0;
      for (const [userId, data] of Object.entries(userMap)) {
        const score = data.total > 0 ? Math.round((data.linked / data.total) * 100) : 100;
        await supabase.from("strategic_alignment_metrics").insert({
          tenant_id: tenantId,
          user_id: userId,
          aligned_actions: data.linked,
          total_actions: data.total,
          alignment_score: score,
          snapshot_date: todayStr,
        });
        count++;
      }

      return new Response(
        JSON.stringify({ data: { snapshotDate: todayStr, usersProcessed: count } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──────────────── COMPUTE ORG SCORE ────────────────
    if (action === "compute_org_score") {
      // Alignment: avg alignment_score from strategic_alignment_metrics
      const { data: alignments } = await supabase
        .from("strategic_alignment_metrics")
        .select("alignment_score")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("snapshot_date", { ascending: false })
        .limit(500);

      const avgAlignment = (alignments ?? []).length > 0
        ? (alignments as any[]).reduce((s: number, a: any) => s + (a.alignment_score ?? 0), 0) / (alignments as any[]).length
        : 0;

      // Velocity: avg velocity_score
      const { data: velocities } = await supabase
        .from("execution_velocity_metrics")
        .select("velocity_score")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .limit(100);

      const avgVelocityRaw = (velocities ?? []).length > 0
        ? (velocities as any[]).reduce((s: number, v: any) => s + (v.velocity_score ?? 0), 0) / (velocities as any[]).length
        : 0;
      // Normalize velocity to 0-100 (assume 2 actions/day = 100)
      const velocityNorm = Math.min(Math.round((avgVelocityRaw / 2) * 100), 100);

      // Capacity balance: from heatmap - % in healthy range
      const { data: heatmaps } = await supabase
        .from("workload_heatmap_metrics")
        .select("classification")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .eq("snapshot_date", todayStr);

      const heatTotal = (heatmaps ?? []).length;
      const healthyCount = (heatmaps ?? []).filter((h: any) => h.classification === "healthy").length;
      const capacityBalance = heatTotal > 0 ? Math.round((healthyCount / heatTotal) * 100) : 50;

      // Burnout health: avg burnout risk from workload_metrics (inverted)
      const { data: wlMetrics } = await supabase
        .from("workload_metrics")
        .select("burnout_risk_score")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null);

      const avgBurnout = (wlMetrics ?? []).length > 0
        ? (wlMetrics as any[]).reduce((s: number, m: any) => s + (m.burnout_risk_score ?? 0), 0) / (wlMetrics as any[]).length
        : 0;
      const burnoutHealth = Math.round(100 - avgBurnout);

      const tammalIndex = Math.round(
        avgAlignment * 0.25 +
        velocityNorm * 0.25 +
        capacityBalance * 0.25 +
        burnoutHealth * 0.25
      );

      await supabase.from("org_intelligence_scores").insert({
        tenant_id: tenantId,
        score: tammalIndex,
        components: {
          alignment: Math.round(avgAlignment),
          velocity: velocityNorm,
          capacity_balance: capacityBalance,
          burnout_health: burnoutHealth,
        },
        snapshot_date: todayStr,
      });

      return new Response(
        JSON.stringify({ data: { score: tammalIndex, date: todayStr } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
