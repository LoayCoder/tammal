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

    // Verify user identity
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

    // Resolve tenant_id server-side from user's profile — never trust client input
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", userData.user.id)
      .single();

    if (profileErr || !profile?.tenant_id) {
      return new Response(JSON.stringify({ error: "No tenant found for user" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenantId = profile.tenant_id;
    const { action } = await req.json();

    if (action === "predict_delays") {
      const { data: initiatives } = await supabase
        .from("initiatives")
        .select("id, title, status, progress, start_date, end_date")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .in("status", ["planned", "in_progress"]);

      const predictions = [];
      for (const init of initiatives ?? []) {
        const { data: actions } = await supabase
          .from("objective_actions")
          .select("id, status, estimated_hours, planned_end, created_at, updated_at")
          .eq("initiative_id", init.id)
          .eq("tenant_id", tenantId)
          .is("deleted_at", null);

        const total = actions?.length ?? 0;
        const completed = actions?.filter((a: any) => a.status === "completed").length ?? 0;
        const overdue = actions?.filter((a: any) => a.planned_end && new Date(a.planned_end) < new Date() && a.status !== "completed").length ?? 0;
        const blocked = actions?.filter((a: any) => a.status === "blocked").length ?? 0;

        if (total === 0) continue;

        const completionRate = completed / total;
        const overdueRate = overdue / total;
        const blockedRate = blocked / total;

        let predictedDelayDays = 0;
        const riskFactors: string[] = [];
        const suggestedActions: string[] = [];

        if (overdueRate > 0.3) {
          predictedDelayDays += Math.round(overdueRate * 14);
          riskFactors.push(`${overdue} overdue tasks (${Math.round(overdueRate * 100)}%)`);
          suggestedActions.push("Reassign overdue tasks or extend deadlines");
        }
        if (blockedRate > 0.2) {
          predictedDelayDays += Math.round(blockedRate * 7);
          riskFactors.push(`${blocked} blocked tasks`);
          suggestedActions.push("Resolve blockers immediately");
        }
        if (completionRate < 0.3 && init.end_date) {
          const daysLeft = Math.max(0, (new Date(init.end_date).getTime() - Date.now()) / 86400000);
          const daysNeeded = (total - completed) * 3;
          if (daysNeeded > daysLeft) {
            predictedDelayDays += Math.round(daysNeeded - daysLeft);
            riskFactors.push("Low completion velocity relative to deadline");
            suggestedActions.push("Add resources or reduce scope");
          }
        }

        if (riskFactors.length > 0) {
          predictions.push({
            initiativeId: init.id,
            initiativeTitle: init.title,
            predictedDelayDays,
            confidence: Math.min(0.9, 0.5 + completionRate * 0.3),
            riskFactors,
            suggestedActions,
          });
        }
      }

      return new Response(JSON.stringify({ data: predictions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "suggest_redistribution") {
      const { data: metrics } = await supabase
        .from("workload_metrics")
        .select("*")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null);

      const overloaded = (metrics ?? []).filter((m: any) => m.utilization_percentage > 110);
      const underloaded = (metrics ?? []).filter((m: any) => m.utilization_percentage < 60);

      const suggestions = [];
      for (const over of overloaded) {
        const best = underloaded.sort((a: any, b: any) => a.utilization_percentage - b.utilization_percentage)[0];
        if (best) {
          suggestions.push({
            fromEmployeeId: over.employee_id,
            toEmployeeId: best.employee_id,
            reason: `Rebalance: ${over.utilization_percentage}% → ${best.utilization_percentage}%`,
            estimatedImpact: {
              fromUtilizationAfter: over.utilization_percentage - 15,
              toUtilizationAfter: best.utilization_percentage + 15,
            },
          });
        }
      }

      return new Response(JSON.stringify({ data: suggestions }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
