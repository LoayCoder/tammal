import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type PulseMode = "personal" | "team" | "organization";

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Auth
    const authHeader = req.headers.get("authorization") ?? "";
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await anonClient.auth.getUser();
    if (authErr || !user)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const { mode = "personal", language = "en" } = await req.json() as {
      mode?: PulseMode;
      language?: string;
    };

    if (!["personal", "team", "organization"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Resolve employee
    const { data: emp } = await admin
      .from("employees")
      .select("id, tenant_id, full_name, manager_id, department_id")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (!emp) {
      return new Response(JSON.stringify({ error: "Employee not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve roles
    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roleSet = new Set((roles ?? []).map((r: any) => r.role));
    const isAdmin = roleSet.has("super_admin") || roleSet.has("tenant_admin");
    const isManager = roleSet.has("manager") || isAdmin;

    // Check direct reports
    let hasDirectReports = false;
    if (mode === "team" || mode === "organization") {
      const { count } = await admin
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("manager_id", emp.id)
        .is("deleted_at", null);
      hasDirectReports = (count ?? 0) > 0;
    }

    // Authorize
    if (mode === "team" && !isManager && !hasDirectReports) {
      return new Response(JSON.stringify({ error: "Not authorized for team mode" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (mode === "organization" && !isAdmin) {
      return new Response(JSON.stringify({ error: "Not authorized for organization mode" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Cache key
    const scopeKey =
      mode === "personal" ? `pulse:personal:${emp.id}` :
      mode === "team" ? `pulse:team:${emp.id}` :
      `pulse:org:${emp.tenant_id}`;

    const todayStr = new Date().toISOString().split("T")[0];

    // Check cache
    const { data: cached } = await admin
      .from("copilot_insight_cache")
      .select("insight_data")
      .eq("scope_key", scopeKey)
      .eq("insight_date", todayStr)
      .maybeSingle();

    if (cached?.insight_data) {
      return new Response(JSON.stringify(cached.insight_data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Data Aggregation ──
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();
    const thirtyDaysAgoDate = thirtyDaysAgo.split("T")[0];
    let scopeData: Record<string, any> = {};

    if (mode === "personal") {
      // Check-in consistency (30 days)
      const { data: moods } = await admin
        .from("mood_entries")
        .select("level, entry_date")
        .eq("employee_id", emp.id)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .gte("entry_date", thirtyDaysAgoDate)
        .order("entry_date", { ascending: false });

      const checkinDays = new Set((moods ?? []).map((m: any) => m.entry_date)).size;

      // Survey participation
      const { count: surveyResponses } = await admin
        .from("employee_responses")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", emp.id)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .gte("created_at", thirtyDaysAgo);

      // Task completion
      const { count: completedTasks } = await admin
        .from("unified_tasks")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", emp.id)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .eq("status", "completed")
        .gte("updated_at", thirtyDaysAgo);

      const { count: totalTasks } = await admin
        .from("unified_tasks")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", emp.id)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .gte("created_at", thirtyDaysAgo);

      // Recognition (appreciations sent + received)
      const { count: appreciationsReceived } = await admin
        .from("appreciations")
        .select("id", { count: "exact", head: true })
        .eq("to_employee_id", emp.id)
        .is("deleted_at", null)
        .gte("created_at", thirtyDaysAgo);

      const { count: appreciationsSent } = await admin
        .from("appreciations")
        .select("id", { count: "exact", head: true })
        .eq("from_employee_id", emp.id)
        .is("deleted_at", null)
        .gte("created_at", thirtyDaysAgo);

      // Streak
      const moodDates = [...new Set((moods ?? []).map((m: any) => m.entry_date))].sort().reverse();
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < moodDates.length; i++) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        const expStr = expected.toISOString().split("T")[0];
        if (moodDates[i] === expStr) { streak++; } else if (i === 0) {
          const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
          if (moodDates[0] === yesterdayStr) { streak++; continue; }
          break;
        } else break;
      }

      // Compute composite score
      const checkinScore = Math.min((checkinDays / 30) * 100, 100);
      const surveyScore = Math.min(((surveyResponses ?? 0) / 5) * 100, 100);
      const taskScore = (totalTasks ?? 0) > 0 ? ((completedTasks ?? 0) / (totalTasks ?? 0)) * 100 : 50;
      const recognitionScore = Math.min((((appreciationsReceived ?? 0) + (appreciationsSent ?? 0)) / 10) * 100, 100);
      const streakScore = Math.min((streak / 14) * 100, 100);

      const engagementScore = Math.round(
        checkinScore * 0.30 + surveyScore * 0.20 + taskScore * 0.15 + recognitionScore * 0.20 + streakScore * 0.15
      );

      // Overdue tasks
      const { count: overdueTasks } = await admin
        .from("unified_tasks")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", emp.id)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .not("status", "in", '("completed","archived")')
        .lt("due_date", todayStr)
        .not("due_date", "is", null);

      scopeData = {
        engagementScore,
        checkinDays,
        surveyResponses: surveyResponses ?? 0,
        completedTasks: completedTasks ?? 0,
        totalTasks: totalTasks ?? 0,
        overdueTasks: overdueTasks ?? 0,
        appreciationsReceived: appreciationsReceived ?? 0,
        appreciationsSent: appreciationsSent ?? 0,
        streak,
        moodTrend: (moods ?? []).slice(0, 7).map((m: any) => m.level),
      };
    } else if (mode === "team") {
      const { data: reports } = await admin
        .from("employees")
        .select("id")
        .eq("manager_id", emp.id)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .limit(200);
      const reportIds = (reports ?? []).map((r: any) => r.id);

      if (reportIds.length === 0) {
        const result = { insufficientData: true, fallbackCta: "no_team_members" };
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Team check-ins
      const { data: teamMoods } = await admin
        .from("mood_entries")
        .select("employee_id, entry_date")
        .in("employee_id", reportIds)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .gte("entry_date", thirtyDaysAgoDate)
        .limit(5000);

      const participatingMembers = new Set((teamMoods ?? []).map((m: any) => m.employee_id)).size;
      const participationRate = Math.round((participatingMembers / reportIds.length) * 100);

      // Team task completion
      const { count: teamCompleted } = await admin
        .from("unified_tasks")
        .select("id", { count: "exact", head: true })
        .in("employee_id", reportIds)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .eq("status", "completed")
        .gte("updated_at", thirtyDaysAgo);

      const { count: teamTotal } = await admin
        .from("unified_tasks")
        .select("id", { count: "exact", head: true })
        .in("employee_id", reportIds)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .gte("created_at", thirtyDaysAgo);

      // Team appreciations
      const { count: teamAppreciations } = await admin
        .from("appreciations")
        .select("id", { count: "exact", head: true })
        .in("to_employee_id", reportIds)
        .is("deleted_at", null)
        .gte("created_at", thirtyDaysAgo);

      const checkinScore = Math.min(participationRate, 100);
      const taskScore = (teamTotal ?? 0) > 0 ? ((teamCompleted ?? 0) / (teamTotal ?? 0)) * 100 : 50;
      const recognitionScore = Math.min(((teamAppreciations ?? 0) / (reportIds.length * 2)) * 100, 100);

      const engagementScore = Math.round(
        checkinScore * 0.35 + taskScore * 0.30 + recognitionScore * 0.20 + (participationRate > 50 ? 15 : participationRate * 0.15)
      );

      // Team overdue tasks
      const { count: teamOverdue } = await admin
        .from("unified_tasks")
        .select("id", { count: "exact", head: true })
        .in("employee_id", reportIds)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .not("status", "in", '("completed","archived")')
        .lt("due_date", todayStr)
        .not("due_date", "is", null);

      scopeData = {
        engagementScore,
        teamSize: reportIds.length,
        participationRate,
        teamCompletedTasks: teamCompleted ?? 0,
        teamTotalTasks: teamTotal ?? 0,
        teamOverdueTasks: teamOverdue ?? 0,
        teamAppreciations: teamAppreciations ?? 0,
        totalCheckins: (teamMoods ?? []).length,
      };
    } else {
      // Organization mode
      const { count: totalEmps } = await admin
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .eq("status", "active");

      const { data: orgMoods } = await admin
        .from("mood_entries")
        .select("employee_id, entry_date")
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .gte("entry_date", thirtyDaysAgoDate)
        .limit(10000);

      const orgParticipants = new Set((orgMoods ?? []).map((m: any) => m.employee_id)).size;
      const orgParticipationRate = (totalEmps ?? 0) > 0 ? Math.round((orgParticipants / (totalEmps ?? 1)) * 100) : 0;

      const { count: orgCompleted } = await admin
        .from("unified_tasks")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .eq("status", "completed")
        .gte("updated_at", thirtyDaysAgo);

      const { count: orgTotal } = await admin
        .from("unified_tasks")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .gte("created_at", thirtyDaysAgo);

      const { count: orgAppreciations } = await admin
        .from("appreciations")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .gte("created_at", thirtyDaysAgo);

      const checkinScore = Math.min(orgParticipationRate, 100);
      const taskScore = (orgTotal ?? 0) > 0 ? ((orgCompleted ?? 0) / (orgTotal ?? 0)) * 100 : 50;
      const recognitionScore = Math.min(((orgAppreciations ?? 0) / Math.max((totalEmps ?? 1), 1)) * 100, 100);

      const engagementScore = Math.round(
        checkinScore * 0.35 + taskScore * 0.30 + recognitionScore * 0.20 + (orgParticipationRate > 50 ? 15 : orgParticipationRate * 0.15)
      );

      // Org overdue tasks
      const { count: orgOverdue } = await admin
        .from("unified_tasks")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .not("status", "in", '("completed","archived")')
        .lt("due_date", todayStr)
        .not("due_date", "is", null);

      scopeData = {
        engagementScore,
        totalEmployees: totalEmps ?? 0,
        participationRate: orgParticipationRate,
        completedTasks: orgCompleted ?? 0,
        totalTasks: orgTotal ?? 0,
        overdueTasks: orgOverdue ?? 0,
        totalAppreciations: orgAppreciations ?? 0,
        totalCheckins: (orgMoods ?? []).length,
      };
    }

    // Check if data exists
    const hasData =
      mode === "personal"
        ? scopeData.checkinDays > 0 || scopeData.totalTasks > 0
        : scopeData.totalCheckins > 0 || (scopeData.teamTotalTasks ?? scopeData.totalTasks ?? 0) > 0;

    if (!hasData) {
      const result = { insufficientData: true, fallbackCta: mode === "personal" ? "complete_checkin" : "review_team" };
      await admin.from("copilot_insight_cache").upsert({
        scope_key: scopeKey,
        tenant_id: emp.tenant_id,
        insight_date: todayStr,
        insight_data: result,
      }, { onConflict: "scope_key,insight_date" });
      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── AI Generation ──
    const modeLabels = { personal: "Personal", team: "Team", organization: "Organization" };
    const systemPrompt = `You are a premium Engagement Intelligence Copilot for a workplace platform.
Your role is to analyze engagement data and provide ONE actionable insight to improve engagement.

RULES:
- Be concise, warm, and professional with a premium executive tone.
- Focus on ENGAGEMENT (participation, collaboration, recognition, task completion) not mental health.
- NEVER use clinical or medical language.
- For team/org modes: NEVER identify individual employees.
- Response language: ${language === "ar" ? "Arabic" : "English"}.
- Keep each field to 1-2 sentences maximum.
- The engagementScore is already computed — use it as context but focus on actionable insights.
- targetValue should be a realistic improvement goal (e.g., if current checkin days = 10, target might be 15).
- actionPath should be a valid app route like /employee/survey, /my-workload, /admin/workload/dashboard, etc.
- actionCta should be a short button label in ${language === "ar" ? "Arabic" : "English"}.`;

    const userPrompt = `Mode: ${modeLabels[mode]}
Data: ${JSON.stringify(scopeData)}

Analyze this ${mode} engagement data and generate a structured engagement insight.`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_pulse_insight",
              description: "Generate a structured engagement insight for the Team Pulse Action Hub.",
              parameters: {
                type: "object",
                properties: {
                  primaryInsight: { type: "string", description: "Main insight about engagement pattern (1-2 sentences)" },
                  recommendedAction: { type: "string", description: "One specific recommended action (1 sentence)" },
                  trend: { type: "string", enum: ["up", "down", "stable"], description: "Engagement trend direction" },
                  targetMetric: { type: "string", description: "Name of the target metric to improve (e.g., 'Daily check-ins this month')" },
                  targetValue: { type: "number", description: "Target value to reach" },
                  currentValue: { type: "number", description: "Current value of the target metric" },
                  actionPath: { type: "string", description: "App route for the action CTA (e.g., /employee/survey)" },
                  actionCta: { type: "string", description: "Short button label text" },
                  impactReason: { type: "string", description: "One sentence explaining WHY this action matters for engagement" },
                },
                required: ["primaryInsight", "recommendedAction", "trend", "targetMetric", "targetValue", "currentValue", "actionPath", "actionCta", "impactReason"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_pulse_insight" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      console.error("AI gateway error:", status, await aiResponse.text());
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(
        JSON.stringify({ insufficientData: true, fallbackCta: "complete_checkin", error: "AI temporarily unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    let insight: any;
    try {
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      insight = JSON.parse(toolCall.function.arguments);
    } catch {
      console.error("Failed to parse AI response:", JSON.stringify(aiResult));
      return new Response(
        JSON.stringify({ insufficientData: true, fallbackCta: "complete_checkin", error: "AI response parse error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = {
      ...insight,
      engagementScore: scopeData.engagementScore,
      insufficientData: false,
      mode,
      generatedAt: new Date().toISOString(),
    };

    // Persist target for history tracking (upsert to prevent duplicates on retry)
    try {
      const employeeIdForTarget = mode === "organization" ? "00000000-0000-0000-0000-000000000000" : emp.id;
      await admin.from("pulse_targets").upsert({
        tenant_id: emp.tenant_id,
        employee_id: mode === "organization" ? null : emp.id,
        scope: mode,
        target_metric: insight.targetMetric ?? "engagement",
        target_value: insight.targetValue ?? 0,
        current_value: insight.currentValue ?? 0,
        target_date: todayStr,
      }, { onConflict: "idx_pulse_targets_unique_daily", ignoreDuplicates: true });
    } catch (targetErr) {
      console.error("Failed to persist pulse target:", targetErr);
    }

    // Cache
    await admin.from("copilot_insight_cache").upsert({
      scope_key: scopeKey,
      tenant_id: emp.tenant_id,
      insight_date: todayStr,
      insight_data: result,
    }, { onConflict: "scope_key,insight_date" });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Team pulse engine error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
