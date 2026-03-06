import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

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

    // Auth
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
    const { action, task_id } = await req.json();

    // ─── Fetch task context ───
    const { data: task } = await supabase
      .from("unified_tasks")
      .select("*")
      .eq("id", task_id)
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .single();

    if (!task) {
      return new Response(JSON.stringify({ error: "Task not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Enriched Data Context (parallel fetches) ───
    const [
      employeesRes,
      completedTasksRes,
      activeTaskCountsRes,
      capacityRes,
      dependenciesRes,
      checklistsRes,
    ] = await Promise.all([
      // Team members
      supabase
        .from("employees")
        .select("id, full_name, role_title, department_id")
        .eq("tenant_id", tenantId)
        .eq("status", "active")
        .is("deleted_at", null)
        .limit(50),
      // Historical completed tasks (richer context)
      supabase
        .from("unified_tasks")
        .select("title, status, priority, estimated_minutes, actual_minutes, employee_id, tags, due_date, created_at, updated_at")
        .eq("tenant_id", tenantId)
        .eq("status", "completed")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
        .limit(50),
      // Active task counts per employee (workload)
      supabase
        .from("unified_tasks")
        .select("employee_id, status")
        .eq("tenant_id", tenantId)
        .in("status", ["open", "in_progress", "under_review", "pending_approval"])
        .is("deleted_at", null),
      // Employee capacity
      supabase
        .from("employee_capacity")
        .select("user_id, daily_capacity_minutes, weekly_capacity_minutes, max_concurrent_actions")
        .eq("tenant_id", tenantId)
        .is("deleted_at", null),
      // Existing dependencies for this task
      supabase
        .from("unified_task_dependencies")
        .select("source_task_id, target_task_id, dependency_type")
        .or(`source_task_id.eq.${task_id},target_task_id.eq.${task_id}`)
        .is("deleted_at", null),
      // Existing checklists for this task
      supabase
        .from("task_checklists")
        .select("title, status")
        .eq("task_id", task_id)
        .is("deleted_at", null),
    ]);

    const employees = employeesRes.data ?? [];
    const completedTasks = completedTasksRes.data ?? [];
    const activeTasks = activeTaskCountsRes.data ?? [];
    const capacityData = capacityRes.data ?? [];
    const existingDeps = dependenciesRes.data ?? [];
    const existingChecklist = checklistsRes.data ?? [];

    // Build workload map: employee_id → active task count
    const workloadMap: Record<string, number> = {};
    for (const t of activeTasks) {
      if (t.employee_id) {
        workloadMap[t.employee_id] = (workloadMap[t.employee_id] || 0) + 1;
      }
    }

    // Build capacity map
    const capacityMap: Record<string, any> = {};
    for (const c of capacityData) {
      capacityMap[c.user_id] = {
        daily_minutes: c.daily_capacity_minutes,
        weekly_minutes: c.weekly_capacity_minutes,
        max_concurrent: c.max_concurrent_actions,
      };
    }

    // Compute historical averages
    const completionStats = (() => {
      if (completedTasks.length === 0) return null;
      const withActual = completedTasks.filter((t: any) => t.actual_minutes && t.actual_minutes > 0);
      const avgActual = withActual.length > 0
        ? Math.round(withActual.reduce((sum: number, t: any) => sum + t.actual_minutes, 0) / withActual.length)
        : null;
      const estimateAccuracy = withActual.filter((t: any) => t.estimated_minutes > 0).length > 0
        ? Math.round(
            withActual
              .filter((t: any) => t.estimated_minutes > 0)
              .reduce((sum: number, t: any) => sum + (t.actual_minutes / t.estimated_minutes), 0) /
            withActual.filter((t: any) => t.estimated_minutes > 0).length * 100
          )
        : null;
      // Avg completion duration (created → updated)
      const durations = completedTasks
        .filter((t: any) => t.created_at && t.updated_at)
        .map((t: any) => (new Date(t.updated_at).getTime() - new Date(t.created_at).getTime()) / (1000 * 60));
      const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((a: number, b: number) => a + b, 0) / durations.length)
        : null;
      return {
        total_completed: completedTasks.length,
        avg_actual_minutes: avgActual,
        estimate_accuracy_pct: estimateAccuracy,
        avg_lifecycle_minutes: avgDuration,
      };
    })();

    // Fetch related tasks for dependency suggestions
    let relatedTasks: any[] = [];
    if (action === "suggest_dependencies") {
      const { data } = await supabase
        .from("unified_tasks")
        .select("id, title, status, priority, due_date, employee_id, tags")
        .eq("tenant_id", tenantId)
        .neq("id", task_id)
        .is("deleted_at", null)
        .in("status", ["open", "in_progress", "under_review", "pending_approval", "draft"])
        .order("created_at", { ascending: false })
        .limit(30);
      relatedTasks = data ?? [];
    }

    const taskContext = JSON.stringify({
      task: {
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        estimated_minutes: task.estimated_minutes,
        due_date: task.due_date,
        tags: task.tags,
        progress: task.progress,
        category: task.category,
        visibility: task.visibility,
        existing_checklist: existingChecklist,
        existing_dependencies: existingDeps,
      },
      employees: employees.map((e: any) => ({
        id: e.id,
        name: e.full_name,
        role: e.role_title,
        department_id: e.department_id,
        active_tasks: workloadMap[e.id] || 0,
        capacity: capacityMap[e.id] || null,
      })),
      completion_history: completionStats,
      historical_tasks: completedTasks.slice(0, 15).map((t: any) => ({
        title: t.title,
        priority: t.priority,
        estimated_minutes: t.estimated_minutes,
        actual_minutes: t.actual_minutes,
        tags: t.tags,
      })),
      ...(relatedTasks.length > 0 ? {
        related_active_tasks: relatedTasks.map((t: any) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          priority: t.priority,
          due_date: t.due_date,
          tags: t.tags,
        })),
      } : {}),
    });

    // ─── Tool definitions per action ───
    let tools: any[];
    let toolChoice: any;
    let systemPrompt: string;

    if (action === "suggest_assignee") {
      systemPrompt = `You are a task management AI for an enterprise platform. Analyze the task, team members' roles, their current workload (active_tasks count), and capacity limits. Suggest the top 3 best-fit assignees prioritizing: 1) Role relevance, 2) Low workload, 3) Available capacity. Be specific about why each person fits.`;
      tools = [{
        type: "function",
        function: {
          name: "suggest_assignees",
          description: "Return top 3 assignee suggestions for the task",
          parameters: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    employee_id: { type: "string" },
                    employee_name: { type: "string" },
                    confidence: { type: "number", description: "0-100 confidence score" },
                    reason: { type: "string", description: "Brief reason including workload consideration" },
                  },
                  required: ["employee_id", "employee_name", "confidence", "reason"],
                  additionalProperties: false,
                },
              },
            },
            required: ["suggestions"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "suggest_assignees" } };

    } else if (action === "estimate_completion") {
      systemPrompt = `You are a task estimation AI. Use the historical completion data (avg actual minutes, estimate accuracy, lifecycle durations) AND the current task details to produce a realistic time estimate. Factor in the task's complexity, priority, and any deadline pressure. Be data-driven.`;
      tools = [{
        type: "function",
        function: {
          name: "estimate_completion",
          description: "Estimate task completion time",
          parameters: {
            type: "object",
            properties: {
              estimated_minutes: { type: "number" },
              confidence: { type: "number", description: "0-100" },
              reasoning: { type: "string" },
              risk_factors: { type: "array", items: { type: "string" } },
            },
            required: ["estimated_minutes", "confidence", "reasoning", "risk_factors"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "estimate_completion" } };

    } else if (action === "predict_risk") {
      systemPrompt = `You are a task risk assessment AI. Analyze the task details, progress, deadline, team workload, and historical data to predict risks. Consider: deadline proximity, assignee workload saturation, dependency blockers, and historical estimate accuracy drift. Be specific and actionable.`;
      tools = [{
        type: "function",
        function: {
          name: "predict_risk",
          description: "Predict risks for the task",
          parameters: {
            type: "object",
            properties: {
              risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
              risk_score: { type: "number", description: "0-100" },
              risks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    description: { type: "string" },
                    impact: { type: "string", enum: ["low", "medium", "high"] },
                    mitigation: { type: "string" },
                  },
                  required: ["category", "description", "impact", "mitigation"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string" },
            },
            required: ["risk_level", "risk_score", "risks", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "predict_risk" } };

    } else if (action === "suggest_priority") {
      systemPrompt = `You are a task prioritization AI for an enterprise platform. Analyze the task title, description, tags, due date, existing team workload, and historical patterns to recommend the optimal priority level. Consider: deadline urgency, strategic alignment (tags), team capacity, and business impact. Provide a clear rationale.`;
      tools = [{
        type: "function",
        function: {
          name: "suggest_priority",
          description: "Suggest optimal priority for the task",
          parameters: {
            type: "object",
            properties: {
              suggested_priority: { type: "string", enum: ["low", "medium", "high", "critical"] },
              confidence: { type: "number", description: "0-100" },
              reasoning: { type: "string", description: "Why this priority level is recommended" },
              factors: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    factor: { type: "string", description: "e.g. deadline_urgency, business_impact, team_capacity" },
                    weight: { type: "string", enum: ["low", "medium", "high"] },
                    detail: { type: "string" },
                  },
                  required: ["factor", "weight", "detail"],
                  additionalProperties: false,
                },
              },
            },
            required: ["suggested_priority", "confidence", "reasoning", "factors"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "suggest_priority" } };

    } else if (action === "suggest_checklist") {
      systemPrompt = `You are a task breakdown AI for an enterprise platform. Based on the task title, description, priority, tags, and any existing checklist items, generate a practical checklist of actionable sub-items that would help complete this task. Each item should be specific, measurable, and completable. Do NOT duplicate existing checklist items. Generate 3-8 items depending on task complexity.`;
      tools = [{
        type: "function",
        function: {
          name: "suggest_checklist",
          description: "Generate checklist items for the task",
          parameters: {
            type: "object",
            properties: {
              items: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string", description: "Actionable checklist item" },
                    estimated_minutes: { type: "number", description: "Estimated minutes for this item" },
                  },
                  required: ["title", "estimated_minutes"],
                  additionalProperties: false,
                },
              },
              reasoning: { type: "string", description: "Brief explanation of the breakdown approach" },
            },
            required: ["items", "reasoning"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "suggest_checklist" } };

    } else if (action === "suggest_dependencies") {
      systemPrompt = `You are a dependency analysis AI for an enterprise task platform. Analyze the current task and the list of other active tasks in the organization. Identify tasks that should be linked as dependencies (blocks, blocked_by, or related). Only suggest meaningful dependencies based on: title/description semantic similarity, shared tags, deadline ordering, or logical workflow sequences. Return 0-5 suggestions — quality over quantity.`;
      tools = [{
        type: "function",
        function: {
          name: "suggest_dependencies",
          description: "Suggest task dependencies",
          parameters: {
            type: "object",
            properties: {
              suggestions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    task_id: { type: "string", description: "ID of the related task" },
                    task_title: { type: "string" },
                    dependency_type: { type: "string", enum: ["blocks", "blocked_by", "related"] },
                    confidence: { type: "number", description: "0-100" },
                    reason: { type: "string" },
                  },
                  required: ["task_id", "task_title", "dependency_type", "confidence", "reason"],
                  additionalProperties: false,
                },
              },
            },
            required: ["suggestions"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "suggest_dependencies" } };

    } else {
      return new Response(JSON.stringify({ error: "Unknown action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await fetch(AI_GATEWAY, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: taskContext },
        ],
        tools,
        tool_choice: toolChoice,
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const body = await aiResponse.text();
      console.error("AI gateway error:", status, body);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded, please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI analysis failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI returned no result" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("task-ai-engine error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
