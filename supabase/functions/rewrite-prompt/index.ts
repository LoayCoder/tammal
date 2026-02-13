import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { prompt, useExpertKnowledge, selectedFrameworkIds = [], selectedFrameworks = [], documentSummaries = "" } = await req.json();

    if (!prompt || prompt.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Prompt too short" }), {
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

    // Fetch framework descriptions from DB if IDs provided
    let expertContext = "";
    if (useExpertKnowledge) {
      if (selectedFrameworkIds && selectedFrameworkIds.length > 0) {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: frameworks } = await supabase
          .from("reference_frameworks")
          .select("name, description")
          .in("id", selectedFrameworkIds)
          .eq("is_active", true)
          .is("deleted_at", null);

        if (frameworks && frameworks.length > 0) {
          const frameworkList = frameworks
            .map((f: any) => `- ${f.name}: ${f.description || ''}`)
            .join("\n");

          expertContext = `You have deep expertise in the following selected international standards and frameworks:\n${frameworkList}\n\nWhen rewriting, reference ONLY these selected frameworks where relevant and ensure the prompt is grounded in evidence-based psychometric principles aligned with them.`;
        }
      } else if (selectedFrameworks && selectedFrameworks.length > 0) {
        // Legacy fallback for old framework keys
        const frameworkDescriptions: Record<string, string> = {
          ISO45003: "ISO 45003 (Psychological Health & Safety at Work)",
          ISO10018: "ISO 10018 & ISO 30414 (People Engagement & HR Reporting)",
          COPSOQ: "COPSOQ III (Copenhagen Psychosocial Questionnaire)",
          UWES: "UWES (Utrecht Work Engagement Scale)",
          WHO: "WHO Guidelines (Mental Health at Work)",
          Gallup: "Gallup Q12 (Employee Needs Hierarchy)",
        };
        const frameworkList = selectedFrameworks
          .filter((id: string) => frameworkDescriptions[id])
          .map((id: string) => `- ${frameworkDescriptions[id]}`)
          .join("\n");

        expertContext = `You have deep expertise in the following selected international standards and frameworks:\n${frameworkList}\n\nWhen rewriting, reference ONLY these selected frameworks where relevant and ensure the prompt is grounded in evidence-based psychometric principles aligned with them.`;
      }
    }

    let documentContext = "";
    if (documentSummaries && documentSummaries.trim().length > 0) {
      documentContext = `\n\nThe user has uploaded reference documents with the following content summaries. Incorporate relevant concepts from these documents into the rewritten prompt:\n${documentSummaries}`;
    }

    const systemPrompt = `You are an expert Industrial-Organizational Psychologist and Psychometrician who specializes in creating survey instruments.

${expertContext}${documentContext}

Your task is to take a user's rough prompt/instructions and rewrite it into a professional, detailed, expert-level prompt that will guide an AI to generate the highest quality survey questions.

Rules:
- Preserve the user's original intent and focus areas
- Add scientific rigor, proper terminology, and psychometric best practices
- Include guidance on question construction (avoiding double-barreled questions, leading language, etc.)
- Add relevant framework references if expert knowledge is enabled (only reference the selected frameworks)
- If document content was provided, weave in relevant concepts and terminology from those documents
- Keep the rewritten prompt clear and actionable
- Output ONLY the rewritten prompt text, no explanations or meta-commentary
- Write in the same language as the input prompt`;

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
          { role: "user", content: `Rewrite this prompt as an expert-level survey generation instruction:\n\n${prompt}` },
        ],
        temperature: 0.4,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Failed to rewrite prompt" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiResponse = await response.json();
    const rewrittenPrompt = aiResponse.choices?.[0]?.message?.content || prompt;

    return new Response(JSON.stringify({ rewrittenPrompt, success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in rewrite-prompt:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
