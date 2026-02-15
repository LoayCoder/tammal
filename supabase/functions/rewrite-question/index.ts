import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

    const { question_text, question_text_ar, type, prompt, model = "google/gemini-3-flash-preview" } = await req.json();

    if (!question_text || !prompt || prompt.trim().length < 3) {
      return new Response(JSON.stringify({ error: "Question text and prompt are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are an expert Industrial-Organizational Psychologist and Psychometrician specializing in survey question refinement.

Your task is to REFINE an existing survey question based on the user's instructions. You must:
- ONLY improve the existing question — do NOT generate a new question on a different topic
- Preserve the original meaning, intent, and question type (${type})
- Improve clarity, reduce ambiguity, fix grammar issues
- Align with psychometric best practices (avoid double-barreled questions, leading language, etc.)
- Return the refined question in BOTH English and Arabic
- The Arabic version must be a proper professional translation of the refined English version

Original question (English): ${question_text}
Original question (Arabic): ${question_text_ar || "Not provided"}

Use the provided tool to return the refined versions.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Refine this question based on these instructions:\n\n${prompt}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "return_refined_question",
              description: "Return the refined survey question in English and Arabic.",
              parameters: {
                type: "object",
                properties: {
                  question_text: {
                    type: "string",
                    description: "The refined question text in English",
                  },
                  question_text_ar: {
                    type: "string",
                    description: "The refined question text in Arabic",
                  },
                },
                required: ["question_text", "question_text_ar"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_refined_question" } },
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please wait a moment and try again." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Payment required. AI credits may be exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to rewrite question" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall?.function?.arguments) {
      return new Response(JSON.stringify({ error: "AI did not return structured output" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const refined = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      question_text: refined.question_text,
      question_text_ar: refined.question_text_ar,
      success: true,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in rewrite-question:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
