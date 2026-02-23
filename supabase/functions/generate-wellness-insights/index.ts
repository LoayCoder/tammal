import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get tenant
    const { data: profile } = await supabase
      .from("profiles")
      .select("tenant_id")
      .eq("user_id", user.id)
      .single();

    if (!profile?.tenant_id) {
      return new Response(JSON.stringify({ error: "No tenant" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tenantId = profile.tenant_id;
    const today = new Date().toISOString().slice(0, 10);

    // Check cache first
    const { data: cached } = await supabase
      .from("wellness_insight_cache")
      .select("insight_data")
      .eq("tenant_id", tenantId)
      .eq("insight_date", today)
      .maybeSingle();

    if (cached?.insight_data) {
      return new Response(JSON.stringify(cached.insight_data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the analytics data from request body
    const body = await req.json();
    const { analyticsData, language } = body;

    if (!analyticsData) {
      return new Response(JSON.stringify({ error: "No analytics data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call Lovable AI
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const isAr = language === "ar";
    const prompt = `You are an organizational wellness analytics expert. Analyze the following wellness data and provide strategic insights for leadership.

DATA:
- Active Employees: ${analyticsData.activeEmployees}
- Average Mood Score: ${analyticsData.avgMoodScore}/5
- Participation Rate: ${analyticsData.participationRate}%
- Risk Percentage: ${analyticsData.riskPercentage}%
- Health Score: ${analyticsData.healthScore}/100
- Top Risk Categories: ${JSON.stringify(analyticsData.topRisks?.slice(0, 3) ?? [])}
- Early Warnings: ${JSON.stringify(analyticsData.warnings?.slice(0, 5) ?? [])}
- Period Comparison: ${JSON.stringify(analyticsData.periodComparison ?? {})}

Respond in ${isAr ? "Arabic" : "English"} with a JSON object containing:
{
  "executiveSummary": "2-3 sentence overview of organizational wellness state",
  "recommendations": [
    { "priority": "high|medium|low", "title": "short title", "description": "actionable recommendation" }
  ],
  "predictedRisks": ["risk area 1", "risk area 2"],
  "positiveHighlights": ["positive finding 1", "positive finding 2"]
}

Keep recommendations to 3-5 items, prioritized. Be specific and actionable.`;

    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      console.error("AI API error:", aiResponse.status, await aiResponse.text());
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content ?? "";

    // Parse JSON from response
    let insights;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      insights = jsonMatch ? JSON.parse(jsonMatch[0]) : {
        executiveSummary: content,
        recommendations: [],
        predictedRisks: [],
        positiveHighlights: [],
      };
    } catch {
      insights = {
        executiveSummary: content,
        recommendations: [],
        predictedRisks: [],
        positiveHighlights: [],
      };
    }

    // Cache result
    await supabase.from("wellness_insight_cache").upsert({
      tenant_id: tenantId,
      insight_date: today,
      insight_data: insights,
    }, { onConflict: "tenant_id,insight_date" });

    return new Response(JSON.stringify(insights), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
