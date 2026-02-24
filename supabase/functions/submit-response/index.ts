import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SubmitRequest {
  scheduledQuestionId: string;
  answerValue: any;
  answerText?: string;
  responseTimeSeconds?: number;
  deviceType?: "web" | "mobile";
  sessionId?: string;
  isDraft?: boolean;
  surveySessionId?: string;
}

interface BulkSubmitRequest {
  bulk: true;
  isDraft: boolean;
  surveySessionId: string;
  responses: {
    scheduledQuestionId: string;
    answerValue: any;
    answerText?: string;
  }[];
  deviceType?: "web" | "mobile";
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

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);

    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Invalid authentication" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();

    // --- Bulk survey submission ---
    if (body.bulk === true) {
      return await handleBulkSubmit(supabase, userData.user.id, body as BulkSubmitRequest);
    }

    // --- Single question submission (legacy + survey draft per-question) ---
    return await handleSingleSubmit(supabase, userData.user.id, body as SubmitRequest);
  } catch (error: unknown) {
    console.error("Error in submit-response:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleSingleSubmit(supabase: any, userId: string, input: SubmitRequest) {
  const {
    scheduledQuestionId,
    answerValue,
    answerText,
    responseTimeSeconds,
    deviceType = "web",
    sessionId,
    isDraft = false,
    surveySessionId,
  } = input;

  if (!scheduledQuestionId || answerValue === undefined) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: scheduledQuestion, error: sqError } = await supabase
    .from("scheduled_questions")
    .select(`id, employee_id, question_id, question_source, tenant_id, status, schedule_id, employees!inner(user_id)`)
    .eq("id", scheduledQuestionId)
    .single();

  if (sqError || !scheduledQuestion) {
    return new Response(JSON.stringify({ error: "Scheduled question not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const employeeData = scheduledQuestion.employees as unknown as { user_id: string };
  if (employeeData.user_id !== userId) {
    return new Response(JSON.stringify({ error: "Unauthorized to answer this question" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check if already answered (final)
  if (scheduledQuestion.status === "answered" && !isDraft) {
    return new Response(JSON.stringify({ error: "Question already answered" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Time-window validation for survey schedules
  const timeWindowError = await validateSurveyTimeWindow(supabase, scheduledQuestion.schedule_id);
  if (timeWindowError) {
    return new Response(JSON.stringify({ error: timeWindowError }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate answer
  const questionSource = scheduledQuestion.question_source || "questions";
  const { questionType, questionOptions } = await fetchQuestionMeta(supabase, questionSource, scheduledQuestion.question_id);

  if (!isDraft) {
    const validationResult = validateAnswer(questionType, answerValue, questionOptions);
    if (!validationResult.valid) {
      return new Response(JSON.stringify({ error: validationResult.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Upsert the response (draft or final)
  const { data: response, error: upsertError } = await supabase
    .from("employee_responses")
    .upsert({
      scheduled_question_id: scheduledQuestionId,
      employee_id: scheduledQuestion.employee_id,
      question_id: scheduledQuestion.question_id,
      tenant_id: scheduledQuestion.tenant_id,
      answer_value: answerValue,
      answer_text: answerText,
      response_time_seconds: responseTimeSeconds,
      device_type: deviceType,
      session_id: sessionId,
      is_draft: isDraft,
      survey_session_id: surveySessionId || null,
    }, {
      onConflict: 'scheduled_question_id,employee_id',
      ignoreDuplicates: false,
    })
    .select()
    .single();

  if (upsertError) {
    console.error("Error upserting response:", upsertError);
    // Fallback: try insert if upsert fails (no existing row)
    const { data: insertedResponse, error: insertError } = await supabase
      .from("employee_responses")
      .insert({
        scheduled_question_id: scheduledQuestionId,
        employee_id: scheduledQuestion.employee_id,
        question_id: scheduledQuestion.question_id,
        tenant_id: scheduledQuestion.tenant_id,
        answer_value: answerValue,
        answer_text: answerText,
        response_time_seconds: responseTimeSeconds,
        device_type: deviceType,
        session_id: sessionId,
        is_draft: isDraft,
        survey_session_id: surveySessionId || null,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Fallback insert also failed:", insertError);
      throw insertError;
    }
  }

  // Only mark as answered for final submissions
  if (!isDraft) {
    await supabase
      .from("scheduled_questions")
      .update({ status: "answered" })
      .eq("id", scheduledQuestionId);
  }

  return new Response(JSON.stringify({
    success: true,
    response: response || null,
    message: isDraft ? "Draft saved" : "Response submitted successfully",
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleBulkSubmit(supabase: any, userId: string, input: BulkSubmitRequest) {
  const { isDraft, surveySessionId, responses, deviceType = "web" } = input;

  if (!responses?.length) {
    return new Response(JSON.stringify({ error: "No responses provided" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch all scheduled questions in one go
  const sqIds = responses.map(r => r.scheduledQuestionId);
  const { data: scheduledQuestions, error: sqError } = await supabase
    .from("scheduled_questions")
    .select(`id, employee_id, question_id, question_source, tenant_id, status, schedule_id, employees!inner(user_id)`)
    .in("id", sqIds);

  if (sqError || !scheduledQuestions?.length) {
    return new Response(JSON.stringify({ error: "Scheduled questions not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Verify all belong to the same user
  for (const sq of scheduledQuestions) {
    const empData = sq.employees as unknown as { user_id: string };
    if (empData.user_id !== userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Time-window validation (use the first question's schedule)
  const scheduleId = scheduledQuestions[0].schedule_id;
  const timeWindowError = await validateSurveyTimeWindow(supabase, scheduleId);
  if (timeWindowError) {
    return new Response(JSON.stringify({ error: timeWindowError }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sqMap = new Map(scheduledQuestions.map((sq: any) => [sq.id, sq]));

  // Build rows to upsert
  const rows = responses.map(r => {
    const sq = sqMap.get(r.scheduledQuestionId)!;
    return {
      scheduled_question_id: r.scheduledQuestionId,
      employee_id: sq.employee_id,
      question_id: sq.question_id,
      tenant_id: sq.tenant_id,
      answer_value: r.answerValue,
      answer_text: r.answerText || null,
      device_type: deviceType,
      is_draft: isDraft,
      survey_session_id: surveySessionId,
    };
  });

  // Soft-delete ALL existing responses (draft or final) for these scheduled questions
  // so the fresh insert doesn't violate the unique index on (scheduled_question_id, employee_id)
  const deleteIds = rows.map(r => r.scheduled_question_id);
  await supabase
    .from("employee_responses")
    .update({ deleted_at: new Date().toISOString() })
    .in("scheduled_question_id", deleteIds)
    .is("deleted_at", null);

  const { error: insertError } = await supabase
    .from("employee_responses")
    .insert(rows);

  if (insertError) {
    console.error("Error bulk inserting responses:", insertError);
    throw insertError;
  }

  // For final submission, mark all scheduled_questions as answered
  if (!isDraft) {
    await supabase
      .from("scheduled_questions")
      .update({ status: "answered" })
      .in("id", sqIds);
  }

  return new Response(JSON.stringify({
    success: true,
    saved: rows.length,
    message: isDraft ? `Saved ${rows.length} drafts` : `Submitted ${rows.length} responses`,
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function validateSurveyTimeWindow(supabase: any, scheduleId: string): Promise<string | null> {
  const { data: schedule } = await supabase
    .from("question_schedules")
    .select("schedule_type, start_date, end_date")
    .eq("id", scheduleId)
    .single();

  if (!schedule || schedule.schedule_type !== "survey") return null; // no restriction for non-survey

  const now = new Date();
  if (schedule.start_date && now < new Date(schedule.start_date)) {
    return "Survey has not started yet";
  }
  if (schedule.end_date && now > new Date(schedule.end_date)) {
    return "Survey submission window has closed";
  }
  return null;
}

async function fetchQuestionMeta(supabase: any, source: string, questionId: string) {
  let questionType = "open_ended";
  let questionOptions: any[] | null = null;

  if (source === "questions") {
    const { data } = await supabase.from("questions").select("type, options").eq("id", questionId).single();
    if (data) { questionType = data.type; questionOptions = data.options; }
  } else if (source === "wellness_questions") {
    const { data } = await supabase.from("wellness_questions").select("question_type, options").eq("id", questionId).single();
    if (data) { questionType = data.question_type; questionOptions = data.options; }
  } else if (source === "generated_questions") {
    const { data } = await supabase.from("generated_questions").select("type, options").eq("id", questionId).single();
    if (data) { questionType = data.type; questionOptions = data.options; }
  }

  return { questionType, questionOptions };
}

function validateAnswer(type: string, value: any, options?: any[]): { valid: boolean; error?: string } {
  switch (type) {
    case "likert_5":
      if (typeof value === "number" && (value < 1 || value > 5)) {
        return { valid: false, error: "Likert scale value must be between 1 and 5" };
      }
      break;
    case "numeric_scale":
    case "scale":
      if (typeof value !== "number" || value < 1 || value > 10) {
        return { valid: false, error: "Numeric scale value must be between 1 and 10" };
      }
      break;
    case "yes_no":
      if (typeof value !== "boolean" && typeof value !== "string") {
        return { valid: false, error: "Yes/No value must be a boolean or string" };
      }
      break;
    case "open_ended":
    case "text":
      if (typeof value !== "string" || value.trim().length === 0) {
        return { valid: false, error: "Open-ended response cannot be empty" };
      }
      if (value.length > 5000) {
        return { valid: false, error: "Response exceeds maximum length of 5000 characters" };
      }
      break;
    case "multiple_choice":
      break;
  }
  return { valid: true };
}
