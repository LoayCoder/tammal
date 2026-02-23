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
        // Try survey questions (generated_questions linked via question_set_id)
        const { data: surveyQuestions, error: sqError } = await supabase
          .from("generated_questions")
          .select("id")
          .in("question_set_id", batchIds)
          .eq("validation_status", "published");

        if (sqError) {
          console.error("Error fetching survey batch questions:", sqError);
        } else if (surveyQuestions?.length) {
          questions = surveyQuestions.map(q => ({ ...q, _source: "generated_questions" }));
        }

        // Also try wellness questions (wellness_questions linked via batch_id)
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

        console.log(`Found ${questions.length} questions from ${batchIds.length} linked batches (survey: ${surveyQuestions?.length || 0}, wellness: ${wellnessQuestions?.length || 0})`);
      } else {
        // Fallback: general questions pool
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

      // Calculate delivery dates based on frequency
      const deliveryDates: Date[] = [];
      const preferredTime = schedule.preferred_time || "09:00:00";
      const [hours, minutes] = preferredTime.split(":").map(Number);

      for (let day = 0; day < generateForDays; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day);
        date.setHours(hours, minutes, 0, 0);

        const weekendDays = (schedule.weekend_days || (schedule.avoid_weekends ? [5, 6] : [])) as number[];
        if (weekendDays.length > 0 && weekendDays.includes(date.getDay())) {
          continue;
        }

        const dayOfWeek = date.getDay();
        switch (schedule.frequency) {
          case "1_per_day":
            deliveryDates.push(date);
            break;
          case "2_per_day":
            deliveryDates.push(date);
            const afternoonDate = new Date(date);
            afternoonDate.setHours(14, 0, 0, 0);
            deliveryDates.push(afternoonDate);
            break;
          case "3_days_per_week":
            if ([1, 3, 5].includes(dayOfWeek)) {
              deliveryDates.push(date);
            }
            break;
          case "weekly":
            if (dayOfWeek === 1) {
              deliveryDates.push(date);
            }
            break;
          default:
            deliveryDates.push(date);
        }
      }

      // DEDUP: Get ALL question_ids already assigned to each employee for THIS schedule
      const { data: allExistingAssignments } = await supabase
        .from("scheduled_questions")
        .select("employee_id, question_id")
        .eq("schedule_id", schedule.id);

      // Build a Set of "employee_id::question_id" for O(1) lookup
      const assignedSet = new Set(
        (allExistingAssignments || []).map(a => `${a.employee_id}::${a.question_id}`)
      );

      const questionsPerDelivery = schedule.questions_per_delivery || 1;
      const scheduledQuestions = [];

      for (const employee of employees) {
        // Get question_ids already assigned to this employee for this schedule
        const employeeAssignedIds = new Set(
          (allExistingAssignments || [])
            .filter(a => a.employee_id === employee.id)
            .map(a => a.question_id)
        );

        // Filter to only unassigned questions for this employee
        const unassignedQuestions = questions.filter(q => !employeeAssignedIds.has(q.id));

        if (unassignedQuestions.length === 0) {
          console.log(`Employee ${employee.id} has received all questions in schedule ${schedule.id}, skipping`);
          continue;
        }

        for (const deliveryDate of deliveryDates) {
          // Check how many already scheduled for this specific delivery slot
          const deliveryStart = deliveryDate.toISOString();
          const deliveryEnd = new Date(deliveryDate.getTime() + 60000).toISOString();

          const existingForSlot = (allExistingAssignments || []).filter(a => 
            a.employee_id === employee.id
          ).length; // slot-level check handled by unique index

          // Pick questions not yet assigned to this employee across ANY delivery
          const shuffled = [...unassignedQuestions].sort(() => Math.random() - 0.5);
          const selectedQuestions = shuffled.slice(0, questionsPerDelivery);

          for (const question of selectedQuestions) {
            const key = `${employee.id}::${question.id}`;
            if (assignedSet.has(key)) continue; // skip if already assigned

            scheduledQuestions.push({
              schedule_id: schedule.id,
              employee_id: employee.id,
              question_id: question.id,
              tenant_id: schedule.tenant_id,
              scheduled_delivery: deliveryDate.toISOString(),
              status: "pending",
              delivery_channel: "app",
              question_source: question._source,
            });

            // Mark as assigned so subsequent delivery dates won't duplicate
            assignedSet.add(key);
          }

          // Remove selected from unassigned pool for next delivery date
          selectedQuestions.forEach(sq => {
            const idx = unassignedQuestions.findIndex(q => q.id === sq.id);
            if (idx !== -1) unassignedQuestions.splice(idx, 1);
          });

          if (unassignedQuestions.length === 0) break; // no more fresh questions
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