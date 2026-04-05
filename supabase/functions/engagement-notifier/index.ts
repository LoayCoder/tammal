import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface NotificationPayload {
  tenant_id: string;
  recipient_id: string;
  type: string;
  title: string;
  body: string;
  action_path: string;
  metadata: Record<string, unknown>;
}

/** Fetch all active employees for a tenant using cursor-based pagination */
async function fetchAllActiveEmployees(
  supabase: ReturnType<typeof createClient>,
  tenantId: string,
): Promise<{ id: string; tenant_id: string }[]> {
  const PAGE_SIZE = 100;
  const all: { id: string; tenant_id: string }[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from("employees")
      .select("id, tenant_id")
      .eq("tenant_id", tenantId)
      .eq("status", "active")
      .is("deleted_at", null)
      .range(offset, offset + PAGE_SIZE - 1);

    const batch = data ?? [];
    all.push(...batch);
    hasMore = batch.length === PAGE_SIZE;
    offset += PAGE_SIZE;
  }
  return all;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, serviceKey);
    const now = new Date();
    const notifications: NotificationPayload[] = [];

    // Fetch all tenants
    const { data: tenants } = await supabase
      .from("tenants")
      .select("id")
      .is("deleted_at", null);

    for (const tenant of tenants ?? []) {
      const tenantId = tenant.id;
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);

      // 1. Engagement drop: employees with personal score < 35
      const { data: lowScores } = await supabase
        .from("pulse_targets")
        .select("employee_id, tenant_id, current_value, target_date")
        .eq("tenant_id", tenantId)
        .eq("scope", "personal")
        .eq("target_metric", "engagement_score")
        .gte("target_date", thirtyDaysAgo)
        .lt("current_value", 35)
        .is("deleted_at", null)
        .order("target_date", { ascending: false });

      const seenEmployees = new Set<string>();
      for (const row of lowScores ?? []) {
        if (!row.employee_id || seenEmployees.has(row.employee_id)) continue;
        seenEmployees.add(row.employee_id);
        notifications.push({
          tenant_id: tenantId,
          recipient_id: row.employee_id,
          type: "engagement_drop",
          title: "Your engagement score needs attention",
          body: "Your engagement score has dropped below the healthy range. A quick check-in can help.",
          action_path: "/employee/survey",
          metadata: { score: row.current_value },
        });
      }

      // 2. Manager team alert: managers with direct reports scoring < 40
      const { data: managerAlerts } = await supabase
        .from("pulse_targets")
        .select("employee_id, tenant_id, current_value, target_date")
        .eq("tenant_id", tenantId)
        .eq("scope", "personal")
        .eq("target_metric", "engagement_score")
        .gte("target_date", thirtyDaysAgo)
        .lt("current_value", 40)
        .is("deleted_at", null)
        .order("target_date", { ascending: false });

      const lowEmployees = new Map<string, number>();
      for (const row of managerAlerts ?? []) {
        if (row.employee_id && !lowEmployees.has(row.employee_id)) {
          lowEmployees.set(row.employee_id, row.current_value);
        }
      }

      if (lowEmployees.size > 0) {
        const empIds = Array.from(lowEmployees.keys());
        const { data: employees } = await supabase
          .from("employees")
          .select("id, manager_id, tenant_id")
          .eq("tenant_id", tenantId)
          .in("id", empIds)
          .is("deleted_at", null)
          .not("manager_id", "is", null);

        const managerNotifs = new Map<string, number>();
        for (const emp of employees ?? []) {
          if (!emp.manager_id) continue;
          managerNotifs.set(emp.manager_id, (managerNotifs.get(emp.manager_id) ?? 0) + 1);
        }

        for (const [managerId, count] of managerNotifs) {
          notifications.push({
            tenant_id: tenantId,
            recipient_id: managerId,
            type: "manager_team_alert",
            title: "Team engagement requires your attention",
            body: `${count} team member(s) have engagement scores below the healthy threshold.`,
            action_path: "/engagement-insights",
            metadata: { low_count: count },
          });
        }
      }

      // 3. Appreciation reminder: employees with no appreciations sent in 14 days
      const fourteenDaysAgo = new Date(now.getTime() - 14 * 86400000).toISOString();
      const allActiveEmployees = await fetchAllActiveEmployees(supabase, tenantId);

      const { data: recentAppreciations } = await supabase
        .from("appreciations")
        .select("from_employee_id")
        .eq("tenant_id", tenantId)
        .gte("created_at", fourteenDaysAgo)
        .is("deleted_at", null);

      const activeSenders = new Set((recentAppreciations ?? []).map((a) => a.from_employee_id));

      for (const emp of allActiveEmployees) {
        if (!activeSenders.has(emp.id)) {
          notifications.push({
            tenant_id: tenantId,
            recipient_id: emp.id,
            type: "appreciation_reminder",
            title: "Spread some recognition today",
            body: "It's been a while since you recognized a colleague. A kind word goes a long way.",
            action_path: "/",
            metadata: {},
          });
        }
      }

      // 4. Pulse nudge: employees with no check-in in 7 days
      const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000).toISOString();
      const { data: recentCheckins } = await supabase
        .from("mood_entries")
        .select("employee_id")
        .eq("tenant_id", tenantId)
        .gte("created_at", sevenDaysAgo)
        .is("deleted_at", null);

      const checkedIn = new Set((recentCheckins ?? []).map((c) => c.employee_id));

      for (const emp of allActiveEmployees) {
        if (!checkedIn.has(emp.id)) {
          notifications.push({
            tenant_id: tenantId,
            recipient_id: emp.id,
            type: "pulse_nudge",
            title: "How are you feeling today?",
            body: "You haven't checked in recently. Take a moment to share how you're doing.",
            action_path: "/employee/survey",
            metadata: {},
          });
        }
      }

      // 5. Action followup: CTA logged > 3 days ago without follow-through
      const threeDaysAgo = new Date(now.getTime() - 3 * 86400000).toISOString();
      const { data: pendingCTAs } = await supabase
        .from("engagement_action_log")
        .select("employee_id, tenant_id, source, metadata")
        .eq("tenant_id", tenantId)
        .eq("action_type", "cta_clicked")
        .lt("created_at", threeDaysAgo)
        .is("deleted_at", null)
        .limit(200);

      for (const cta of pendingCTAs ?? []) {
        const meta = cta.metadata as Record<string, unknown> | null;
        notifications.push({
          tenant_id: tenantId,
          recipient_id: cta.employee_id,
          type: "action_followup",
          title: "Complete your engagement action",
          body: "You started an engagement action recently. Following through can boost your team's pulse.",
          action_path: (meta?.actionPath as string) || "/",
          metadata: { source: cta.source },
        });
      }
    } // end tenant loop

    // Apply anti-spam: 48h cooldown per type+recipient, max 2 per employee per day
    const fortyEightHoursAgo = new Date(now.getTime() - 48 * 3600000).toISOString();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();

    const recipientIds = [...new Set(notifications.map((n) => n.recipient_id))];

    // Fetch recent notifications for dedup (paginated in batches of 500)
    const recentKeys = new Set<string>();
    const todayCounts = new Map<string, number>();

    for (let i = 0; i < recipientIds.length; i += 500) {
      const batch = recipientIds.slice(i, i + 500);
      const { data: recentNotifs } = await supabase
        .from("engagement_notifications")
        .select("recipient_id, type, created_at")
        .in("recipient_id", batch)
        .gte("created_at", fortyEightHoursAgo)
        .is("deleted_at", null);

      for (const n of recentNotifs ?? []) {
        recentKeys.add(`${n.recipient_id}::${n.type}`);
        if (n.created_at >= todayStart) {
          todayCounts.set(n.recipient_id, (todayCounts.get(n.recipient_id) ?? 0) + 1);
        }
      }
    }

    const filtered: NotificationPayload[] = [];
    const insertCounts = new Map<string, number>();

    for (const n of notifications) {
      const dedupKey = `${n.recipient_id}::${n.type}`;
      if (recentKeys.has(dedupKey)) continue;

      const existingToday = (todayCounts.get(n.recipient_id) ?? 0) + (insertCounts.get(n.recipient_id) ?? 0);
      if (existingToday >= 2) continue;

      filtered.push(n);
      insertCounts.set(n.recipient_id, (insertCounts.get(n.recipient_id) ?? 0) + 1);
      recentKeys.add(dedupKey);
    }

    // Batch insert
    if (filtered.length > 0) {
      const { error } = await supabase.from("engagement_notifications").insert(filtered);
      if (error) {
        console.error("Failed to insert engagement notifications:", error);
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(
      JSON.stringify({ sent: filtered.length, filtered_out: notifications.length - filtered.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (err) {
    console.error("Engagement notifier error:", err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
