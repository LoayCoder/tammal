import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type CopilotMode = "personal" | "team" | "organization";

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

    // Auth — pass the bearer token explicitly in edge runtime
    const authHeader = req.headers.get("authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anonClient.auth.getClaims(token);
    if (claimsError || !claimsData?.claims)
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    const userId = claimsData.claims.sub as string;

    const { mode = "personal", language = "en" } = await req.json() as {
      mode?: CopilotMode;
      language?: string;
    };

    if (!["personal", "team", "organization"].includes(mode)) {
      return new Response(JSON.stringify({ error: "Invalid mode" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Resolve employee + tenant
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

    // Check direct reports for manager mode
    let hasDirectReports = false;
    if (mode === "team" || mode === "organization") {
      const { count } = await admin
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("manager_id", emp.id)
        .is("deleted_at", null);
      hasDirectReports = (count ?? 0) > 0;
    }

    // Authorize mode
    if (mode === "team" && !isManager && !hasDirectReports) {
      return new Response(JSON.stringify({ error: "Not authorized for team mode" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (mode === "organization" && !isAdmin) {
      return new Response(JSON.stringify({ error: "Not authorized for organization mode" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Scope key for caching
    const scopeKey =
      mode === "personal" ? `personal:${emp.id}` :
      mode === "team" ? `team:${emp.id}` :
      `org:${emp.tenant_id}`;

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
    const fourteenDaysAgo = new Date(Date.now() - 14 * 86400000).toISOString();
    let scopeData: Record<string, any> = {};

    if (mode === "personal") {
      // Mood entries
      const { data: moods } = await admin
        .from("mood_entries")
        .select("level, entry_date, note")
        .eq("employee_id", emp.id)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .gte("entry_date", fourteenDaysAgo.split("T")[0])
        .order("entry_date", { ascending: false })
        .limit(30);

      // Streak (count consecutive days)
      const moodDates = [...new Set((moods ?? []).map((m: any) => m.entry_date))].sort().reverse();
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < moodDates.length; i++) {
        const expected = new Date(today);
        expected.setDate(expected.getDate() - i);
        const expStr = expected.toISOString().split("T")[0];
        // Allow 1-day grace
        if (moodDates[i] === expStr || (i === 0 && moodDates[0] === new Date(Date.now() - 86400000).toISOString().split("T")[0])) {
          streak++;
        } else if (i === 0) {
          // Check if yesterday matches
          const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split("T")[0];
          if (moodDates[0] === yesterdayStr) { streak++; continue; }
          break;
        } else break;
      }

      // Overdue tasks
      const { count: overdueTasks } = await admin
        .from("unified_tasks")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", emp.id)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .not("status", "in", '("completed","archived","rejected")')
        .lt("due_date", new Date().toISOString());

      // Workload
      const { data: workload } = await admin
        .from("employee_capacity")
        .select("daily_capacity_minutes, weekly_capacity_minutes")
        .eq("user_id", user.id)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .maybeSingle();

      // Active tasks count
      const { count: activeTasks } = await admin
        .from("unified_tasks")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", emp.id)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .in("status", ["open", "in_progress", "under_review", "pending_approval"]);

      // Survey responses last 14d
      const { count: surveyResponses } = await admin
        .from("employee_responses")
        .select("id", { count: "exact", head: true })
        .eq("employee_id", emp.id)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .gte("created_at", fourteenDaysAgo);

      scopeData = {
        moodEntries: (moods ?? []).slice(0, 14).map((m: any) => ({ level: m.level, date: m.entry_date })),
        streak,
        overdueTasks: overdueTasks ?? 0,
        activeTasks: activeTasks ?? 0,
        surveyResponsesLast14d: surveyResponses ?? 0,
        dailyCapacityMinutes: workload?.daily_capacity_minutes ?? null,
        weeklyCapacityMinutes: workload?.weekly_capacity_minutes ?? null,
      };
    } else if (mode === "team") {
      // Get direct reports
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

      // Team mood distribution
      const { data: teamMoods } = await admin
        .from("mood_entries")
        .select("level, entry_date, employee_id")
        .in("employee_id", reportIds)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .gte("entry_date", fourteenDaysAgo.split("T")[0])
        .order("entry_date", { ascending: false })
        .limit(5000);

      const moodDist: Record<string, number> = {};
      (teamMoods ?? []).forEach((m: any) => { moodDist[m.level] = (moodDist[m.level] || 0) + 1; });

      // Unique participants
      const participants = new Set((teamMoods ?? []).map((m: any) => m.employee_id)).size;

      // Team overdue tasks
      const { count: teamOverdue } = await admin
        .from("unified_tasks")
        .select("id", { count: "exact", head: true })
        .in("employee_id", reportIds)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .not("status", "in", '("completed","archived","rejected")')
        .lt("due_date", new Date().toISOString());

      scopeData = {
        teamSize: reportIds.length,
        moodDistribution: moodDist,
        participationRate: reportIds.length > 0 ? Math.round((participants / reportIds.length) * 100) : 0,
        overdueTasksCount: teamOverdue ?? 0,
        totalMoodEntries: (teamMoods ?? []).length,
      };
    } else {
      // Organization mode
      // Org mood trend
      const { data: orgMoods } = await admin
        .from("mood_entries")
        .select("level, entry_date, employee_id")
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .gte("entry_date", fourteenDaysAgo.split("T")[0])
        .order("entry_date", { ascending: false })
        .limit(10000);

      const orgMoodDist: Record<string, number> = {};
      (orgMoods ?? []).forEach((m: any) => { orgMoodDist[m.level] = (orgMoodDist[m.level] || 0) + 1; });

      // Total employees
      const { count: totalEmps } = await admin
        .from("employees")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .eq("status", "active");

      // Unique checkin participants
      const uniqueParticipants = new Set((orgMoods ?? []).map((m: any) => m.employee_id)).size;

      // Org overdue
      const { count: orgOverdue } = await admin
        .from("unified_tasks")
        .select("id", { count: "exact", head: true })
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .not("status", "in", '("completed","archived","rejected")')
        .lt("due_date", new Date().toISOString());

      // Department participation
      const { data: depts } = await admin
        .from("departments")
        .select("id, name, name_ar")
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .eq("is_active", true)
        .limit(50);

      scopeData = {
        totalEmployees: totalEmps ?? 0,
        moodDistribution: orgMoodDist,
        totalMoodEntries: (orgMoods ?? []).length,
        overdueTasksCount: orgOverdue ?? 0,
        activeDays: uniqueParticipants,
        departmentCount: (depts ?? []).length,
      };
    }

    // Check if there's enough data
    const hasData =
      mode === "personal"
        ? (scopeData.moodEntries?.length ?? 0) >= 2 || scopeData.activeTasks > 0
        : mode === "team"
        ? scopeData.totalMoodEntries > 0 || scopeData.overdueTasksCount > 0
        : scopeData.totalMoodEntries > 0 || scopeData.overdueTasksCount > 0;

    if (!hasData) {
      const fallbackCta =
        mode === "personal" ? "complete_checkin" :
        mode === "team" ? "review_workload" : "launch_survey";
      const result = { insufficientData: true, fallbackCta };
      // Cache insufficient data too (short-lived)
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
    const systemPrompt = `You are a premium Wellness Copilot for a workplace wellbeing platform.
Your role is to analyze wellness data and provide one actionable insight to improve employee wellbeing.

RULES:
- Be concise, warm, and professional with a premium executive tone.
- NEVER use clinical or medical diagnostic language.
- NEVER use fear-based or alarmist wording.
- ONLY reference patterns visible in the provided data.
- For team/org modes: NEVER identify or reference individual employees by name.
- Use aggregated patterns only for team and organization insights.
- Response language: ${language === "ar" ? "Arabic" : "English"}.
- Keep each field to 1-2 sentences maximum.`;

    const userPrompt = `Mode: ${modeLabels[mode]}
Data: ${JSON.stringify(scopeData)}

Analyze this ${mode} wellness data and generate a structured insight.`;

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
              name: "generate_wellness_insight",
              description: "Generate a structured wellness insight for the copilot dashboard.",
              parameters: {
                type: "object",
                properties: {
                  primaryInsight: { type: "string", description: "Main insight about the wellness pattern (1-2 sentences)" },
                  recommendedAction: { type: "string", description: "One specific recommended action (1 sentence)" },
                  reasoning: { type: "string", description: "Why this matters (1 sentence)" },
                  basisStatement: { type: "string", description: "What data this is based on (1 short phrase)" },
                  urgencyLevel: { type: "string", enum: ["opportunity", "neutral", "attention", "urgent"] },
                  secondaryInsight: { type: "string", description: "Optional secondary observation (1 sentence or empty)" },
                  actionCta: { type: "string", enum: ["complete_checkin", "review_workload", "view_team", "launch_survey", "view_insights", "take_break", "review_tasks"] },
                },
                required: ["primaryInsight", "recommendedAction", "reasoning", "basisStatement", "urgencyLevel", "actionCta"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "generate_wellness_insight" } },
      }),
    });

    if (!aiResponse.ok) {
      const status = aiResponse.status;
      const body = await aiResponse.text();
      console.error("AI gateway error:", status, body);
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited, please try again later" }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted" }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // Graceful fallback
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

    const result = { ...insight, insufficientData: false, mode, generatedAt: new Date().toISOString() };

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
    console.error("Wellness copilot error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
