import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GenerateRequest {
  focusAreas: string[];
  questionCount: number;
  complexity: "simple" | "moderate" | "advanced";
  tone: "formal" | "casual" | "neutral";
  employeeContext?: string;
  categoryNames?: string[];
  language?: "en" | "ar" | "both";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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

    const { focusAreas, questionCount, complexity, tone, employeeContext, categoryNames, language = "both" }: GenerateRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert organizational psychologist specializing in employee wellbeing surveys. 
Generate high-quality survey questions that measure employee wellbeing, engagement, and organizational health.

Guidelines:
- Questions should be clear, unbiased, and psychometrically sound
- Avoid leading questions or double-barreled questions
- Use appropriate question types for the content
- Consider cultural sensitivity for diverse workplaces
- Questions should be actionable - the answers should inform decisions

Complexity level: ${complexity}
- Simple: Direct, easy to understand questions
- Moderate: More nuanced questions with some depth
- Advanced: Complex questions requiring reflection

Tone: ${tone}
- Formal: Professional business language
- Casual: Friendly, approachable language
- Neutral: Balanced, standard language

Focus areas to cover: ${focusAreas.join(", ")}
${categoryNames?.length ? `Categories: ${categoryNames.join(", ")}` : ""}
${employeeContext ? `Employee context: ${employeeContext}` : ""}`;

    const userPrompt = `Generate exactly ${questionCount} survey questions for employee wellbeing assessment.

${language === "both" ? "For each question, provide both English and Arabic versions." : `Generate questions in ${language === "en" ? "English" : "Arabic"} only.`}

Return a JSON array with the following structure:
[
  {
    "text": "English question text",
    "text_ar": "Arabic question text",
    "type": "likert_5" | "numeric_scale" | "yes_no" | "open_ended" | "multiple_choice",
    "category": "category name from focus areas",
    "options": [] // only for multiple_choice type, provide array of option objects with text and text_ar
  }
]

Question types to use:
- likert_5: For agreement/satisfaction scales (Strongly Disagree to Strongly Agree)
- numeric_scale: For 1-10 rating scales
- yes_no: For binary questions
- open_ended: For qualitative feedback
- multiple_choice: For specific choice questions

Ensure variety in question types based on what's most appropriate for each topic.`;

    console.log("Generating questions with Lovable AI...");
    
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.7,
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
    const content = aiResponse.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }

    let questions;
    try {
      questions = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse AI response", raw: content }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log the generation
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    
    if (userData?.user) {
      await supabase.from("ai_generation_logs").insert({
        user_id: userData.user.id,
        prompt_type: "question_generation",
        focus_areas: focusAreas,
        questions_generated: questions.length,
        model_used: "google/gemini-2.5-flash",
        success: true,
      });
    }

    return new Response(JSON.stringify({ questions, success: true }), {
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