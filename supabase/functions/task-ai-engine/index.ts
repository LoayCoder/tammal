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

    // Fetch task context
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

    // Fetch team members for assignee suggestions
    const { data: employees } = await supabase
      .from("employees")
      .select("id, full_name, role_title, department_id")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .is("deleted_at", null)
      .limit(50);

    // Fetch recent tasks for context
    const { data: recentTasks } = await supabase
      .from("unified_tasks")
      .select("title, status, priority, estimated_minutes, actual_minutes, employee_id")
      .eq("tenant_id", tenantId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(20);

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
      },
      employees: (employees ?? []).map((e: any) => ({
        id: e.id,
        name: e.full_name,
        role: e.role_title,
      })),
      recentTasks: (recentTasks ?? []).map((t: any) => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        estimated_minutes: t.estimated_minutes,
        actual_minutes: t.actual_minutes,
      })),
    });

    let tools: any[];
    let toolChoice: any;
    let systemPrompt: string;

    if (action === "suggest_assignee") {
      systemPrompt = `You are a task management AI assistant for an enterprise platform. Analyze the task and team members, then suggest the best assignees based on role relevance and workload balance. Return exactly 3 suggestions ranked by fit.`;
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
                    reason: { type: "string", description: "Brief reason why this person fits" },
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
      systemPrompt = `You are a task estimation AI. Based on the task details and historical task data, estimate the time to complete this task and predict the completion date. Be realistic and consider complexity.`;
      tools = [{
        type: "function",
        function: {
          name: "estimate_completion",
          description: "Estimate task completion time and date",
          parameters: {
            type: "object",
            properties: {
              estimated_minutes: { type: "number", description: "Estimated minutes to complete" },
              confidence: { type: "number", description: "0-100 confidence in the estimate" },
              reasoning: { type: "string", description: "Brief explanation of the estimate" },
              risk_factors: {
                type: "array",
                items: { type: "string" },
                description: "Factors that could affect the estimate",
              },
            },
            required: ["estimated_minutes", "confidence", "reasoning", "risk_factors"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "estimate_completion" } };
    } else if (action === "predict_risk") {
      systemPrompt = `You are a task risk assessment AI. Analyze the task details, progress, deadline, and context to predict risks and suggest mitigations. Be specific and actionable.`;
      tools = [{
        type: "function",
        function: {
          name: "predict_risk",
          description: "Predict risks for the task",
          parameters: {
            type: "object",
            properties: {
              risk_level: { type: "string", enum: ["low", "medium", "high", "critical"] },
              risk_score: { type: "number", description: "0-100 risk score" },
              risks: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string", description: "e.g. deadline, complexity, dependency" },
                    description: { type: "string" },
                    impact: { type: "string", enum: ["low", "medium", "high"] },
                    mitigation: { type: "string" },
                  },
                  required: ["category", "description", "impact", "mitigation"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string", description: "One-sentence risk summary" },
            },
            required: ["risk_level", "risk_score", "risks", "summary"],
            additionalProperties: false,
          },
        },
      }];
      toolChoice = { type: "function", function: { name: "predict_risk" } };
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
