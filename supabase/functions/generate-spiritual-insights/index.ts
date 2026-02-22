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

    // Get authenticated user
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { report_type, period_start, period_end } = await req.json();

    // Fetch spiritual data for the period
    const [prayerRes, quranRes, fastingRes] = await Promise.all([
      supabase
        .from("spiritual_prayer_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("prayer_date", period_start)
        .lte("prayer_date", period_end),
      supabase
        .from("spiritual_quran_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("session_date", period_start)
        .lte("session_date", period_end),
      supabase
        .from("spiritual_fasting_logs")
        .select("*")
        .eq("user_id", user.id)
        .gte("fast_date", period_start)
        .lte("fast_date", period_end),
    ]);

    const prayers = prayerRes.data || [];
    const quranSessions = quranRes.data || [];
    const fastingLogs = fastingRes.data || [];

    // Compute stats
    const completedPrayers = prayers.filter((p: any) =>
      p.status?.startsWith("completed")
    ).length;
    const totalPrayers = prayers.length;
    const prayerConsistency =
      totalPrayers > 0 ? Math.round((completedPrayers / totalPrayers) * 100) : 0;

    const totalQuranMin = quranSessions.reduce(
      (s: number, q: any) => s + (q.duration_minutes || 0),
      0
    );
    const avgQuranMin =
      quranSessions.length > 0
        ? Math.round(totalQuranMin / quranSessions.length)
        : 0;

    const completedFasts = fastingLogs.filter((f: any) => f.completed).length;

    // Build prompt for AI
    const statsContext = `
Spiritual Activity Summary for ${period_start} to ${period_end}:
- Prayer: ${completedPrayers} completed out of ${totalPrayers} logged (${prayerConsistency}% consistency)
- Qur'an: ${quranSessions.length} sessions, ${totalQuranMin} total minutes (avg ${avgQuranMin} min/session)
- Fasting: ${completedFasts} completed fasts out of ${fastingLogs.length} logged days
`;

    const prompt = `You are a compassionate spiritual wellness advisor. Based on the following activity data, provide a brief ${report_type} spiritual wellness report.

${statsContext}

Provide:
1. A warm, encouraging summary (2-3 sentences, non-judgmental)
2. 3 specific, actionable recommendations for the upcoming period
3. 2-3 highlights or achievements to celebrate

Important:
- Be positive and encouraging, never guilt-inducing
- Focus on progress, not perfection
- If data is sparse, gently encourage more engagement
- Keep total response under 200 words
- Return as JSON with fields: summary (string), recommendations (string array), highlights (string array), overallScore (number 1-10)`;

    // Call Lovable AI
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const aiResponse = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    let aiData = {
      summary: "Keep up your spiritual journey! Every small step matters.",
      recommendations: [
        "Try maintaining consistency in your daily prayers",
        "Set a small Qur'an reading goal each day",
        "Consider fasting on Mondays and Thursdays",
      ],
      highlights: ["You showed up and tracked your spiritual activities"],
      overallScore: 5,
    };

    if (aiResponse.ok) {
      const aiJson = await aiResponse.json();
      const content = aiJson.choices?.[0]?.message?.content;
      if (content) {
        try {
          aiData = JSON.parse(content);
        } catch {
          // Use defaults
        }
      }
    }

    // Store the report
    const reportData = {
      ...aiData,
      prayerStats: {
        completed: completedPrayers,
        total: totalPrayers,
        consistency: prayerConsistency,
      },
      quranStats: {
        sessions: quranSessions.length,
        totalMinutes: totalQuranMin,
        avgMinutes: avgQuranMin,
      },
      fastingStats: {
        completed: completedFasts,
        totalLogged: fastingLogs.length,
      },
    };

    const { data: savedReport, error: saveError } = await supabase
      .from("spiritual_insight_reports")
      .insert({
        user_id: user.id,
        report_type,
        period_start,
        period_end,
        report_data: reportData,
      })
      .select()
      .single();

    if (saveError) throw saveError;

    return new Response(JSON.stringify(savedReport), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
