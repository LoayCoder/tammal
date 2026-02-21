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
  moodLevels?: string[];
  periodId?: string;
}

// Mood score mapping
const MOOD_SCORE_MAP: Record<string, number> = {
  great: 5, good: 4, okay: 3, struggling: 2, need_help: 1,
};

// Generate a normalized hash for semantic dedup
function generateQuestionHash(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter(Boolean)
    .sort()
    .join(" ");
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
      categoryIds: inputCategoryIds = [],
      subcategoryIds: inputSubcategoryIds = [],
      moodLevels = [],
      periodId,
    }: GenerateRequest = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI service not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== PERIOD-AWARE CATEGORY LOCK ==========
    let categoryIds = inputCategoryIds;
    let subcategoryIds = inputSubcategoryIds;
    let generationPeriodId: string | null = periodId || null;

    if (periodId) {
      const { data: period } = await supabase
        .from("generation_periods")
        .select("*")
        .eq("id", periodId)
        .eq("status", "active")
        .is("deleted_at", null)
        .single();

      if (period) {
        // Override UI selections with locked period selections
        categoryIds = (period.locked_category_ids as string[]) || [];
        subcategoryIds = (period.locked_subcategory_ids as string[]) || [];
        generationPeriodId = period.id;
        console.log(`Period lock active: ${categoryIds.length} categories, ${subcategoryIds.length} subcategories`);
      }
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

    // 2. Framework block
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

    // 5. Category & Subcategory context — fetch full data for ID resolution later
    let categoryData: any[] = [];
    let subcategoryData: any[] = [];

    if (categoryIds && categoryIds.length > 0) {
      const { data: catData } = await supabase
        .from("question_categories")
        .select("id, name, name_ar, description, description_ar")
        .in("id", categoryIds);

      categoryData = catData || [];

      if (categoryData.length > 0) {
        const categoryDescriptions = categoryData.map((c: any, i: number) => {
          let block = `${i + 1}. **${c.name}**${c.name_ar ? ` (${c.name_ar})` : ''}`;
          if (c.description) block += `: ${c.description}`;
          if (c.description_ar) block += ` | ${c.description_ar}`;
          return block;
        }).join('\n');

        systemPrompt += `\n\n# Category Classification (MANDATORY):
Every generated question MUST belong to one of these categories. Tag each question with its category name.
${categoryDescriptions}`;

        if (subcategoryIds && subcategoryIds.length > 0) {
          const { data: subData } = await supabase
            .from("question_subcategories")
            .select("id, name, name_ar, description, description_ar, category_id")
            .in("id", subcategoryIds);

          subcategoryData = subData || [];

          if (subcategoryData.length > 0) {
            const subByCategory: Record<string, any[]> = {};
            for (const s of subcategoryData) {
              if (!subByCategory[s.category_id]) subByCategory[s.category_id] = [];
              subByCategory[s.category_id].push(s);
            }

            let subcatBlock = '\n\n# Subcategory Focus (MANDATORY when provided):';
            subcatBlock += '\nNarrow each question to one of these specific subcategories within its parent category:';
            for (const cat of categoryData) {
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

    // 5b. Mood Level Tagging (for wellness questions)
    if (moodLevels && moodLevels.length > 0) {
      systemPrompt += `

# Mood Level Tagging (MANDATORY for Wellness):
These questions are for a daily wellness check-in. Each question must be tagged with the most appropriate mood levels from the available set.

Available mood levels: great (feeling excellent), good (feeling positive), okay (feeling neutral), struggling (having difficulties), need_help (in distress)

The admin has pre-selected these mood levels: [${moodLevels.join(', ')}]

For EACH question, choose which mood level(s) it is most relevant for as a follow-up question. A question about coping strategies fits "struggling" and "need_help". A question about gratitude fits "great" and "good". Assign 1-3 mood levels per question based on psychological relevance.

Return the mood_levels array in each question object.`;
    }

    // 5c. Affective State Matrixing (NEW)
    systemPrompt += `

# Affective State Distribution (MANDATORY):
For each subcategory, distribute questions across three affective states:
- "positive" (Engaged/Thriving) - questions exploring strengths, satisfaction, growth
- "neutral" (Passive/Observational) - questions measuring baseline, routine, factual state
- "negative" (Stressed/At-Risk) - questions detecting burnout, dissatisfaction, risk

Aim for balanced distribution: ~33% each per subcategory.
Tag each question with its affective_state.

# Mood Score (MANDATORY):
Assign a numeric mood_score (1-5) to each question:
1 = distress/crisis, 2 = struggling/at-risk, 3 = baseline/neutral, 4 = positive/engaged, 5 = thriving/flourishing
The mood_score should reflect the emotional valence of the question's expected response context.`;

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

    // 7. Tool definition (enhanced with affective_state and mood_score)
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
                  mood_levels: {
                    type: "array",
                    items: { type: "string", enum: ["great", "good", "okay", "struggling", "need_help"] },
                    description: "Which mood levels this question is relevant for as a follow-up"
                  },
                  affective_state: {
                    type: "string",
                    enum: ["positive", "neutral", "negative"],
                    description: "The emotional valence of this question: positive (engaged/thriving), neutral (baseline/observational), negative (stressed/at-risk)"
                  },
                  mood_score: {
                    type: "integer",
                    description: "Numeric wellness score 1-5 where 1=distress, 5=thriving"
                  },
                  options: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: { text: { type: "string" }, text_ar: { type: "string" } },
                      required: ["text", "text_ar"],
                    },
                  },
                },
                required: ["question_text", "question_text_ar", "type", "complexity", "tone", "explanation", "confidence_score", "bias_flag", "ambiguity_flag", "affective_state", "mood_score"],
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

    console.log(`Generating ${questionCount} questions with model: ${selectedModel}, accuracy: ${accuracyMode}, frameworks: ${frameworkNames.length}, categories: ${categoryIds.length}, subcategories: ${subcategoryIds.length}, period: ${generationPeriodId || 'freeform'}`);

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
          await retryResponse.text();
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

    // ========== CATEGORY/SUBCATEGORY ID RESOLUTION ==========
    const resolveCategoryId = (catName: string | null): string | null => {
      if (!catName || categoryData.length === 0) return null;
      const lower = catName.toLowerCase().trim();
      const match = categoryData.find((c: any) =>
        c.name.toLowerCase().trim() === lower ||
        (c.name_ar && c.name_ar.toLowerCase().trim() === lower)
      );
      return match?.id || null;
    };

    const resolveSubcategoryId = (subName: string | null): string | null => {
      if (!subName || subcategoryData.length === 0) return null;
      const lower = subName.toLowerCase().trim();
      const match = subcategoryData.find((s: any) =>
        s.name.toLowerCase().trim() === lower ||
        (s.name_ar && s.name_ar.toLowerCase().trim() === lower)
      );
      return match?.id || null;
    };

    // ========== MOOD SCORE DERIVATION ==========
    const deriveMoodScore = (q: any): number => {
      if (typeof q.mood_score === "number" && q.mood_score >= 1 && q.mood_score <= 5) return q.mood_score;
      const levels: string[] = Array.isArray(q.mood_levels) ? q.mood_levels : [];
      if (levels.length > 0) {
        const scores = levels.map(l => MOOD_SCORE_MAP[l] || 3);
        return Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length);
      }
      // Derive from affective_state
      if (q.affective_state === "positive") return 4;
      if (q.affective_state === "negative") return 2;
      return 3;
    };

    // ========== SEMANTIC DEDUP (Cross-Period Memory) ==========
    // Get user info once for both semantic dedup and logging
    const token = authHeader.replace("Bearer ", "");
    const { data: authUserData } = await supabase.auth.getUser(token);
    const resolvedTenantId = authUserData?.user
      ? await supabase.rpc("get_user_tenant_id", { _user_id: authUserData.user.id }).then(r => r.data)
      : null;

    let existingHashes = new Set<string>();
    if (generationPeriodId && resolvedTenantId) {
      const { data: existingQuestions } = await supabase
        .from("generated_questions")
        .select("question_hash")
        .eq("generation_period_id", generationPeriodId)
        .eq("tenant_id", resolvedTenantId);

      if (existingQuestions) {
        existingHashes = new Set(existingQuestions.map((q: any) => q.question_hash).filter(Boolean));
      }
    }

    // ========== NORMALIZE AND ENRICH QUESTIONS ==========
    questions = questions.map((q: any) => {
      const hash = generateQuestionHash(q.question_text || "");
      const isDuplicate = existingHashes.has(hash);
      const categoryId = resolveCategoryId(q.category_name);
      const subcategoryId = resolveSubcategoryId(q.subcategory_name);
      const moodScore = deriveMoodScore(q);
      const affectiveState = ["positive", "neutral", "negative"].includes(q.affective_state)
        ? q.affective_state
        : (moodScore >= 4 ? "positive" : moodScore <= 2 ? "negative" : "neutral");

      return {
        question_text: q.question_text || q.text || "",
        question_text_ar: q.question_text_ar || q.text_ar || "",
        type: normalizeType(q.type),
        complexity: q.complexity || complexity,
        tone: q.tone || tone,
        explanation: q.explanation || "",
        confidence_score: typeof q.confidence_score === "number" ? q.confidence_score : 75,
        bias_flag: q.bias_flag === true,
        ambiguity_flag: isDuplicate ? true : (q.ambiguity_flag === true),
        validation_status: isDuplicate ? "warning" : "pending",
        validation_details: isDuplicate ? { issues: ["semantic_duplicate"] } : {},
        options: q.options || [],
        framework_reference: q.framework_reference || null,
        psychological_construct: q.psychological_construct || null,
        scoring_mechanism: q.scoring_mechanism || null,
        category_name: q.category_name || null,
        subcategory_name: q.subcategory_name || null,
        mood_levels: Array.isArray(q.mood_levels) ? q.mood_levels : [],
        // New analytical fields
        category_id: categoryId,
        subcategory_id: subcategoryId,
        mood_score: moodScore,
        affective_state: affectiveState,
        generation_period_id: generationPeriodId,
        question_hash: hash,
      };
    });

    // Log generation (reuse authUserData from above)
    if (authUserData?.user) {
      await supabase.from("ai_generation_logs").insert({
        user_id: authUserData.user.id,
        tenant_id: resolvedTenantId || null,
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
          period_id: generationPeriodId,
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
