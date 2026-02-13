import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { batchId } = await req.json();
    if (!batchId) throw new Error("batchId is required");

    // 1. Fetch batch
    const { data: batch, error: batchErr } = await supabase
      .from("question_generation_batches")
      .select("*")
      .eq("id", batchId)
      .single();
    if (batchErr || !batch) throw new Error("Batch not found");

    const tenantId = batch.tenant_id;
    const targetMonth = new Date(batch.target_month);
    const year = targetMonth.getFullYear();
    const month = targetMonth.getMonth();

    // 2. Fetch schedule settings
    const { data: settings } = await supabase
      .from("question_schedule_settings")
      .select("*")
      .eq("tenant_id", tenantId)
      .maybeSingle();

    const workdaysOnly = settings?.workdays_only ?? true;
    const activeDays: number[] = (settings?.active_days as number[]) ?? [1, 2, 3, 4, 5];

    // 3. Fetch questions in batch
    const { data: questions, error: qErr } = await supabase
      .from("wellness_questions")
      .select("id")
      .eq("batch_id", batchId)
      .is("deleted_at", null);
    if (qErr) throw qErr;
    if (!questions || questions.length === 0) throw new Error("No questions in batch");

    // 4. Calculate valid days in month
    const validDays: string[] = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const dayOfWeek = date.getDay(); // 0=Sun, 6=Sat
      if (workdaysOnly && (dayOfWeek === 0 || dayOfWeek === 6)) continue;
      if (activeDays.length > 0 && !activeDays.includes(dayOfWeek)) continue;
      validDays.push(date.toISOString().split("T")[0]);
    }

    if (validDays.length === 0) throw new Error("No valid days in target month");

    // 5. Delete existing schedules for this month
    const monthStart = `${year}-${String(month + 1).padStart(2, "0")}-01`;
    const monthEnd = `${year}-${String(month + 1).padStart(2, "0")}-${String(daysInMonth).padStart(2, "0")}`;

    await supabase
      .from("daily_question_schedule")
      .delete()
      .eq("tenant_id", tenantId)
      .gte("scheduled_date", monthStart)
      .lte("scheduled_date", monthEnd);

    // 6. Round-robin assign
    const records = validDays.map((date, i) => ({
      tenant_id: tenantId,
      question_id: questions[i % questions.length].id,
      scheduled_date: date,
      status: "pending",
    }));

    const { error: insertErr } = await supabase
      .from("daily_question_schedule")
      .insert(records);
    if (insertErr) throw insertErr;

    return new Response(JSON.stringify({ scheduled: records.length, days: validDays.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-batch-schedules error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
