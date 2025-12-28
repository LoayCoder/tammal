import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const { 
      scheduledQuestionId, 
      answerValue, 
      answerText, 
      responseTimeSeconds,
      deviceType = "web",
      sessionId 
    }: SubmitRequest = await req.json();

    if (!scheduledQuestionId || answerValue === undefined) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the scheduled question details
    const { data: scheduledQuestion, error: sqError } = await supabase
      .from("scheduled_questions")
      .select(`
        id,
        employee_id,
        question_id,
        tenant_id,
        status,
        employees!inner(user_id)
      `)
      .eq("id", scheduledQuestionId)
      .single();

    if (sqError || !scheduledQuestion) {
      return new Response(JSON.stringify({ error: "Scheduled question not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the user owns this employee record
    const employeeData = scheduledQuestion.employees as unknown as { user_id: string };
    if (employeeData.user_id !== userData.user.id) {
      return new Response(JSON.stringify({ error: "Unauthorized to answer this question" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already answered
    if (scheduledQuestion.status === "answered") {
      return new Response(JSON.stringify({ error: "Question already answered" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get question details for validation
    const { data: question, error: qError } = await supabase
      .from("questions")
      .select("type, options")
      .eq("id", scheduledQuestion.question_id)
      .single();

    if (qError || !question) {
      return new Response(JSON.stringify({ error: "Question not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate answer based on question type
    const validationResult = validateAnswer(question.type, answerValue, question.options);
    if (!validationResult.valid) {
      return new Response(JSON.stringify({ error: validationResult.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert the response
    const { data: response, error: insertError } = await supabase
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
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting response:", insertError);
      throw insertError;
    }

    // Update scheduled question status
    const { error: updateError } = await supabase
      .from("scheduled_questions")
      .update({ status: "answered" })
      .eq("id", scheduledQuestionId);

    if (updateError) {
      console.error("Error updating scheduled question:", updateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      response,
      message: "Response submitted successfully"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in submit-response:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function validateAnswer(type: string, value: any, options?: any[]): { valid: boolean; error?: string } {
  switch (type) {
    case "likert_5":
      if (typeof value !== "number" || value < 1 || value > 5) {
        return { valid: false, error: "Likert scale value must be between 1 and 5" };
      }
      break;
    case "numeric_scale":
      if (typeof value !== "number" || value < 1 || value > 10) {
        return { valid: false, error: "Numeric scale value must be between 1 and 10" };
      }
      break;
    case "yes_no":
      if (typeof value !== "boolean") {
        return { valid: false, error: "Yes/No value must be a boolean" };
      }
      break;
    case "open_ended":
      if (typeof value !== "string" || value.trim().length === 0) {
        return { valid: false, error: "Open-ended response cannot be empty" };
      }
      if (value.length > 5000) {
        return { valid: false, error: "Response exceeds maximum length of 5000 characters" };
      }
      break;
    case "multiple_choice":
      if (!options || !Array.isArray(options)) {
        return { valid: true }; // Can't validate without options
      }
      // Value should be an index or the option text
      break;
  }
  return { valid: true };
}