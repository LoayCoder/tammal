import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

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
      .eq("user_id", userId)
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
      .eq("user_id", userId);
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
        .eq("user_id", userId)
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

      // Burnout predictions
      const { data: burnoutPred } = await admin
        .from("burnout_predictions")
        .select("burnout_probability_score, confidence_score, indicators, predicted_at")
        .eq("employee_id", emp.id)
        .eq("tenant_id", emp.tenant_id)
        .is("deleted_at", null)
        .order("predicted_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      scopeData = {
        moodEntries: (moods ?? []).slice(0, 14).map((m: any) => ({ level: m.level, date: m.entry_date })),
        streak,
        overdueTasks: overdueTasks ?? 0,
        activeTasks: activeTasks ?? 0,
        surveyResponsesLast14d: surveyResponses ?? 0,
        dailyCapacityMinutes: workload?.daily_capacity_minutes ?? null,
        weeklyCapacityMinutes: workload?.weekly_capacity_minutes ?? null,
        burnoutRisk: burnoutPred ? {
          score: burnoutPred.burnout_probability_score,
          confidence: burnoutPred.confidence_score,
          predictedAt: burnoutPred.predicted_at,
        } : null,
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

    // ── Dynamic Resource Discovery (mode-aware) ──
    const personalTools = [
      { key: "mood_tracker", title: "Mood Tracker", route: "/mental-toolkit/mood-tracker", type: "practice" },
      { key: "thought_reframer", title: "Thought Reframer", route: "/mental-toolkit/thought-reframer", type: "practice" },
      { key: "breathing", title: "Breathing & Grounding", route: "/mental-toolkit/breathing", type: "practice" },
      { key: "journaling", title: "Daily Journaling", route: "/mental-toolkit/journaling", type: "practice" },
      { key: "meditation", title: "Meditation Library", route: "/mental-toolkit/meditation", type: "practice" },
      { key: "habits", title: "Habits Planner", route: "/mental-toolkit/habits", type: "resource" },
      { key: "articles", title: "Psychoeducation Articles", route: "/mental-toolkit/articles", type: "resource" },
      { key: "assessment", title: "Self-Assessment", route: "/mental-toolkit/assessment", type: "resource" },
    ];

    const teamTools = [
      { key: "team_checkin", title: "Send Check-in Reminder", route: "/engagement-insights", type: "practice" },
      { key: "review_workload", title: "Review Team Workload", route: "/my-workload", type: "resource" },
      { key: "team_pulse", title: "View Team Pulse", route: "/engagement-insights", type: "resource" },
      { key: "view_insights", title: "View Engagement Insights", route: "/engagement-insights", type: "resource" },
    ];

    const orgTools = [
      { key: "launch_survey", title: "Launch Organization Survey", route: "/admin/questions", type: "resource" },
      { key: "org_analytics", title: "Review Wellness Analytics", route: "/engagement-insights", type: "resource" },
      { key: "review_workload", title: "Review Workload Distribution", route: "/admin/workload/dashboard", type: "resource" },
      { key: "team_pulse", title: "View Organization Pulse", route: "/engagement-insights", type: "resource" },
    ];

    const wellnessTools =
      mode === "personal" ? personalTools :
      mode === "team" ? teamTools :
      orgTools;

    // First Aiders — dynamic from DB
    const { data: firstAiders } = await admin
      .from("mh_first_aiders")
      .select("id, specializations, languages")
      .eq("tenant_id", emp.tenant_id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .limit(50);

    const firstAiderInfo = {
      count: (firstAiders ?? []).length,
      available: (firstAiders ?? []).length > 0,
      specializations: [...new Set((firstAiders ?? []).flatMap((fa: any) => fa.specializations ?? []))],
    };

    // Emergency contacts — dynamic from DB
    const { data: emergencyContacts } = await admin
      .from("mh_emergency_contacts")
      .select("id")
      .eq("tenant_id", emp.tenant_id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .limit(10);

    const emergencyInfo = {
      count: (emergencyContacts ?? []).length,
      available: (emergencyContacts ?? []).length > 0,
    };

    const availableResources = {
      wellnessTools,
      firstAiders: firstAiderInfo,
      emergencyContacts: emergencyInfo,
      supportRoutes: {
        crisisSupport: "/crisis-support",
        wellnessHub: "/wellness",
        firstAiderConnect: "/crisis-support",
      },
    };

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
- Keep each field to 1-2 sentences maximum.
- If burnoutRisk data is present and score > 60, this MUST influence your urgencyLevel (set to "attention" or "urgent").
- If burnoutRisk score > 80, urgencyLevel MUST be "urgent" and include support recommendation.

AVAILABLE RESOURCES (use ONLY these for recommendations):
${JSON.stringify(availableResources, null, 2)}

RECOMMENDATION RULES:
- Generate 2-4 recommendations from the available resources above.
- ONLY recommend resources that exist in the catalog.
- Each recommendation must include: type (practice/resource/support), key, title, description, and route.
- Always include at least one practice recommendation.
- When urgencyLevel is "attention" or "urgent", include at least one support recommendation (first_aider or crisis_support).
- For support recommendations: use key "first_aider" with route "/crisis-support" if first aiders are available, or key "crisis_support" with route "/crisis-support" if emergency contacts exist.
- Match recommendations to the user's current state (mood trends, workload, burnout risk, urgency).
${mode === "personal" ? `- For high workload + low mood: prioritize breathing/meditation practices and workload reduction.
- For declining mood trends: prioritize mood tracker, journaling, and peer/first aider support.` :
mode === "team" ? `- You are advising a MANAGER about their TEAM. Recommend MANAGER ACTIONS only.
- NEVER recommend personal wellness exercises (breathing, meditation, journaling) — those are for personal mode.
- Instead recommend: sending check-in reminders, reviewing team workload, launching wellness surveys, viewing team pulse.
- Focus on what the manager can DO for their team, not what individuals should do for themselves.` :
`- You are advising an ADMIN about the ORGANIZATION. Recommend ORGANIZATIONAL ACTIONS only.
- NEVER recommend personal wellness exercises — those are for personal mode.
- Instead recommend: launching surveys, reviewing analytics, reviewing workload distribution, viewing org pulse.
- Focus on systemic organizational actions, not individual wellness practices.`}`;

    const userPrompt = `Mode: ${modeLabels[mode]}
Data: ${JSON.stringify(scopeData)}

Analyze this ${mode} wellness data and generate a structured insight with contextual recommendations.`;

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
                  recommendations: {
                    type: "array",
                    description: "2-4 contextual recommendations from the available resources catalog. Each must reference an actual available tool, resource, or support service.",
                    items: {
                      type: "object",
                      properties: {
                        type: { type: "string", enum: ["practice", "resource", "support"], description: "Category of recommendation" },
                        key: { type: "string", description: "Unique key: e.g. breathing, mood_tracker, first_aider, crisis_support, articles" },
                        title: { type: "string", description: "Display title for the recommendation" },
                        description: { type: "string", description: "One-sentence description of why this is recommended" },
                        route: { type: "string", description: "App route to navigate to" },
                      },
                      required: ["type", "key", "title", "description", "route"],
                    },
                  },
                },
                required: ["primaryInsight", "recommendedAction", "reasoning", "basisStatement", "urgencyLevel", "actionCta", "recommendations"],
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

    // Persist to insight history for the employee (fire-and-forget)
    admin.from("copilot_insight_history").insert({
      user_id: userId,
      tenant_id: emp.tenant_id,
      mode,
      urgency_level: insight.urgencyLevel ?? "neutral",
      primary_insight: insight.primaryInsight ?? "",
      secondary_insight: insight.secondaryInsight ?? null,
      recommended_action: insight.recommendedAction ?? null,
      reasoning: insight.reasoning ?? null,
      basis_statement: insight.basisStatement ?? null,
      action_cta: insight.actionCta ?? null,
      recommendations: insight.recommendations ?? null,
      insight_date: todayStr,
    }).then(({ error: histErr }) => {
      if (histErr) console.error("Failed to save insight history:", histErr.message);
    });

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
