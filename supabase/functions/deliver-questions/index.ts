import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date().toISOString();

    // First, fetch survey-only schedule IDs to scope delivery
    const { data: surveySchedules, error: schedError } = await supabase
      .from("question_schedules")
      .select("id")
      .eq("schedule_type", "survey")
      .eq("status", "active")
      .is("deleted_at", null);

    if (schedError) {
      console.error("Error fetching survey schedules:", schedError);
      throw schedError;
    }

    const surveyScheduleIds = (surveySchedules ?? []).map(s => s.id);

    if (!surveyScheduleIds.length) {
      return new Response(JSON.stringify({ 
        message: "No active survey schedules found", 
        delivered: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find pending questions that are due for delivery — scoped to survey schedules only
    const { data: pendingQuestions, error: fetchError } = await supabase
      .from("scheduled_questions")
      .select(`
        id,
        employee_id,
        question_id,
        scheduled_delivery,
        delivery_channel,
        employees!inner(email, full_name, user_id)
      `)
      .eq("status", "pending")
      .lte("scheduled_delivery", now)
      .in("schedule_id", surveyScheduleIds)
      .limit(100);

    if (fetchError) {
      console.error("Error fetching pending questions:", fetchError);
      throw fetchError;
    }

    if (!pendingQuestions?.length) {
      return new Response(JSON.stringify({ 
        message: "No survey questions due for delivery", 
        delivered: 0 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${pendingQuestions.length} survey questions to deliver`);

    // Update status to delivered
    const questionIds = pendingQuestions.map(q => q.id);
    
    const { error: updateError } = await supabase
      .from("scheduled_questions")
      .update({ 
        status: "delivered",
        actual_delivery: now
      })
      .in("id", questionIds);

    if (updateError) {
      console.error("Error updating question status:", updateError);
      throw updateError;
    }

    // Group by employee for notification purposes
    const employeeNotifications = pendingQuestions.reduce((acc, q) => {
      const empId = q.employee_id;
      if (!acc[empId]) {
        acc[empId] = {
          employee: q.employees,
          questions: []
        };
      }
      acc[empId].questions.push(q.question_id);
      return acc;
    }, {} as Record<string, { employee: any; questions: string[] }>);

    console.log(`Delivered survey questions to ${Object.keys(employeeNotifications).length} employees`);

    return new Response(JSON.stringify({ 
      success: true,
      delivered: pendingQuestions.length,
      employees: Object.keys(employeeNotifications).length,
      message: `Delivered ${pendingQuestions.length} survey questions to ${Object.keys(employeeNotifications).length} employees`
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in deliver-questions:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
