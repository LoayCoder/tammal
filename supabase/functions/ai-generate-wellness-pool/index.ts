import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { batchId, count, tenantId } = await req.json();

    if (!batchId || !count || !tenantId) {
      return new Response(
        JSON.stringify({ error: "batchId, count, and tenantId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Generate wellness questions via AI
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are an expert organizational psychologist specializing in employee wellness assessment. Generate bilingual (English and Arabic) wellness check-in questions that are:
- Scientifically grounded in workplace psychology
- Sensitive and non-invasive
- Actionable for HR teams
- Varied across question types (scale, multiple_choice, text)
- Covering topics: stress, work-life balance, team dynamics, personal growth, physical health, mental wellbeing, job satisfaction`,
          },
          {
            role: "user",
            content: `Generate exactly ${count} unique wellness questions. Each must have both English and Arabic text. Mix question types: scale (1-10), multiple_choice (with 4-5 options), and text (open-ended). Roughly 50% scale, 30% multiple_choice, 20% text.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "save_wellness_questions",
              description: `Return exactly ${count} bilingual wellness questions`,
              parameters: {
                type: "object",
                properties: {
                  questions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question_text_en: { type: "string", description: "Question in English" },
                        question_text_ar: { type: "string", description: "Question in Arabic" },
                        question_type: {
                          type: "string",
                          enum: ["scale", "multiple_choice", "text"],
                        },
                        options: {
                          type: "array",
                          items: { type: "string" },
                          description: "Answer options (only for multiple_choice type, 4-5 items)",
                        },
                      },
                      required: ["question_text_en", "question_text_ar", "question_type"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["questions"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "save_wellness_questions" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Insufficient AI credits. Please add funds." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call returned from AI");
    }

    const parsed = JSON.parse(toolCall.function.arguments);
    const questions = parsed.questions;

    if (!Array.isArray(questions) || questions.length === 0) {
      throw new Error("No questions returned from AI");
    }

    // Insert questions into wellness_questions table
    const insertData = questions.map((q: any) => ({
      tenant_id: tenantId,
      batch_id: batchId,
      question_text_en: q.question_text_en,
      question_text_ar: q.question_text_ar || null,
      question_type: q.question_type,
      options: q.question_type === "multiple_choice" && q.options ? q.options : [],
      status: "draft",
    }));

    const { error: insertError } = await supabase
      .from("wellness_questions")
      .insert(insertData);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to insert questions: ${insertError.message}`);
    }

    // Update batch question_count
    const { error: updateError } = await supabase
      .from("question_generation_batches")
      .update({ question_count: questions.length })
      .eq("id", batchId);

    if (updateError) {
      console.error("Batch update error:", updateError);
    }

    return new Response(
      JSON.stringify({ success: true, count: questions.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("ai-generate-wellness-pool error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
