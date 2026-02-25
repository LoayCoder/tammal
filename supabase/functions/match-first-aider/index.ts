import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MatchResult {
  first_aider_id: string;
  display_name: string;
  score: number;
  factors: {
    specialization: number;
    language: number;
    load: number;
    responseTime: number;
    rating: number;
  };
  specializations: string[];
  languages: string[];
  rating: number | null;
  response_time_avg: number | null;
  active_cases: number;
  status: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { case_id, tenant_id, preferred_language, use_ai } = await req.json();

    if (!case_id || !tenant_id) {
      return new Response(JSON.stringify({ error: "case_id and tenant_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the crisis case
    const { data: crisisCase, error: caseErr } = await supabase
      .from("mh_crisis_cases")
      .select("*")
      .eq("id", case_id)
      .single();

    if (caseErr || !crisisCase) {
      return new Response(JSON.stringify({ error: "Case not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch all active first aiders in the tenant
    const { data: firstAiders, error: faErr } = await supabase
      .from("mh_first_aiders")
      .select("*")
      .eq("tenant_id", tenant_id)
      .eq("is_active", true)
      .is("deleted_at", null);

    if (faErr || !firstAiders?.length) {
      return new Response(JSON.stringify({ error: "No first aiders available", matches: [] }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch schedules for online status
    const { data: schedules } = await supabase
      .from("mh_first_aider_schedule")
      .select("*")
      .in("first_aider_id", firstAiders.map((fa: any) => fa.id));

    // Count active cases per first aider
    const { data: activeCaseCounts } = await supabase
      .from("mh_crisis_cases")
      .select("assigned_first_aider_id")
      .in("status", ["active", "pending_first_aider_acceptance", "awaiting_user", "awaiting_first_aider"])
      .in("assigned_first_aider_id", firstAiders.map((fa: any) => fa.id));

    const caseCountMap: Record<string, number> = {};
    (activeCaseCounts || []).forEach((c: any) => {
      caseCountMap[c.assigned_first_aider_id] = (caseCountMap[c.assigned_first_aider_id] || 0) + 1;
    });

    // Determine intent keywords for specialization matching
    const intentKeywords = getIntentKeywords(crisisCase.intent, crisisCase.summary);

    // If AI matching requested and we have the API key, use AI to analyze intent
    let aiSpecializationHints: string[] = [];
    if (use_ai && lovableApiKey && crisisCase.summary) {
      try {
        aiSpecializationHints = await getAISpecializationHints(lovableApiKey, crisisCase.summary, crisisCase.intent);
      } catch (e) {
        console.error("AI matching failed, falling back to keyword matching:", e);
      }
    }

    const allHints = [...intentKeywords, ...aiSpecializationHints];

    // Score each first aider
    const matches: MatchResult[] = firstAiders.map((fa: any) => {
      const activeCases = caseCountMap[fa.id] || 0;
      const maxCases = fa.max_concurrent_sessions || fa.max_active_cases || 3;

      // Skip if at capacity
      if (activeCases >= maxCases) {
        return null;
      }

      // 1. Specialization match (30%)
      const specs = fa.specializations || [];
      const specScore = specs.length > 0 && allHints.length > 0
        ? Math.min(1, allHints.filter((h: string) => specs.some((s: string) => s.toLowerCase().includes(h.toLowerCase()) || h.toLowerCase().includes(s.toLowerCase()))).length / Math.max(1, allHints.length))
        : 0.5; // neutral if no specializations defined

      // 2. Language match (20%)
      const faLangs = fa.languages || [];
      const prefLang = preferred_language || "en";
      const langScore = faLangs.length === 0 ? 0.5 : faLangs.includes(prefLang) ? 1.0 : 0.2;

      // 3. Load inverse (20%) — fewer cases = higher score
      const loadScore = 1 - (activeCases / maxCases);

      // 4. Response time (15%) — lower is better, normalize to 0-1
      const avgResponse = fa.response_time_avg || 60;
      const responseScore = Math.max(0, 1 - (avgResponse / 120)); // 120 min = 0 score

      // 5. Rating (15%)
      const ratingScore = fa.rating ? fa.rating / 5.0 : 0.5;

      const totalScore =
        specScore * 0.30 +
        langScore * 0.20 +
        loadScore * 0.20 +
        responseScore * 0.15 +
        ratingScore * 0.15;

      // Determine online status from schedule
      const schedule = (schedules || []).find((s: any) => s.first_aider_id === fa.id);
      const isOnline = checkIsOnline(schedule);

      return {
        first_aider_id: fa.id,
        display_name: fa.display_name,
        score: Math.round(totalScore * 100) / 100,
        factors: {
          specialization: Math.round(specScore * 100) / 100,
          language: Math.round(langScore * 100) / 100,
          load: Math.round(loadScore * 100) / 100,
          responseTime: Math.round(responseScore * 100) / 100,
          rating: Math.round(ratingScore * 100) / 100,
        },
        specializations: fa.specializations || [],
        languages: fa.languages || [],
        rating: fa.rating,
        response_time_avg: fa.response_time_avg,
        active_cases: activeCases,
        status: isOnline ? "online" : "offline",
      } as MatchResult;
    }).filter(Boolean) as MatchResult[];

    // Sort by score descending, online first
    matches.sort((a, b) => {
      if (a.status === "online" && b.status !== "online") return -1;
      if (b.status === "online" && a.status !== "online") return 1;
      return b.score - a.score;
    });

    // Auto-assign the best match if urgency is high
    let assigned_id: string | null = null;
    if (crisisCase.urgency_level >= 4 && matches.length > 0) {
      assigned_id = matches[0].first_aider_id;
      await supabase.from("mh_crisis_cases").update({
        assigned_first_aider_id: assigned_id,
        status: "pending_first_aider_acceptance",
        matched_at: new Date().toISOString(),
      }).eq("id", case_id);
    }

    return new Response(
      JSON.stringify({ matches, assigned_id, case_id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("match-first-aider error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function getIntentKeywords(intent: string, summary?: string): string[] {
  const intentMap: Record<string, string[]> = {
    self_harm: ["mental_health", "crisis", "self_harm", "suicide_prevention"],
    unsafe: ["safety", "crisis", "physical_injury"],
    overwhelmed: ["mental_health", "stress", "burnout"],
    anxiety: ["mental_health", "anxiety", "stress"],
    work_stress: ["work_stress", "burnout", "workplace"],
    talk: ["general", "emotional_support"],
    other: ["general"],
  };
  return intentMap[intent] || ["general"];
}

function checkIsOnline(schedule: any): boolean {
  if (!schedule || !schedule.is_enabled || schedule.temp_unavailable) return false;
  const now = new Date();
  const dayKeys = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const dayKey = dayKeys[now.getDay()];
  const currentTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  const slots = schedule.weekly_rules?.[dayKey] || [];
  return slots.some((slot: any) => currentTime >= slot.from && currentTime < slot.to);
}

async function getAISpecializationHints(apiKey: string, summary: string, intent: string): Promise<string[]> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        {
          role: "system",
          content: `You are a mental health triage assistant. Given a support request summary and intent, return a JSON array of relevant specialization tags from this list: mental_health, crisis, self_harm, suicide_prevention, anxiety, stress, burnout, work_stress, workplace, physical_injury, safety, emotional_support, grief, relationship, substance_abuse, general. Return ONLY the JSON array, no other text.`,
        },
        {
          role: "user",
          content: `Intent: ${intent}\nSummary: ${summary}`,
        },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: "extract_specializations",
            description: "Extract relevant specialization tags for matching",
            parameters: {
              type: "object",
              properties: {
                specializations: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of relevant specialization tags",
                },
              },
              required: ["specializations"],
              additionalProperties: false,
            },
          },
        },
      ],
      tool_choice: { type: "function", function: { name: "extract_specializations" } },
    }),
  });

  if (!response.ok) {
    if (response.status === 429 || response.status === 402) {
      console.warn(`AI rate limited (${response.status}), skipping AI matching`);
      return [];
    }
    throw new Error(`AI gateway error: ${response.status}`);
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (toolCall?.function?.arguments) {
    const parsed = JSON.parse(toolCall.function.arguments);
    return parsed.specializations || [];
  }
  return [];
}
