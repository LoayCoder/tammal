import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_BATCH_SIZE = 64;

interface SavedQuestion {
  question_text: string;
  question_text_ar: string | null;
  type: string;
  complexity?: string;
  tone?: string;
  explanation?: string;
  confidence_score?: number;
  bias_flag?: boolean;
  ambiguity_flag?: boolean;
  validation_status?: string;
  validation_details?: Record<string, unknown>;
  options?: { text: string; text_ar: string }[];
  mood_levels?: string[];
  category_id?: string | null;
  subcategory_id?: string | null;
  mood_score?: number | null;
  affective_state?: string | null;
  generation_period_id?: string | null;
  question_hash?: string | null;
}

interface SaveRequest {
  purpose: "wellness" | "survey";
  questions: SavedQuestion[];
  targetBatchId?: string;
  // Survey-specific fields
  model?: string;
  accuracyMode?: string;
  settings?: Record<string, unknown>;
  validationReport?: {
    overall_result: string;
    validation_results: Record<string, unknown>;
    critic_result?: unknown;
  } | null;
}

function mapToWellnessType(type: string): string {
  if (["scale", "multiple_choice", "text"].includes(type)) return type;
  if (type === "likert_5" || type === "numeric_scale") return "scale";
  if (type === "open_ended") return "text";
  return "scale";
}

function mapToQuestionType(type: string): string {
  if (["likert_5", "numeric_scale", "yes_no", "multiple_choice", "open_ended"].includes(type)) return type;
  if (type === "scale") return "likert_5";
  if (type === "text") return "open_ended";
  return "likert_5";
}

