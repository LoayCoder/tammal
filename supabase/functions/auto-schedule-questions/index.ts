import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify auth
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) throw new Error("Unauthorized");

    const { tenantId, date } = await req.json();
    if (!tenantId || !date) throw new Error("tenantId and date are required");

    // Get published wellness questions for this tenant
    const { data: questions, error: qErr } = await supabase
      .from("wellness_questions")
      .select("id")
      .eq("tenant_id", tenantId)
      .eq("status", "published")
      .is("deleted_at", null);

    if (qErr) throw qErr;
    if (!questions || questions.length === 0) {
      return new Response(JSON.stringify({ error: "No published wellness questions available" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get recently used questions (last 14 days) to avoid repeats
    const fourteenDaysAgo = new Date(date);
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    const { data: recentSchedules } = await supabase
      .from("daily_question_schedule")
      .select("question_id")
      .eq("tenant_id", tenantId)
      .gte("scheduled_date", fourteenDaysAgo.toISOString().split("T")[0])
      .lt("scheduled_date", date);

    const recentIds = new Set(recentSchedules?.map(s => s.question_id) || []);
    const available = questions.filter(q => !recentIds.has(q.id));
    const pool = available.length > 0 ? available : questions;

    // Pick random question
    const picked = pool[Math.floor(Math.random() * pool.length)];

    // Insert schedule
    const { data: schedule, error: insertErr } = await supabase
      .from("daily_question_schedule")
      .insert({
        tenant_id: tenantId,
        question_id: picked.id,
        scheduled_date: date,
        status: "pending",
      })
      .select()
      .single();

    if (insertErr) throw insertErr;

    return new Response(JSON.stringify(schedule), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("auto-schedule error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
