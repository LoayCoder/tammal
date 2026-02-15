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
      .is("deleted_at", null);

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
      let questions: { id: string }[] = [];

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
          questions = surveyQuestions;
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
          questions = [...questions, ...wellnessQuestions];
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
        questions = poolQuestions || [];
      }

      if (!questions.length) {
        console.log(`No questions found for schedule ${schedule.id}`);
        continue;
      }

      // Get recently asked questions (last 30 days) for each employee
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      // Calculate delivery dates based on frequency
      const deliveryDates: Date[] = [];
      const preferredTime = schedule.preferred_time || "09:00:00";
      const [hours, minutes] = preferredTime.split(":").map(Number);

      for (let day = 0; day < generateForDays; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day);
        date.setHours(hours, minutes, 0, 0);

        // Skip configured weekend/off days
        const weekendDays = (schedule.weekend_days || (schedule.avoid_weekends ? [5, 6] : [])) as number[];
        if (weekendDays.length > 0 && weekendDays.includes(date.getDay())) {
          continue;
        }

        // Apply frequency logic
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
            if ([1, 3, 5].includes(dayOfWeek)) { // Mon, Wed, Fri
              deliveryDates.push(date);
            }
            break;
          case "weekly":
            if (dayOfWeek === 1) { // Monday only
              deliveryDates.push(date);
            }
            break;
          default:
            deliveryDates.push(date);
        }
      }

      // Create scheduled questions for each employee and delivery date
      const scheduledQuestions = [];

      for (const employee of employees) {
        // Get employee's recent questions
        const { data: recentQuestions } = await supabase
          .from("scheduled_questions")
          .select("question_id")
          .eq("employee_id", employee.id)
          .gte("scheduled_delivery", thirtyDaysAgo.toISOString());

        const recentQuestionIds = new Set(recentQuestions?.map(q => q.question_id) || []);

        // Filter out recently asked questions
        const availableQuestions = questions.filter(q => !recentQuestionIds.has(q.id));

        if (availableQuestions.length === 0) {
          console.log(`No available questions for employee ${employee.id} (all recently asked)`);
          continue;
        }

        for (const deliveryDate of deliveryDates) {
          // Check if already scheduled
          const { data: existing } = await supabase
            .from("scheduled_questions")
            .select("id")
            .eq("employee_id", employee.id)
            .eq("schedule_id", schedule.id)
            .gte("scheduled_delivery", deliveryDate.toISOString())
            .lt("scheduled_delivery", new Date(deliveryDate.getTime() + 60000).toISOString())
            .maybeSingle();

          if (existing) {
            continue;
          }

          // Select random questions for this delivery
          const questionsPerDelivery = schedule.questions_per_delivery || 1;
          const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
          const selectedQuestions = shuffled.slice(0, questionsPerDelivery);

          for (const question of selectedQuestions) {
            scheduledQuestions.push({
              schedule_id: schedule.id,
              employee_id: employee.id,
              question_id: question.id,
              tenant_id: schedule.tenant_id,
              scheduled_delivery: deliveryDate.toISOString(),
              status: "pending",
              delivery_channel: "app",
            });
          }
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