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
    const { negative_thought, challenge_answers } = await req.json();

    if (!negative_thought) {
      return new Response(JSON.stringify({ error: "negative_thought is required" }), {
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

    const q1 = challenge_answers?.q1 || "";
    const q2 = challenge_answers?.q2 || "";
    const q3 = challenge_answers?.q3 || "";

    const systemPrompt = `You are a licensed Cognitive Behavioral Therapy (CBT) specialist. Your role is to help people reframe negative automatic thoughts into balanced, realistic, and compassionate alternatives.

Given a negative thought and the user's own challenge answers, produce ONE clear, concise reframed thought that:
- Acknowledges the kernel of truth (if any) without dismissing the person's feelings
- Incorporates the evidence they identified against the thought
- Uses balanced, non-extreme language
- Is written in the same language as the negative thought (if Arabic, respond in Arabic; if English, respond in English)
- Is 1-3 sentences maximum

Do NOT lecture or explain CBT theory. Just return the reframed thought.`;

    const userPrompt = `Negative thought: "${negative_thought}"

Challenge answers:
- Is this thought 100% true? ${q1}
- Evidence supporting: ${q2}
- Evidence against: ${q3}

Provide a reframed thought.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
        tools: [
          {
            type: "function",
            function: {
              name: "return_reframed_thought",
              description: "Return the suggested reframed thought.",
              parameters: {
                type: "object",
                properties: {
                  reframed_thought: {
                    type: "string",
                    description: "The reframed, balanced thought",
                  },
                },
                required: ["reframed_thought"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "return_reframed_thought" } },
        temperature: 0.5,
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
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please try later." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "Failed to generate suggestion" }), {
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

    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({
      reframed_thought: result.reframed_thought,
      success: true,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in suggest-reframe:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
