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

    // Calculate unique prayer days and daily consistency
    const prayerDates = new Set(prayers.map((p: any) => p.prayer_date));
    const totalDays = Math.max(1, Math.ceil(
      (new Date(period_end).getTime() - new Date(period_start).getTime()) / (1000 * 60 * 60 * 24)
    ) + 1);
    const daysWithPrayer = prayerDates.size;

    // 5 obligatory prayers per day
    const expectedPrayers = totalDays * 5;
    const prayerConsistency = expectedPrayers > 0
      ? Math.round((completedPrayers / expectedPrayers) * 100)
      : 0;

    // Count prayers by name for detailed breakdown
    const prayerBreakdown: Record<string, number> = {};
    prayers.filter((p: any) => p.status?.startsWith("completed")).forEach((p: any) => {
      const name = p.prayer_name || "unknown";
      prayerBreakdown[name] = (prayerBreakdown[name] || 0) + 1;
    });

    const totalQuranMin = quranSessions.reduce(
      (s: number, q: any) => s + (q.duration_minutes || 0),
      0
    );
    const avgQuranMin =
      quranSessions.length > 0
        ? Math.round(totalQuranMin / quranSessions.length)
        : 0;

    // Count unique Quran reading days
    const quranDates = new Set(quranSessions.map((q: any) => q.session_date));

    const completedFasts = fastingLogs.filter((f: any) => f.completed).length;

    // Determine fasting types
    const fastingTypes: Record<string, number> = {};
    fastingLogs.filter((f: any) => f.completed).forEach((f: any) => {
      const type = f.fast_type || "voluntary";
      fastingTypes[type] = (fastingTypes[type] || 0) + 1;
    });

    // Build accurate prompt
    const prayerDetail = Object.entries(prayerBreakdown)
      .map(([name, count]) => `${name}: ${count}`)
      .join(", ");

    const fastingDetail = Object.entries(fastingTypes)
      .map(([type, count]) => `${type}: ${count}`)
      .join(", ");

    const statsContext = `
Spiritual Activity Report — ${period_start} to ${period_end} (${totalDays} days):

SALAH (Prayer):
- ${completedPrayers} prayers completed out of ${expectedPrayers} expected (${prayerConsistency}% consistency)
- ${daysWithPrayer} out of ${totalDays} days had at least one prayer logged
- Breakdown: ${prayerDetail || "no breakdown available"}
- Missed prayers: ${expectedPrayers - completedPrayers}

QUR'AN:
- ${quranSessions.length} reading sessions across ${quranDates.size} unique days
- Total: ${totalQuranMin} minutes (avg ${avgQuranMin} min/session)

FASTING:
- ${completedFasts} completed fasts out of ${fastingLogs.length} logged
- Types: ${fastingDetail || "not specified"}
`;

    const prompt = `You are a knowledgeable Islamic spiritual wellness advisor grounded in Qur'an and Sunnah.

Based on the following verified activity data, provide an accurate ${report_type} spiritual wellness report.

${statsContext}

Rules:
- Use ONLY the numbers provided above. Do NOT invent or estimate data.
- Reference Islamic teachings where relevant (e.g., hadith on prayer consistency, virtues of Qur'an recitation).
- Be warm, encouraging, and non-judgmental — remind the user that Allah values sincerity over quantity.
- If activity is low, gently encourage with relevant ayat or hadith (e.g., "The most beloved deed to Allah is the most consistent, even if small" — Bukhari).
- Recommendations must be specific and actionable for the upcoming ${report_type === 'weekly' ? 'week' : 'month'}.
- Keep total response under 250 words.

Return valid JSON with these exact fields:
{
  "summary": "2-3 sentence warm summary referencing actual stats",
  "recommendations": ["actionable recommendation 1", "actionable recommendation 2", "actionable recommendation 3"],
  "highlights": ["achievement 1", "achievement 2"],
  "overallScore": <number 1-10 based on actual data>
}

Scoring guide:
- 1-3: Very low activity, needs encouragement
- 4-5: Some activity but inconsistent
- 6-7: Good effort with room to grow
- 8-9: Strong consistent practice
- 10: Exceptional dedication`;

    // Call Lovable AI with correct gateway URL
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY is not configured");
      throw new Error("AI service is not configured");
    }

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.4,
        response_format: { type: "json_object" },
      }),
    });

    let aiData = {
      summary: "Keep up your spiritual journey! Every small step matters. The Prophet ﷺ said: 'The most beloved deed to Allah is the most consistent, even if small.'",
      recommendations: [
        "Try to maintain all five daily prayers consistently",
        "Set a small daily Qur'an reading goal, even 5 minutes",
        "Consider fasting on Mondays and Thursdays (Sunnah)",
      ],
      highlights: ["You are tracking your spiritual activities — that's a great first step!"],
      overallScore: 5,
    };

    if (aiResponse.ok) {
      const aiJson = await aiResponse.json();
      const content = aiJson.choices?.[0]?.message?.content;
      if (content) {
        try {
          const parsed = JSON.parse(content);
          // Validate required fields exist
          if (parsed.summary && Array.isArray(parsed.recommendations) && typeof parsed.overallScore === 'number') {
            aiData = {
              summary: parsed.summary,
              recommendations: parsed.recommendations.slice(0, 5),
              highlights: Array.isArray(parsed.highlights) ? parsed.highlights.slice(0, 5) : [],
              overallScore: Math.min(10, Math.max(1, Math.round(parsed.overallScore))),
            };
          }
        } catch {
          console.error("Failed to parse AI response as JSON");
        }
      }
    } else {
      const errStatus = aiResponse.status;
      const errText = await aiResponse.text().catch(() => "");
      console.error(`AI gateway error: ${errStatus}`, errText);

      if (errStatus === 429) {
        return new Response(JSON.stringify({ error: "AI rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (errStatus === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // For other errors, continue with fallback data
    }

    // Store the report
    const reportData = {
      ...aiData,
      prayerStats: {
        completed: completedPrayers,
        total: expectedPrayers,
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
    console.error("generate-spiritual-insights error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
