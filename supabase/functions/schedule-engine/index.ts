import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScheduleRequest {
  scheduleId?: string;
  generateForDays?: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { scheduleId, generateForDays = 7 }: ScheduleRequest = await req.json().catch(() => ({}));

    // Get active schedules
    let schedulesQuery = supabase
      .from("question_schedules")
      .select("*")
      .eq("status", "active")
      .is("deleted_at", null)
      .eq("schedule_type", "survey"); // Only process survey schedules; daily check-ins use the mood pathway

    if (scheduleId) {
      schedulesQuery = schedulesQuery.eq("id", scheduleId);
    }

    const { data: schedules, error: schedulesError } = await schedulesQuery;

    if (schedulesError) {
      console.error("Error fetching schedules:", schedulesError);
      throw schedulesError;
    }

    if (!schedules?.length) {
      return new Response(JSON.stringify({ message: "No active schedules found", scheduled: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let totalScheduled = 0;

    for (const schedule of schedules) {
      console.log(`Processing schedule: ${schedule.name} (${schedule.id})`);

      // Get target employees based on audience config
      const targetAudience = schedule.target_audience || { all: true };
      let employeesQuery = supabase
        .from("employees")
        .select("id")
        .eq("tenant_id", schedule.tenant_id)
        .eq("status", "active")
        .is("deleted_at", null);

      // Branch/Site Scoping
      if (schedule.branch_id) {
        employeesQuery = employeesQuery.eq("branch_id", schedule.branch_id);
      }
      if (schedule.site_id) {
        employeesQuery = employeesQuery.eq("site_id", schedule.site_id);
      }

      if (!targetAudience.all) {
        if (targetAudience.departments?.length) {
          employeesQuery = employeesQuery.in("department", targetAudience.departments);
        }
        if (targetAudience.specific_employees?.length) {
          employeesQuery = employeesQuery.in("id", targetAudience.specific_employees);
        }
      }

      const { data: employees, error: empError } = await employeesQuery;
      if (empError) {
        console.error("Error fetching employees:", empError);
        continue;
      }

      if (!employees?.length) {
        console.log(`No employees found for schedule ${schedule.id}`);
        continue;
      }

      // Get available questions - from linked batches or general pool
      const batchIds = (schedule.batch_ids || []) as string[];
      let questions: { id: string; _source: string }[] = [];

      if (batchIds.length > 0) {
        const { data: surveyQuestions, error: sqError } = await supabase
          .from("generated_questions")
          .select("id")
          .in("question_set_id", batchIds)
          .in("validation_status", ["published", "passed"]);

        if (sqError) {
          console.error("Error fetching survey batch questions:", sqError);
        } else if (surveyQuestions?.length) {
          questions = surveyQuestions.map(q => ({ ...q, _source: "generated_questions" }));
        }

        const { data: wellnessQuestions, error: wqError } = await supabase
          .from("wellness_questions")
          .select("id")
          .in("batch_id", batchIds)
          .eq("status", "published")
          .is("deleted_at", null);

        if (wqError) {
          console.error("Error fetching wellness batch questions:", wqError);
        } else if (wellnessQuestions?.length) {
          questions = [...questions, ...wellnessQuestions.map(q => ({ ...q, _source: "wellness_questions" }))];
        }

        console.log(`Found ${questions.length} questions from ${batchIds.length} linked batches`);
      } else {
        const activeCategories = schedule.active_categories || [];
        let questionsQuery = supabase
          .from("questions")
          .select("id")
          .eq("is_active", true)
          .is("deleted_at", null);

        if (activeCategories.length > 0) {
          questionsQuery = questionsQuery.in("category_id", activeCategories);
        }

        questionsQuery = questionsQuery.or(`tenant_id.eq.${schedule.tenant_id},is_global.eq.true`);

        const { data: poolQuestions, error: qError } = await questionsQuery;
        if (qError) {
          console.error("Error fetching questions:", qError);
          continue;
        }
        questions = (poolQuestions || []).map(q => ({ ...q, _source: "questions" }));
      }

      if (!questions.length) {
        console.log(`No questions found for schedule ${schedule.id}`);
        continue;
      }

      // DEDUP: Get ALL question_ids already assigned to each employee for THIS schedule
      const { data: allExistingAssignments } = await supabase
        .from("scheduled_questions")
        .select("employee_id, question_id")
        .eq("schedule_id", schedule.id);

      const assignedSet = new Set(
        (allExistingAssignments || []).map(a => `${a.employee_id}::${a.question_id}`)
      );

      const scheduledQuestions: any[] = [];

      // --- SURVEY: Deliver ALL questions at once ---
      // Use the schedule start_date as the single delivery timestamp.
      // No multi-day batching, no questions_per_delivery slicing.
      const surveyDeliveryDate = new Date(schedule.start_date || new Date());

      for (const employee of employees) {
        const employeeAssignedIds = new Set(
          (allExistingAssignments || [])
            .filter(a => a.employee_id === employee.id)
            .map(a => a.question_id)
        );

        const unassignedQuestions = questions.filter(q => !employeeAssignedIds.has(q.id));

        if (unassignedQuestions.length === 0) {
          console.log(`Employee ${employee.id} has received all questions in schedule ${schedule.id}, skipping`);
          continue;
        }

        // Assign ALL unassigned questions at once
        for (const question of unassignedQuestions) {
          const key = `${employee.id}::${question.id}`;
          if (assignedSet.has(key)) continue;

          scheduledQuestions.push({
            schedule_id: schedule.id,
            employee_id: employee.id,
            question_id: question.id,
            tenant_id: schedule.tenant_id,
            scheduled_delivery: surveyDeliveryDate.toISOString(),
            status: "pending",
            delivery_channel: "app",
            question_source: question._source,
          });

          assignedSet.add(key);
        }
      }

      if (scheduledQuestions.length > 0) {
        const { error: insertError } = await supabase
          .from("scheduled_questions")
          .insert(scheduledQuestions);

        if (insertError) {
          console.error("Error inserting scheduled questions:", insertError);
        } else {
          totalScheduled += scheduledQuestions.length;
          console.log(`Scheduled ${scheduledQuestions.length} questions for schedule ${schedule.id}`);
        }
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      scheduled: totalScheduled,
      message: `Successfully scheduled ${totalScheduled} questions` 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error in schedule-engine:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