function formatDate(d: Date): string {
  const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  return `${String(d.getDate()).padStart(2, "0")} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatMonth(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify user with anon client
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: authError } = await anonClient.auth.getUser();
    if (authError || !userData.user) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    // Use service role for all DB ops (atomic transaction context)
    const admin = createClient(supabaseUrl, serviceKey);

    // Get tenant_id
    const { data: tenantId } = await admin.rpc("get_user_tenant_id", { _user_id: userId });
    if (!tenantId) {
      return new Response(JSON.stringify({ error: "No organization found" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get profile name
    const { data: profile } = await admin
      .from("profiles")
      .select("full_name")
      .eq("user_id", userId)
      .single();
    const fullName = profile?.full_name || "Unknown";

    const body: SaveRequest = await req.json();
    const { purpose, questions, targetBatchId } = body;

    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: "No questions provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const now = new Date();
    const batchName = `${formatDate(now)} - ${fullName}`;
    let savedCount = 0;

    if (purpose === "wellness") {
      let remaining = [...questions];

      // Append to existing batch if provided
      if (targetBatchId) {
        const { data: existingBatch, error: fetchErr } = await admin
          .from("question_generation_batches")
          .select("id, question_count")
          .eq("id", targetBatchId)
          .single();
        if (fetchErr) throw fetchErr;

        const currentCount = existingBatch.question_count || 0;
        const capacity = MAX_BATCH_SIZE - currentCount;
        const toAppend = remaining.splice(0, capacity);

        if (toAppend.length > 0) {
          const { error } = await admin.from("wellness_questions").insert(
            toAppend.map((q) => ({
              tenant_id: tenantId,
              batch_id: targetBatchId,
              question_text_en: q.question_text,
              question_text_ar: q.question_text_ar || null,
              question_type: mapToWellnessType(q.type),
              options: q.type === "multiple_choice" && q.options ? q.options : [],
              status: "draft",
            }))
          );
          if (error) throw error;

          await admin
            .from("question_generation_batches")
            .update({ question_count: currentCount + toAppend.length })
            .eq("id", targetBatchId);
          savedCount += toAppend.length;
        }
      }

      // Create new batch for remaining
      if (remaining.length > 0) {
        const periodId = remaining[0]?.generation_period_id || null;
        const { data: batch, error: batchError } = await admin
          .from("question_generation_batches")
          .insert({
            tenant_id: tenantId,
            target_month: formatMonth(now),
            question_count: remaining.length,
            status: "draft",
            created_by: userId,
            name: batchName,
            generation_period_id: periodId,
          })
          .select("id")
          .single();
        if (batchError) throw batchError;

        const { error } = await admin.from("wellness_questions").insert(
          remaining.map((q) => ({
            tenant_id: tenantId,
            batch_id: batch.id,
            question_text_en: q.question_text,
            question_text_ar: q.question_text_ar || null,
            question_type: mapToWellnessType(q.type),
            options: q.type === "multiple_choice" && q.options ? q.options : [],
            status: "draft",
          }))
        );
        if (error) throw error;
        savedCount += remaining.length;
      }

      // Also save to unified questions table
      await admin.from("questions").insert(
        questions.map((q) => ({
          tenant_id: tenantId,
          text: q.question_text,
          text_ar: q.question_text_ar || null,
          type: mapToQuestionType(q.type),
          options: q.options || [],
          mood_levels: q.mood_levels || [],
          is_active: true,
          is_global: false,
          ai_generated: true,
          created_by: userId,
          category_id: q.category_id || null,
          subcategory_id: q.subcategory_id || null,
          mood_score: q.mood_score || null,
          affective_state: q.affective_state || null,
        }))
      );
    } else {
      // Survey purpose
      let remaining = [...questions];

      if (targetBatchId) {
        const { data: targetBatch, error: fetchErr } = await admin
          .from("question_sets")
          .select("id, question_count")
          .eq("id", targetBatchId)
          .single();
        if (fetchErr) throw fetchErr;

        const currentCount = targetBatch.question_count || 0;
        const capacity = MAX_BATCH_SIZE - currentCount;
        const toAdd = remaining.splice(0, capacity);

        if (toAdd.length > 0) {
          const { error } = await admin.from("generated_questions").insert(
            toAdd.map((q) => ({
              question_set_id: targetBatchId,
              tenant_id: tenantId,
              question_text: q.question_text,
              question_text_ar: q.question_text_ar,
              type: q.type,
              complexity: q.complexity,
              tone: q.tone,
              explanation: q.explanation,
              confidence_score: q.confidence_score,
              bias_flag: q.bias_flag,
              ambiguity_flag: q.ambiguity_flag,
              validation_status: q.validation_status,
              validation_details: q.validation_details,
              options: q.options || [],
              category_id: q.category_id || null,
              subcategory_id: q.subcategory_id || null,
              mood_score: q.mood_score || null,
              affective_state: q.affective_state || null,
              generation_period_id: q.generation_period_id || null,
              question_hash: q.question_hash || null,
            }))
          );
          if (error) throw error;

          await admin
            .from("question_sets")
            .update({ question_count: currentCount + toAdd.length })
            .eq("id", targetBatchId);
          savedCount += toAdd.length;
        }
      }

      while (remaining.length > 0) {
        const chunk = remaining.splice(0, MAX_BATCH_SIZE);
        const { data: newBatch, error: setError } = await admin
          .from("question_sets")
          .insert({
            tenant_id: tenantId,
            user_id: userId,
            model_used: body.model || "unknown",
            accuracy_mode: body.accuracyMode || "standard",
            settings: body.settings || {},
            validation_result: body.validationReport?.validation_results || {},
            critic_pass_result: body.validationReport?.critic_result || null,
            status: body.validationReport?.overall_result === "passed" ? "validated" : "draft",
            name: batchName,
            question_count: chunk.length,
            generation_period_id: chunk[0]?.generation_period_id || null,
          })
          .select("id")
          .single();
        if (setError) throw setError;

        const { error } = await admin.from("generated_questions").insert(
          chunk.map((q) => ({
            question_set_id: newBatch.id,
            tenant_id: tenantId,
            question_text: q.question_text,
            question_text_ar: q.question_text_ar,
            type: q.type,
            complexity: q.complexity,
            tone: q.tone,
            explanation: q.explanation,
            confidence_score: q.confidence_score,
            bias_flag: q.bias_flag,
            ambiguity_flag: q.ambiguity_flag,
            validation_status: q.validation_status,
            validation_details: q.validation_details,
            options: q.options || [],
            category_id: q.category_id || null,
            subcategory_id: q.subcategory_id || null,
            mood_score: q.mood_score || null,
            affective_state: q.affective_state || null,
            generation_period_id: q.generation_period_id || null,
            question_hash: q.question_hash || null,
          }))
        );
        if (error) throw error;
        savedCount += chunk.length;
      }
    }

    return new Response(
      JSON.stringify({ success: true, savedCount, purpose }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("save-question-batch error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
