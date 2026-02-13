import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Question {
  question_text: string;
  question_text_ar: string;
  type: string;
  complexity: string;
  tone: string;
  explanation: string;
  confidence_score: number;
  bias_flag: boolean;
  ambiguity_flag: boolean;
  framework_reference?: string | null;
  options?: { text: string; text_ar: string }[];
}

interface ValidateRequest {
  questions: Question[];
  accuracyMode: "standard" | "high" | "strict";
  enableCriticPass?: boolean;
  minWordLength?: number;
  questionSetId?: string;
  model?: string;
  selectedFrameworkIds?: string[];
  knowledgeDocumentIds?: string[];
  hasDocuments?: boolean;
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

    const { questions, accuracyMode, enableCriticPass, minWordLength = 5, questionSetId, model = "google/gemini-3-flash-preview", selectedFrameworkIds = [], knowledgeDocumentIds = [], hasDocuments = false }: ValidateRequest = await req.json();

    const validationResults: Record<string, { result: string; details: any }> = {};
    const perQuestionResults: { validation_status: string; validation_details: Record<string, any> }[] = [];

    // 1. Structure completeness check
    let structurePassed = true;
    const structureDetails: string[] = [];
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      const issues: string[] = [];
      if (!q.question_text?.trim()) issues.push("Missing English text");
      if (!q.question_text_ar?.trim()) issues.push("Missing Arabic text");
      if (!q.type) issues.push("Missing type");
      if (q.type === "multiple_choice" && (!q.options || q.options.length < 2)) {
        issues.push("MCQ needs at least 2 options");
      }
      if (issues.length > 0) {
        structurePassed = false;
        structureDetails.push(`Q${i + 1}: ${issues.join(", ")}`);
      }
    }
    validationResults.structure = {
      result: structurePassed ? "passed" : "failed",
      details: structureDetails.length > 0 ? structureDetails : "All questions structurally complete",
    };

    // 2. Minimum word length check
    let lengthPassed = true;
    const lengthDetails: string[] = [];
    for (let i = 0; i < questions.length; i++) {
      const wordCount = questions[i].question_text.split(/\s+/).filter(Boolean).length;
      if (wordCount < minWordLength) {
        lengthPassed = false;
        lengthDetails.push(`Q${i + 1}: ${wordCount} words (min: ${minWordLength})`);
      }
    }
    validationResults.length = {
      result: lengthPassed ? "passed" : "warning",
      details: lengthDetails.length > 0 ? lengthDetails : "All questions meet minimum length",
    };

    // 3. Duplicate detection
    let duplicatesPassed = true;
    const duplicateDetails: string[] = [];
    for (let i = 0; i < questions.length; i++) {
      for (let j = i + 1; j < questions.length; j++) {
        const a = questions[i].question_text.toLowerCase().trim();
        const b = questions[j].question_text.toLowerCase().trim();
        const wordsA = new Set(a.split(/\s+/));
        const wordsB = new Set(b.split(/\s+/));
        const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
        const union = new Set([...wordsA, ...wordsB]).size;
        const similarity = union > 0 ? intersection / union : 0;
        if (similarity > 0.7) {
          duplicatesPassed = false;
          duplicateDetails.push(`Q${i + 1} and Q${j + 1} are similar (${Math.round(similarity * 100)}%)`);
        }
      }
    }
    validationResults.duplicates = {
      result: duplicatesPassed ? "passed" : "warning",
      details: duplicateDetails.length > 0 ? duplicateDetails : "No duplicates detected",
    };

    // 4. Bias check
    const biasQuestions = questions.map((q, i) => q.bias_flag ? `Q${i + 1}` : null).filter(Boolean);
    validationResults.bias = {
      result: biasQuestions.length === 0 ? "passed" : "warning",
      details: biasQuestions.length > 0 ? `Potential bias detected in: ${biasQuestions.join(", ")}` : "No bias detected",
    };

    // 5. Ambiguity check
    const ambiguityQuestions = questions.map((q, i) => q.ambiguity_flag ? `Q${i + 1}` : null).filter(Boolean);
    validationResults.ambiguity = {
      result: ambiguityQuestions.length === 0 ? "passed" : "warning",
      details: ambiguityQuestions.length > 0 ? `Ambiguity detected in: ${ambiguityQuestions.join(", ")}` : "No ambiguity detected",
    };

    // 6. Average confidence
    const avgConfidence = questions.reduce((sum, q) => sum + (q.confidence_score || 0), 0) / questions.length;
    validationResults.confidence = {
      result: avgConfidence >= 70 ? "passed" : avgConfidence >= 50 ? "warning" : "failed",
      details: `Average confidence: ${Math.round(avgConfidence)}%`,
    };

    // 7. Framework alignment check (NEW)
    if (selectedFrameworkIds.length > 0) {
      const { data: frameworks } = await supabase
        .from("reference_frameworks")
        .select("name, framework_key")
        .in("id", selectedFrameworkIds)
        .eq("is_active", true)
        .is("deleted_at", null);

      const frameworkNameSet = new Set((frameworks || []).map((f: any) => f.name.toLowerCase()));
      const frameworkKeySet = new Set((frameworks || []).map((f: any) => f.framework_key.toLowerCase()));

      let frameworkPassed = true;
      const frameworkDetails: string[] = [];
      for (let i = 0; i < questions.length; i++) {
        const ref = questions[i].framework_reference?.toLowerCase() || "";
        if (!ref) {
          frameworkPassed = false;
          frameworkDetails.push(`Q${i + 1}: Missing framework reference`);
        } else {
          const matched = [...frameworkNameSet].some(n => ref.includes(n) || n.includes(ref))
            || [...frameworkKeySet].some(k => ref.includes(k));
          if (!matched) {
            frameworkPassed = false;
            frameworkDetails.push(`Q${i + 1}: Framework "${questions[i].framework_reference}" not in selected frameworks`);
          }
        }
      }
      validationResults.framework_alignment = {
        result: frameworkPassed ? "passed" : accuracyMode === "strict" ? "failed" : "warning",
        details: frameworkDetails.length > 0 ? frameworkDetails : "All questions aligned with selected frameworks",
      };
    }

    // 8. Document grounding check (NEW) — only flag if docs were provided but no references appear
    if (hasDocuments) {
      const questionsWithoutGrounding = questions.filter(q => {
        const text = (q.explanation || "").toLowerCase();
        return !text.includes("document") && !text.includes("reference") && !text.includes("source");
      });
      const groundingPassed = questionsWithoutGrounding.length < questions.length / 2;
      validationResults.document_grounding = {
        result: groundingPassed ? "passed" : accuracyMode === "strict" ? "failed" : "warning",
        details: groundingPassed
          ? "Questions appear grounded in uploaded documents"
          : `${questionsWithoutGrounding.length} of ${questions.length} questions lack document references`,
      };
    }

    // 9. Critic pass
    let criticResult = null;
    if (enableCriticPass) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
          const criticPrompt = `You are a survey methodology expert. Evaluate these ${questions.length} questions for:
1. Clarity - Is the question clear and unambiguous?
2. Difficulty alignment - Does the complexity match the stated level?
3. Neutral wording - Is the question free from leading language?
4. Logical consistency - Does the question make logical sense?

Questions:
${questions.map((q, i) => `${i + 1}. [${q.type}/${q.complexity}] ${q.question_text}`).join("\n")}`;

          const criticToolDef = {
            type: "function" as const,
            function: {
              name: "return_critic_results",
              description: "Return critic evaluation results",
              parameters: {
                type: "object",
                properties: {
                  overall_score: { type: "number", description: "Overall quality score 0-100" },
                  issues: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question_index: { type: "number" },
                        issue_type: { type: "string", enum: ["clarity", "difficulty", "bias", "logic"] },
                        severity: { type: "string", enum: ["low", "medium", "high"] },
                        description: { type: "string" },
                      },
                      required: ["question_index", "issue_type", "severity", "description"],
                    },
                  },
                },
                required: ["overall_score", "issues"],
              },
            },
          };

          const criticResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: model,
              messages: [{ role: "user", content: criticPrompt }],
              temperature: 0.2,
              tools: [criticToolDef],
              tool_choice: { type: "function", function: { name: "return_critic_results" } },
            }),
          });

          if (criticResponse.ok) {
            const criticData = await criticResponse.json();
            const toolCall = criticData.choices?.[0]?.message?.tool_calls?.[0];
            if (toolCall?.function?.arguments) {
              criticResult = JSON.parse(toolCall.function.arguments);
              validationResults.critic = {
                result: criticResult.overall_score >= 70 ? "passed" : criticResult.overall_score >= 50 ? "warning" : "failed",
                details: criticResult,
              };
            }
          }
        } catch (criticError) {
          console.error("Critic pass error:", criticError);
          validationResults.critic = { result: "warning", details: "Critic pass failed to execute" };
        }
      }
    }

    // Build per-question validation status
    for (let i = 0; i < questions.length; i++) {
      const qIssues: string[] = [];
      let status = "passed";

      if (!questions[i].question_text?.trim() || !questions[i].question_text_ar?.trim()) {
        status = "failed";
        qIssues.push("incomplete_structure");
      }
      if (questions[i].bias_flag) {
        status = status === "failed" ? "failed" : "warning";
        qIssues.push("bias_detected");
      }
      if (questions[i].ambiguity_flag) {
        status = status === "failed" ? "failed" : "warning";
        qIssues.push("ambiguity_detected");
      }
      if (questions[i].confidence_score < 50) {
        status = "failed";
        qIssues.push("low_confidence");
      } else if (questions[i].confidence_score < 70) {
        status = status === "failed" ? "failed" : "warning";
        qIssues.push("moderate_confidence");
      }

      // Framework alignment per question
      if (selectedFrameworkIds.length > 0 && !questions[i].framework_reference) {
        status = accuracyMode === "strict" ? "failed" : (status === "failed" ? "failed" : "warning");
        qIssues.push("missing_framework_reference");
      }

      // Critic issues
      if (criticResult?.issues) {
        const qCriticIssues = criticResult.issues.filter((issue: any) => issue.question_index === i);
        if (qCriticIssues.some((issue: any) => issue.severity === "high")) {
          status = "failed";
        } else if (qCriticIssues.length > 0 && status !== "failed") {
          status = "warning";
        }
        qCriticIssues.forEach((issue: any) => qIssues.push(`critic:${issue.issue_type}`));
      }

      perQuestionResults.push({
        validation_status: status,
        validation_details: { issues: qIssues, critic_issues: criticResult?.issues?.filter((ci: any) => ci.question_index === i) || [] },
      });
    }

    // Overall validation
    const hasFailures = Object.values(validationResults).some(v => v.result === "failed");
    const hasWarnings = Object.values(validationResults).some(v => v.result === "warning");
    const overallResult = hasFailures ? "failed" : hasWarnings ? "warning" : "passed";

    // Log validation
    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    const tenantId = userData?.user ? await supabase.rpc("get_user_tenant_id", { _user_id: userData.user.id }).then(r => r.data) : null;

    if (tenantId && questionSetId) {
      const logEntries = Object.entries(validationResults).map(([type, val]) => ({
        question_set_id: questionSetId,
        tenant_id: tenantId,
        validation_type: type,
        result: val.result,
        details: typeof val.details === "string" ? { message: val.details } : val.details,
      }));
      await supabase.from("validation_logs").insert(logEntries);
    }

    return new Response(JSON.stringify({
      success: true,
      overall_result: overallResult,
      validation_results: validationResults,
      per_question: perQuestionResults,
      avg_confidence: Math.round(avgConfidence),
      critic_result: criticResult,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in validate-questions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
