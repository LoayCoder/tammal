import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface GenerateRequest {
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
  useExpertKnowledge?: boolean;
  knowledgeDocumentIds?: string[];
  customPrompt?: string;
  selectedFrameworks?: string[];
  categoryIds?: string[];
  subcategoryIds?: string[];
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
      questionCount,
      complexity,
      tone,
      questionType,
      model = "google/gemini-3-flash-preview",
      accuracyMode = "standard",
      advancedSettings = {},
      language = "both",
      useExpertKnowledge = false,
      knowledgeDocumentIds = [],
      customPrompt = "",
      selectedFrameworks = [],
      categoryIds = [],
      subcategoryIds = [],
    }: GenerateRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate model
    const { data: modelData } = await supabase
      .from("ai_models")
      .select("model_key")
      .eq("model_key", model)
      .eq("is_active", true)
      .single();

    const selectedModel = modelData?.model_key || "google/gemini-3-flash-preview";
    const temperature = accuracyMode === "strict" ? 0.3 : accuracyMode === "high" ? 0.5 : 0.7;

    // ========== STRUCTURED PROMPT CONSTRUCTION ==========

    // 1. Base system prompt
    let systemPrompt = `You are an expert organizational psychologist specializing in employee wellbeing surveys.
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
${questionType && questionType !== "mixed" ? `Question type constraint: Only generate questions of these types: ${questionType}. Distribute questions evenly across the specified types.` : "Use a mix of question types"}
${advancedSettings.minWordLength ? `Minimum question length: ${advancedSettings.minWordLength} words` : ""}`;

    // 2. Framework block — fetch from DB including framework-linked documents
    let frameworkNames: string[] = [];
    if (useExpertKnowledge && selectedFrameworks.length > 0) {
      const { data: frameworks } = await supabase
        .from("reference_frameworks")
        .select("id, name, description, framework_key")
        .in("id", selectedFrameworks)
        .eq("is_active", true)
        .is("deleted_at", null);

      if (frameworks && frameworks.length > 0) {
        frameworkNames = frameworks.map((f: any) => f.name);

        // Fetch framework-linked reference documents
        const { data: fwDocs } = await supabase
          .from("reference_documents")
          .select("framework_id, file_name, extracted_text")
          .in("framework_id", frameworks.map((f: any) => f.id));

        const fwDocMap: Record<string, { file_name: string; extracted_text: string }[]> = {};
        if (fwDocs) {
          for (const doc of fwDocs) {
            if (doc.extracted_text && doc.framework_id) {
              if (!fwDocMap[doc.framework_id]) fwDocMap[doc.framework_id] = [];
              fwDocMap[doc.framework_id].push({ file_name: doc.file_name, extracted_text: doc.extracted_text });
            }
          }
        }

        const frameworkDescriptions = frameworks
          .map((f: any, i: number) => {
            let block = `${i + 1}. **${f.name}:** ${f.description || 'No description'}`;
            const docs = fwDocMap[f.id];
            if (docs && docs.length > 0) {
              block += `\n   Reference Documents for ${f.name}:`;
              for (const doc of docs) {
                const truncated = doc.extracted_text.length > 8000
                  ? doc.extracted_text.substring(0, 8000) + "\n[...truncated...]"
                  : doc.extracted_text;
                block += `\n   - [${doc.file_name}]: ${truncated}`;
              }
            }
            return block;
          })
          .join('\n');

        systemPrompt += `

# Expert Role
Act as a world-class expert consultant combining the skills of an Industrial-Organizational (I-O) Psychologist, a Lead Psychometrician, and an Occupational Health & Safety (OHS) Specialist.

# Objective
Develop scientifically valid, legally defensible, and high-impact survey questions to measure "Mental Health," "Organizational Engagement," and "Psychosocial Risk."

# Reference Frameworks (Knowledge Base):
${frameworkDescriptions}

For EACH question you MUST also provide:
- framework_reference: The specific standard/framework the question derives from (e.g., "${frameworkNames[0]}")
- psychological_construct: The construct being measured (e.g., "Psychological Safety", "Vigor", "Role Clarity", "Burnout Risk")
- scoring_mechanism: Recommended scoring approach (e.g., "Likert 1-5 Agreement", "Frequency Scale", "Yes/No")`;
      }
    }

    // 3. Document block
    let documentContext = "";
    if (knowledgeDocumentIds.length > 0) {
      const { data: docs } = await supabase
        .from("ai_knowledge_documents")
        .select("file_name, content_text")
        .in("id", knowledgeDocumentIds)
        .eq("is_active", true)
        .is("deleted_at", null);

      if (docs && docs.length > 0) {
        documentContext = "\n\n# Additional Reference Documents:\n";
        for (const doc of docs) {
          if (doc.content_text) {
            const truncated = doc.content_text.length > 16000
              ? doc.content_text.substring(0, 16000) + "\n[...truncated...]"
              : doc.content_text;
            documentContext += `\n## Document: ${doc.file_name}\n${truncated}\n`;
          }
        }
        systemPrompt += documentContext;
      }
    }

    // 4. Custom prompt block
    if (customPrompt) {
      systemPrompt += `\n\n# Additional User Instructions:\n${customPrompt}`;
    }

    // 5. Category & Subcategory context (multi-select) — with full descriptions
    if (categoryIds && categoryIds.length > 0) {
      const { data: catData } = await supabase
        .from("question_categories")
        .select("id, name, name_ar, description, description_ar")
        .in("id", categoryIds);

      if (catData && catData.length > 0) {
        const categoryDescriptions = catData.map((c: any, i: number) => {
          let block = `${i + 1}. **${c.name}**${c.name_ar ? ` (${c.name_ar})` : ''}`;
          if (c.description) block += `: ${c.description}`;
          if (c.description_ar) block += ` | ${c.description_ar}`;
          return block;
        }).join('\n');

        systemPrompt += `\n\n# Category Classification (MANDATORY):
Every generated question MUST belong to one of these categories. Tag each question with its category name.
${categoryDescriptions}`;

        // Fetch subcategories for selected categories
        if (subcategoryIds && subcategoryIds.length > 0) {
          const { data: subData } = await supabase
            .from("question_subcategories")
            .select("id, name, name_ar, description, description_ar, category_id")
            .in("id", subcategoryIds);

          if (subData && subData.length > 0) {
            const subByCategory: Record<string, any[]> = {};
            for (const s of subData) {
              if (!subByCategory[s.category_id]) subByCategory[s.category_id] = [];
              subByCategory[s.category_id].push(s);
            }

            let subcatBlock = '\n\n# Subcategory Focus (MANDATORY when provided):';
            subcatBlock += '\nNarrow each question to one of these specific subcategories within its parent category:';
            for (const cat of catData) {
              const subs = subByCategory[cat.id];
              if (subs && subs.length > 0) {
                subcatBlock += `\n\n**${cat.name}** subcategories:`;
                for (const s of subs) {
                  subcatBlock += `\n  - ${s.name}${s.name_ar ? ` (${s.name_ar})` : ''}`;
                  if (s.description) subcatBlock += `: ${s.description}`;
                }
              }
            }
            subcatBlock += '\n\nTag each question with both its category_name and subcategory_name.';
            systemPrompt += subcatBlock;
          }
        }
      }
    }

    // 6. Integration Priority Directive
    const activeSources = [];
    if (frameworkNames.length > 0) activeSources.push('Reference Frameworks');
    if (documentContext) activeSources.push('Knowledge Base Documents');
    if (categoryIds.length > 0) activeSources.push('Categories/Subcategories');
    if (customPrompt) activeSources.push('Custom Instructions');

    if (activeSources.length > 1) {
      systemPrompt += `\n\n# Source Integration Priority:
You have ${activeSources.length} active context sources: ${activeSources.join(', ')}.
Apply them in this strict priority order:
1. **Categories/Subcategories** — Every question MUST map to a selected category (and subcategory if provided). This is non-negotiable.
2. **Reference Frameworks** — Align question methodology, constructs, and scientific rigor with the selected frameworks.
3. **Knowledge Base Documents** — Use document content as domain-specific context and terminology source.
4. **Custom Instructions** — Apply as additional constraints or focus adjustments.

All sources work together: a question should satisfy the category requirement while being grounded in frameworks and informed by documents.`;
    }

    // 6. Tool definition
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
                    enum: ["likert_5", "numeric_scale", "yes_no", "open_ended", "multiple_choice"],
                    description: "ONLY use these exact values. Do NOT invent new types like 'scenario_based'.",
                  },
                  complexity: { type: "string", enum: ["simple", "moderate", "advanced"] },
                  tone: { type: "string" },
                  explanation: { type: "string", description: "Why this question is valuable" },
                  confidence_score: { type: "number", description: "Confidence in question quality 0-100" },
                  bias_flag: { type: "boolean" },
                  ambiguity_flag: { type: "boolean" },
                  framework_reference: { type: "string", description: "The framework this question derives from" },
                  psychological_construct: { type: "string", description: "The construct being measured" },
                  scoring_mechanism: { type: "string", description: "Recommended scoring approach" },
                  category_name: { type: "string", description: "The category this question belongs to" },
                  subcategory_name: { type: "string", description: "The subcategory this question belongs to, if applicable" },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: { text: { type: "string" }, text_ar: { type: "string" } },
                      required: ["text", "text_ar"],
                    },
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

    const frameworkAlignment = frameworkNames.length > 0
      ? `\nAlign questions with the following selected frameworks: ${frameworkNames.join(', ')}.`
      : '';

    const userPrompt = `Generate EXACTLY ${questionCount} high-quality survey questions for employee wellbeing assessment. You MUST return exactly ${questionCount} questions — no more, no fewer. This count is mandatory.
Provide both English and Arabic versions for each question.
Ensure variety in question types and assign a confidence score (0-100) based on quality.${frameworkAlignment}
${advancedSettings.enableBiasDetection ? "Flag any questions with potential bias issues." : ""}
${advancedSettings.enableAmbiguityDetection ? "Flag any questions with ambiguous wording." : ""}`;

    console.log(`Generating ${questionCount} questions with model: ${selectedModel}, accuracy: ${accuracyMode}, frameworks: ${frameworkNames.length}, categories: ${categoryIds.length}, subcategories: ${subcategoryIds.length}`);

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
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (errorStatus === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", errorStatus, errorText);
      return new Response(JSON.stringify({ error: "AI generation failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
          status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return new Response(JSON.stringify({ error: "AI returned empty or invalid questions" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Retry once if AI returned fewer questions than requested
    if (questions.length < questionCount) {
      console.log(`AI returned ${questions.length}/${questionCount} questions. Requesting ${questionCount - questions.length} more.`);
      const deficit = questionCount - questions.length;
      try {
        const retryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: selectedModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Generate EXACTLY ${deficit} more unique survey questions for employee wellbeing assessment. You MUST return exactly ${deficit} questions. These must be DIFFERENT from these existing questions:\n${questions.map((q: any, i: number) => `${i+1}. ${q.question_text}`).join('\n')}\n\nProvide both English and Arabic versions.${frameworkAlignment}` },
            ],
            temperature,
            tools: [toolDefinition],
            tool_choice: { type: "function", function: { name: "return_questions" } },
          }),
        });

        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          const retryToolCall = retryData.choices?.[0]?.message?.tool_calls?.[0];
          if (retryToolCall?.function?.arguments) {
            try {
              const retryParsed = JSON.parse(retryToolCall.function.arguments);
              if (Array.isArray(retryParsed.questions)) {
                questions = [...questions, ...retryParsed.questions];
                console.log(`After retry: ${questions.length} total questions`);
              }
            } catch { /* ignore parse error on retry */ }
          }
        } else {
          await retryResponse.text(); // consume body
        }
      } catch (retryErr) {
        console.error("Retry failed:", retryErr);
      }
    }

    const VALID_TYPES = ["likert_5", "numeric_scale", "yes_no", "open_ended", "multiple_choice"];
    const normalizeType = (t: string): string => {
      if (VALID_TYPES.includes(t)) return t;
      const lower = (t || "").toLowerCase().replace(/[\s-]+/g, "_");
      if (lower.includes("scenario") || lower.includes("situational")) return "multiple_choice";
      if (lower.includes("open") || lower.includes("free_text") || lower.includes("qualitative")) return "open_ended";
      if (lower.includes("likert") || lower.includes("agreement")) return "likert_5";
      if (lower.includes("numeric") || lower.includes("scale") || lower.includes("rating")) return "numeric_scale";
      if (lower.includes("yes") || lower.includes("binary")) return "yes_no";
      if (lower.includes("multiple") || lower.includes("mcq") || lower.includes("choice")) return "multiple_choice";
      return "likert_5";
    };

    questions = questions.map((q: any) => ({
      question_text: q.question_text || q.text || "",
      question_text_ar: q.question_text_ar || q.text_ar || "",
      type: normalizeType(q.type),
      complexity: q.complexity || complexity,
      tone: q.tone || tone,
      explanation: q.explanation || "",
      confidence_score: typeof q.confidence_score === "number" ? q.confidence_score : 75,
      bias_flag: q.bias_flag === true,
      ambiguity_flag: q.ambiguity_flag === true,
      validation_status: "pending",
      validation_details: {},
      options: q.options || [],
      framework_reference: q.framework_reference || null,
      psychological_construct: q.psychological_construct || null,
      scoring_mechanism: q.scoring_mechanism || null,
      category_name: q.category_name || null,
      subcategory_name: q.subcategory_name || null,
    }));

    // Log generation
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);

    if (userData?.user) {
      // Fetch tenant_id for proper RLS-based log visibility
      const { data: tenantIdData } = await supabase.rpc("get_user_tenant_id", { _user_id: userData.user.id });

      await supabase.from("ai_generation_logs").insert({
        user_id: userData.user.id,
        tenant_id: tenantIdData || null,
        prompt_type: "question_generation",
        questions_generated: questions.length,
        model_used: selectedModel,
        accuracy_mode: accuracyMode,
        temperature,
        duration_ms: durationMs,
        settings: {
          questionCount, complexity, tone, questionType, advancedSettings,
          selected_framework_ids: selectedFrameworks,
          custom_prompt: customPrompt,
          document_ids: knowledgeDocumentIds,
          category_ids: categoryIds,
          subcategory_ids: subcategoryIds,
          prompt_snapshot: systemPrompt.substring(0, 10000),
        },
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
