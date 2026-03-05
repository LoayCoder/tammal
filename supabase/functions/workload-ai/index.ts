import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";
const AI_MODEL = "google/gemini-3-flash-preview";

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
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Authenticate user
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

    // Resolve tenant
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
    const { action } = await req.json();
    const todayStr = new Date().toISOString().split("T")[0];

    // ──────────────── PREDICT BURNOUT ────────────────
    if (action === "predict_burnout") {
      // Gather employee signals
      const { data: employees } = await supabase
        .from("employees")
        .select("id, full_name")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .eq("status", "active");

      const { data: metrics } = await supabase
        .from("workload_metrics")
        .select("employee_id, utilization_percentage, burnout_risk_score")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null);

      const metricsMap: Record<string, any> = {};
      (metrics ?? []).forEach((m: any) => { metricsMap[m.employee_id] = m; });

      // Escalation counts per employee
      const { data: escalations } = await supabase
        .from("escalation_events")
        .select("task_id, id")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null);

      const { data: actions } = await supabase
        .from("objective_actions")
        .select("id, assignee_id, status, planned_end")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null);

      // Build escalation count per assignee
      const taskAssigneeMap: Record<string, string> = {};
      (actions ?? []).forEach((a: any) => {
        if (a.assignee_id) taskAssigneeMap[a.id] = a.assignee_id;
      });

      const escalationCount: Record<string, number> = {};
      (escalations ?? []).forEach((e: any) => {
        const assignee = taskAssigneeMap[e.task_id];
        if (assignee) escalationCount[assignee] = (escalationCount[assignee] ?? 0) + 1;
      });

      // Overdue count per assignee
      const overdueCount: Record<string, number> = {};
      (actions ?? []).forEach((a: any) => {
        if (a.assignee_id && a.planned_end && a.planned_end.split("T")[0] < todayStr && a.status !== "completed") {
          overdueCount[a.assignee_id] = (overdueCount[a.assignee_id] ?? 0) + 1;
        }
      });

      // Build signals for AI
      const employeeSignals = (employees ?? []).map((emp: any) => {
        const m = metricsMap[emp.id] ?? {};
        return {
          id: emp.id,
          name: emp.full_name,
          utilization_pct: m.utilization_percentage ?? 0,
          existing_burnout_score: m.burnout_risk_score ?? 0,
          escalation_count: escalationCount[emp.id] ?? 0,
          overdue_task_count: overdueCount[emp.id] ?? 0,
        };
      });

      if (employeeSignals.length === 0) {
        return new Response(
          JSON.stringify({ data: { processed: 0 } }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Call AI with tool calling for structured output
      const aiResponse = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            {
              role: "system",
              content: `You are a workforce analytics AI. Analyze employee signals and predict burnout probability. Consider: utilization >100% is dangerous, escalation frequency indicates stress, overdue tasks indicate overwhelm. Return predictions for employees showing risk signs (probability > 20).`,
            },
            {
              role: "user",
              content: `Analyze these employee workload signals and predict burnout risk:\n${JSON.stringify(employeeSignals, null, 2)}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "submit_burnout_predictions",
                description: "Submit burnout probability predictions for employees",
                parameters: {
                  type: "object",
                  properties: {
                    predictions: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          employee_id: { type: "string" },
                          burnout_probability: { type: "number", description: "0-100 score" },
                          confidence: { type: "number", description: "0-100 confidence" },
                          reasoning: { type: "string", description: "Brief explanation" },
                          indicators: {
                            type: "object",
                            properties: {
                              utilization: { type: "number" },
                              escalation_frequency: { type: "number" },
                              overdue_streak: { type: "number" },
                            },
                            required: ["utilization", "escalation_frequency", "overdue_streak"],
                            additionalProperties: false,
                          },
                        },
                        required: ["employee_id", "burnout_probability", "confidence", "reasoning", "indicators"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["predictions"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "submit_burnout_predictions" } },
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        const body = await aiResponse.text();
        console.error("AI gateway error:", status, body);
        if (status === 429) {
          return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later" }), {
            status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        if (status === 402) {
          return new Response(JSON.stringify({ error: "AI credits exhausted, please add funds" }), {
            status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        return new Response(JSON.stringify({ error: "AI prediction failed" }), {
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      let predictions: any[] = [];
      if (toolCall?.function?.arguments) {
        try {
          const parsed = JSON.parse(toolCall.function.arguments);
          predictions = parsed.predictions ?? [];
        } catch { /* ignore parse errors */ }
      }

      // Persist predictions
      let count = 0;
      for (const pred of predictions) {
        await supabase.from("burnout_predictions").insert({
          tenant_id: tenantId,
          employee_id: pred.employee_id,
          burnout_probability_score: pred.burnout_probability,
          confidence_score: pred.confidence,
          ai_reasoning: pred.reasoning,
          indicators: pred.indicators,
          predicted_at: new Date().toISOString(),
        });
        count++;
      }

      return new Response(
        JSON.stringify({ data: { processed: count, predictions: predictions.length } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──────────────── FORECAST COMPLETION ────────────────
    if (action === "forecast_completion") {
      const { data: initiatives } = await supabase
        .from("initiatives")
        .select("id, title, end_date, progress")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .in("status", ["planned", "in_progress"]);

      if (!initiatives || initiatives.length === 0) {
        return new Response(
          JSON.stringify({ data: { processed: 0 } }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Gather velocity and action data per initiative
      const initData = [];
      for (const init of initiatives) {
        const { data: actions } = await supabase
          .from("objective_actions")
          .select("id, status, planned_end, estimated_hours")
          .eq("initiative_id", (init as any).id)
          .eq("tenant_id", tenantId)
          .is("deleted_at", null);

        const total = (actions ?? []).length;
        const completed = (actions ?? []).filter((a: any) => a.status === "completed").length;
        const remaining = total - completed;
        const overdue = (actions ?? []).filter(
          (a: any) => a.planned_end && a.planned_end.split("T")[0] < todayStr && a.status !== "completed"
        ).length;

        initData.push({
          id: (init as any).id,
          title: (init as any).title,
          target_end: (init as any).end_date,
          progress: (init as any).progress ?? 0,
          total_actions: total,
          completed_actions: completed,
          remaining_actions: remaining,
          overdue_actions: overdue,
        });
      }

      const aiResponse = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            {
              role: "system",
              content: `You are a project completion forecasting AI. Based on progress, remaining work, and overdue rates, predict realistic completion dates. Today is ${todayStr}.`,
            },
            {
              role: "user",
              content: `Forecast completion for these initiatives:\n${JSON.stringify(initData, null, 2)}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "submit_forecasts",
                description: "Submit completion date forecasts for initiatives",
                parameters: {
                  type: "object",
                  properties: {
                    forecasts: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          initiative_id: { type: "string" },
                          predicted_completion_date: { type: "string", description: "YYYY-MM-DD" },
                          confidence_score: { type: "number", description: "0-100" },
                          reasoning: { type: "string" },
                        },
                        required: ["initiative_id", "predicted_completion_date", "confidence_score", "reasoning"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["forecasts"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "submit_forecasts" } },
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        await aiResponse.text();
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "AI forecast failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      let forecasts: any[] = [];
      if (toolCall?.function?.arguments) {
        try { forecasts = JSON.parse(toolCall.function.arguments).forecasts ?? []; } catch { /* */ }
      }

      // Update initiative_risk_metrics with forecasts
      for (const f of forecasts) {
        await supabase.from("initiative_risk_metrics").update({
          snapshot_date: todayStr,
        }).eq("initiative_id", f.initiative_id).eq("tenant_id", tenantId);
      }

      return new Response(
        JSON.stringify({ data: { processed: forecasts.length, forecasts } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ──────────────── SMART REDISTRIBUTE ────────────────
    if (action === "smart_redistribute") {
      const { data: employees } = await supabase
        .from("employees")
        .select("id, full_name, department_id, role_title")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .eq("status", "active");

      const { data: metrics } = await supabase
        .from("workload_metrics")
        .select("employee_id, utilization_percentage")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null);

      const utilizationMap: Record<string, number> = {};
      (metrics ?? []).forEach((m: any) => { utilizationMap[m.employee_id] = m.utilization_percentage; });

      const overloaded = (employees ?? []).filter((e: any) => (utilizationMap[e.id] ?? 0) > 100);
      const underloaded = (employees ?? []).filter((e: any) => (utilizationMap[e.id] ?? 0) < 70);

      if (overloaded.length === 0 || underloaded.length === 0) {
        return new Response(
          JSON.stringify({ data: { processed: 0, message: "No redistribution needed" } }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Get tasks from overloaded employees
      const overloadedIds = overloaded.map((e: any) => e.id);
      const { data: tasks } = await supabase
        .from("objective_actions")
        .select("id, title, assignee_id, priority, estimated_hours")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null)
        .neq("status", "completed")
        .in("assignee_id", overloadedIds);

      const aiInput = {
        overloaded: overloaded.map((e: any) => ({
          id: e.id, name: e.full_name, role: e.role_title, dept: e.department_id,
          utilization: utilizationMap[e.id] ?? 0,
        })),
        underloaded: underloaded.map((e: any) => ({
          id: e.id, name: e.full_name, role: e.role_title, dept: e.department_id,
          utilization: utilizationMap[e.id] ?? 0,
        })),
        tasks: (tasks ?? []).slice(0, 30).map((t: any) => ({
          id: t.id, title: t.title, assignee_id: t.assignee_id,
          priority: t.priority, hours: t.estimated_hours,
        })),
      };

      const aiResponse = await fetch(AI_GATEWAY, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: AI_MODEL,
          messages: [
            {
              role: "system",
              content: `You are a workload optimization AI. Suggest task reassignments from overloaded to underloaded employees. Consider department match and role relevance. Suggest the most impactful moves (max 10).`,
            },
            {
              role: "user",
              content: `Suggest workload redistribution:\n${JSON.stringify(aiInput, null, 2)}`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "submit_redistributions",
                description: "Submit task redistribution recommendations",
                parameters: {
                  type: "object",
                  properties: {
                    recommendations: {
                      type: "array",
                      items: {
                        type: "object",
                        properties: {
                          from_employee_id: { type: "string" },
                          to_employee_id: { type: "string" },
                          action_id: { type: "string", description: "Task ID to reassign" },
                          reason: { type: "string" },
                          priority: { type: "string", enum: ["high", "medium", "low"] },
                          capacity_diff: { type: "number" },
                          skill_match_score: { type: "number", description: "0-100" },
                          reasoning: { type: "string" },
                        },
                        required: ["from_employee_id", "to_employee_id", "reason", "priority", "reasoning"],
                        additionalProperties: false,
                      },
                    },
                  },
                  required: ["recommendations"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "submit_redistributions" } },
        }),
      });

      if (!aiResponse.ok) {
        const status = aiResponse.status;
        await aiResponse.text();
        if (status === 429) return new Response(JSON.stringify({ error: "Rate limit exceeded" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        if (status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        return new Response(JSON.stringify({ error: "AI redistribution failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      let recommendations: any[] = [];
      if (toolCall?.function?.arguments) {
        try { recommendations = JSON.parse(toolCall.function.arguments).recommendations ?? []; } catch { /* */ }
      }

      let count = 0;
      for (const rec of recommendations) {
        await supabase.from("redistribution_recommendations").insert({
          tenant_id: tenantId,
          from_employee_id: rec.from_employee_id,
          to_employee_id: rec.to_employee_id,
          action_id: rec.action_id || null,
          reason: rec.reason,
          priority: rec.priority ?? "medium",
          capacity_diff: rec.capacity_diff ?? 0,
          skill_match_score: rec.skill_match_score ?? 0,
          ai_reasoning: rec.reasoning,
          status: "pending",
        });
        count++;
      }

      return new Response(
        JSON.stringify({ data: { processed: count } }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("workload-ai error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
