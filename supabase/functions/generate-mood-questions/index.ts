import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Theme pools per mood level ───────────────────────────────────────────────
const THEME_POOLS: Record<string, string[]> = {
  great: [
    "positive_drivers",
    "recognition",
    "team_connection",
    "energy_source",
    "purpose_alignment",
    "momentum_building",
  ],
  good: [
    "engagement",
    "collaboration",
    "satisfaction",
    "progress",
    "growth",
    "energy_level",
  ],
  okay: [
    "minor_friction",
    "workload_balance",
    "focus_clarity",
    "emotional_energy",
    "support_access",
  ],
  struggling: [
    "stressors",
    "burnout_signals",
    "work_life_spillover",
    "communication_gaps",
    "support_needs",
    "work_pressure",
  ],
  need_help: [
    "immediate_stress_source",
    "support_preference",
    "human_connection",
    "safety_support",
  ],
};

// ─── SHA-256 hash utility ─────────────────────────────────────────────────────
async function sha256(text: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Safety check for need_help ───────────────────────────────────────────────
function ensureSafetyOptions(questions: any[], moodLevel: string): any[] {
  if (moodLevel !== "need_help") return questions;

  return questions.map((q, idx) => {
    if (idx !== 0) return q; // only enforce on first question

    const safetyOptionEn = "I'd like to talk to HR or my manager";
    const safetyOptionAr = "أود التحدث مع الموارد البشرية أو مديري";
    const professionalOptionEn = "I'd prefer professional support";
    const professionalOptionAr = "أفضل الحصول على دعم متخصص";

    const hasHR = q.options_en?.some((o: string) =>
      o.toLowerCase().includes("hr") ||
      o.toLowerCase().includes("manager")
    );
    const hasProfessional = q.options_en?.some((o: string) =>
      o.toLowerCase().includes("professional")
    );

    let options_en = [...(q.options_en || [])];
    let options_ar = [...(q.options_ar || [])];

    if (!hasHR) {
      options_en = [safetyOptionEn, ...options_en.slice(0, 2)];
      options_ar = [safetyOptionAr, ...options_ar.slice(0, 2)];
    }
    if (!hasProfessional) {
      if (!options_en.includes(professionalOptionEn)) {
        options_en = [...options_en.slice(0, 3), professionalOptionEn];
        options_ar = [...options_ar.slice(0, 3), professionalOptionAr];
      }
    }

    return { ...q, options_en, options_ar };
  });
}

// ─── AI generation ────────────────────────────────────────────────────────────
async function generateQuestionsFromAI(
  moodLevel: string,
  moodScore: number,
  language: string,
  selectedTheme: string,
  usedThemes: string[],
  customContext: string,
  randomSeed: string,
  LOVABLE_API_KEY: string
): Promise<any[]> {
  const lang = language === "ar" ? "Arabic" : "English";
  const themesContext =
    usedThemes.length > 0
      ? `Previously used themes to AVOID semantic similarity: ${usedThemes.join(", ")}.`
      : "No previously used themes.";

  const systemPrompt = `You are a licensed workplace clinical psychologist specializing in organizational wellbeing and employee mental health.
Your role is to generate empathetic, non-intrusive follow-up questions for an employee check-in system.

STRICT CLINICAL RULES:
- NO diagnostic labels (never use: depressed, anxious, clinical, disorder)
- ALL options must be normalizing — low-mood options must feel non-stigmatizing
- Questions must be answerable within 30 seconds
- NO assumptions about gender, family structure, religious beliefs
- Use warm, supportive language
- Keep options concise (max 8 words each)
- Randomization seed: ${randomSeed} — use this to vary phrasing from previous generations

RESPONSE FORMAT (return valid JSON array ONLY, no markdown, no explanation):
[
  {
    "question_text_en": "...",
    "question_text_ar": "...",
    "options_en": ["option1", "option2", "option3"],
    "options_ar": ["خيار1", "خيار2", "خيار3"],
    "question_type": "multiple_choice",
    "theme": "${selectedTheme}"
  }
]`;

  const userPrompt = `Employee mood level: ${moodLevel} (score: ${moodScore}/5)
Focus theme: ${selectedTheme}
${themesContext}
${customContext ? `Custom organizational context: ${customContext}` : ""}

Generate exactly 1 follow-up question (2 if the mood is extreme like "great" or "need_help").
The question must explore the "${selectedTheme}" theme in the context of the "${moodLevel}" mood.

${
  moodLevel === "need_help"
    ? `SAFETY REQUIREMENT: Include these options:
- "I'd like to talk to HR or my manager" / "أود التحدث مع الموارد البشرية أو مديري"
- "I'd prefer professional support" / "أفضل الحصول على دعم متخصص"
Only rotate the theme for the SECOND question if generating 2. Never omit safety options.`
    : ""
}

Return ONLY the JSON array, no markdown code blocks.`;

  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.85,
      }),
    }
  );

  if (!response.ok) {
    const status = response.status;
    if (status === 429) throw new Error("RATE_LIMIT");
    if (status === 402) throw new Error("CREDITS_EXHAUSTED");
    throw new Error(`AI_ERROR:${status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "[]";

  // Parse JSON — strip markdown if present
  const cleaned = content
    .replace(/```json\n?/g, "")
    .replace(/```\n?/g, "")
    .trim();

  const parsed = JSON.parse(cleaned);
  return Array.isArray(parsed) ? parsed : [parsed];
}

// ─── Main handler ─────────────────────────────────────────────────────────────
serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY)
      throw new Error("LOVABLE_API_KEY is not configured");

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { moodLevel, moodScore, language, tenantId, userId } =
      await req.json();

    if (!moodLevel || !tenantId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: moodLevel, tenantId, userId" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Step 1: Fetch 14-day question history for this user + mood ────────────
    const { data: historyRows } = await serviceClient
      .from("mood_question_history")
      .select("question_hash, theme, created_at")
      .eq("user_id", userId)
      .eq("mood_level", moodLevel)
      .gte(
        "created_at",
        new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      )
      .order("created_at", { ascending: false });

    const usedHashes = new Set<string>(
      (historyRows || []).map((r: any) => r.question_hash)
    );
    const usedThemes = new Set<string>(
      (historyRows || []).map((r: any) => r.theme)
    );

    // ── Step 2: Select unused theme ───────────────────────────────────────────
    const themePool = THEME_POOLS[moodLevel] || THEME_POOLS["okay"];
    let selectedTheme =
      themePool.find((t) => !usedThemes.has(t)) || themePool[0];

    // For need_help: safety_support is always the first theme
    if (moodLevel === "need_help" && !usedThemes.has("safety_support")) {
      selectedTheme = "safety_support";
    }

    // ── Step 3: Fetch tenant config ───────────────────────────────────────────
    const { data: configRow } = await serviceClient
      .from("mood_question_configs")
      .select("*")
      .eq("tenant_id", tenantId)
      .eq("mood_level", moodLevel)
      .maybeSingle();

    const config = configRow || {
      is_enabled: true,
      enable_free_text: moodLevel === "need_help" || moodLevel === "great",
      custom_prompt_context: "",
    };

    if (!config.is_enabled) {
      return new Response(
        JSON.stringify({ questions: [], disabled: true }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Steps 4-5: Generate with retry + duplicate check ─────────────────────
    let finalQuestions: any[] = [];
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      const randomSeed = crypto.randomUUID();

      try {
        let generated = await generateQuestionsFromAI(
          moodLevel,
          moodScore,
          language,
          selectedTheme,
          Array.from(usedThemes),
          config.custom_prompt_context || "",
          randomSeed,
          LOVABLE_API_KEY
        );

        // Hash check
        const hashes: string[] = [];
        let hasDuplicate = false;

        for (const q of generated) {
          const hash = await sha256(q.question_text_en || "");
          if (usedHashes.has(hash)) {
            hasDuplicate = true;
            break;
          }
          hashes.push(hash);
        }

        if (hasDuplicate && attempts < maxAttempts) {
          // Try next unused theme on second retry
          if (attempts === 2) {
            const nextTheme = themePool.find(
              (t) => t !== selectedTheme && !usedThemes.has(t)
            );
            if (nextTheme) selectedTheme = nextTheme;
          }
          continue;
        }

        // ── Step 6: Safety override for need_help ─────────────────────────
        generated = ensureSafetyOptions(generated, moodLevel);

        // Attach hashes and free_text flag
        finalQuestions = generated.map((q, i) => ({
          ...q,
          _hash: hashes[i] || "",
          enable_free_text:
            config.enable_free_text &&
            (moodLevel === "need_help" || moodLevel === "great"),
        }));

        break;
      } catch (err: any) {
        if (attempts >= maxAttempts) throw err;
      }
    }

    // ── Step 7: Store question history ────────────────────────────────────────
    if (finalQuestions.length > 0) {
      const historyInserts = finalQuestions.map((q) => ({
        tenant_id: tenantId,
        user_id: userId,
        mood_level: moodLevel,
        question_hash: q._hash,
        theme: q.theme || selectedTheme,
      }));

      await serviceClient.from("mood_question_history").insert(historyInserts);
    }

    // ── Step 8: Return clean response ─────────────────────────────────────────
    const questions = finalQuestions.map(({ _hash, ...q }) => q);

    return new Response(JSON.stringify({ questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("generate-mood-questions error:", e);

    if (e.message === "RATE_LIMIT") {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded, please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (e.message === "CREDITS_EXHAUSTED") {
      return new Response(
        JSON.stringify({ error: "AI credits exhausted." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
