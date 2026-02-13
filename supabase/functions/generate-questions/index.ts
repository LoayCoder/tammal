import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateRequest {
  focusAreas: string[];
  questionCount: number;
  complexity: "simple" | "moderate" | "advanced";
  tone: "formal" | "casual" | "neutral" | "analytical" | "supportive" | "direct";
  questionType?: string;
  model?: string;
  accuracyMode?: "standard" | "high" | "strict";
  advancedSettings?: {
    requireExplanation?: boolean;
    enableBiasDetection?: boolean;
    enableAmbiguityDetection?: boolean;
    enableDuplicateDetection?: boolean;
    enableCriticPass?: boolean;
    minWordLength?: number;
  };
  language?: "en" | "ar" | "both";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = performance.now();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const {
      focusAreas,
      questionCount,
      complexity,
      tone,
      questionType,
      model = "google/gemini-2.5-flash",
      accuracyMode = "standard",
      advancedSettings = {},
      language = "both",
    }: GenerateRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate model against ai_models table
    const { data: modelData } = await supabase
      .from("ai_models")
      .select("model_key")
      .eq("model_key", model)
      .eq("is_active", true)
      .single();

    const selectedModel = modelData?.model_key || "google/gemini-2.5-flash";

    const temperature = accuracyMode === "strict" ? 0.3 : accuracyMode === "high" ? 0.5 : 0.7;

    const systemPrompt = `You are an expert organizational psychologist specializing in employee wellbeing surveys.
Generate high-quality survey questions that measure employee wellbeing, engagement, and organizational health.

Guidelines:
- Questions should be clear, unbiased, and psychometrically sound
- Avoid leading questions or double-barreled questions
- Use appropriate question types for the content
- Consider cultural sensitivity for diverse workplaces
- Questions should be actionable - the answers should inform decisions
${advancedSettings.requireExplanation ? "- For each question, provide a detailed explanation of why it was chosen and what insights it reveals" : ""}
${advancedSettings.enableBiasDetection ? "- Actively check each question for any cultural, gender, age, or other biases and flag them" : ""}
${advancedSettings.enableAmbiguityDetection ? "- Check each question for ambiguous wording and flag any issues" : ""}

Complexity level: ${complexity}
Tone: ${tone}
Focus areas: ${focusAreas.join(", ")}
${questionType && questionType !== "mixed" ? `Question type constraint: Only generate ${questionType} questions` : "Use a mix of question types"}
${advancedSettings.minWordLength ? `Minimum question length: ${advancedSettings.minWordLength} words` : ""}`;

    const toolDefinition = {
      type: "function" as const,
      function: {
        name: "return_questions",
        description: "Return generated survey questions in structured format",
        parameters: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question_text: { type: "string", description: "English question text" },
                  question_text_ar: { type: "string", description: "Arabic question text" },
                  type: {
                    type: "string",
                    enum: ["likert_5", "numeric_scale", "yes_no", "open_ended", "multiple_choice", "scenario_based"],
                  },
                  complexity: { type: "string", enum: ["simple", "moderate", "advanced"] },
                  tone: { type: "string" },
                  explanation: { type: "string", description: "Why this question is valuable and what insights it reveals" },
                  confidence_score: { type: "number", description: "Confidence in question quality 0-100" },
                  bias_flag: { type: "boolean", description: "Whether potential bias was detected" },
                  ambiguity_flag: { type: "boolean", description: "Whether ambiguity was detected" },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        text: { type: "string" },
                        text_ar: { type: "string" },
                      },
                      required: ["text", "text_ar"],
                    },
                    description: "Options for multiple_choice type only",
                  },
                },
                required: ["question_text", "question_text_ar", "type", "complexity", "tone", "explanation", "confidence_score", "bias_flag", "ambiguity_flag"],
              },
            },
          },
          required: ["questions"],
        },
      },
    };

    const userPrompt = `Generate exactly ${questionCount} high-quality survey questions for employee wellbeing assessment.
Provide both English and Arabic versions for each question.
Ensure variety in question types and assign a confidence score (0-100) based on quality.
${advancedSettings.enableBiasDetection ? "Flag any questions with potential bias issues." : ""}
${advancedSettings.enableAmbiguityDetection ? "Flag any questions with ambiguous wording." : ""}`;

    console.log(`Generating ${questionCount} questions with model: ${selectedModel}, accuracy: ${accuracyMode}`);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature,
        tools: [toolDefinition],
        tool_choice: { type: "function", function: { name: "return_questions" } },
      }),
    });

    if (!response.ok) {
      const errorStatus = response.status;
      if (errorStatus === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (errorStatus === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", errorStatus, errorText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const durationMs = Math.round(performance.now() - startTime);

    let questions;
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        questions = parsed.questions;
      } catch {
        console.error("Failed to parse tool call arguments");
      }
    }

    // Fallback: try content parsing
    if (!questions) {
      const content = aiResponse.choices?.[0]?.message?.content || "";
      let jsonContent = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonContent = jsonMatch[1].trim();
      try {
        const parsed = JSON.parse(jsonContent);
        questions = parsed.questions || parsed;
      } catch {
        console.error("Failed to parse AI response:", content);
        return new Response(JSON.stringify({ error: "Failed to parse AI response" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Validate structure
    if (!Array.isArray(questions) || questions.length === 0) {
      return new Response(JSON.stringify({ error: "AI returned empty or invalid questions" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Normalize questions
    questions = questions.map((q: any) => ({
      question_text: q.question_text || q.text || "",
      question_text_ar: q.question_text_ar || q.text_ar || "",
      type: q.type || "likert_5",
      complexity: q.complexity || complexity,
      tone: q.tone || tone,
      explanation: q.explanation || "",
      confidence_score: typeof q.confidence_score === "number" ? q.confidence_score : 75,
      bias_flag: q.bias_flag === true,
      ambiguity_flag: q.ambiguity_flag === true,
      validation_status: "pending",
      validation_details: {},
      options: q.options || [],
    }));

    // Log the generation
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);

    if (userData?.user) {
      await supabase.from("ai_generation_logs").insert({
        user_id: userData.user.id,
        prompt_type: "question_generation",
        focus_areas: focusAreas,
        questions_generated: questions.length,
        model_used: selectedModel,
        accuracy_mode: accuracyMode,
        temperature,
        duration_ms: durationMs,
        settings: { focusAreas, questionCount, complexity, tone, questionType, advancedSettings },
        success: true,
      });
    }

    return new Response(JSON.stringify({ questions, success: true, model: selectedModel, duration_ms: durationMs }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in generate-questions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
