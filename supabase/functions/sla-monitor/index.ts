import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const DEFAULT_SLA = { approaching_percent: 80, breach_percent: 100 };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth: require service role key or valid admin JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    if (token !== serviceKey) {
      const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData, error: authErr } = await userClient.auth.getUser();
      if (authErr || !userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(supabaseUrl, serviceKey);
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userData.user.id);

      const hasAdmin = (roles ?? []).some(
        (r: any) => r.role === "super_admin" || r.role === "tenant_admin"
      );
      if (!hasAdmin) {
        return new Response(JSON.stringify({ error: "Forbidden: admin role required" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // Fetch all actions with SLA configured
    const { data: slaActions, error: fetchErr } = await supabase
      .from("objective_actions")
      .select("id, tenant_id, sla_minutes, sla_status, created_at, status")
      .is("deleted_at", null)
      .not("sla_minutes", "is", null)
      .not("status", "eq", "completed");

    if (fetchErr) throw fetchErr;

    // Build per-tenant SLA threshold cache from governance_config
    const tenantIds = [...new Set((slaActions ?? []).map((a: any) => a.tenant_id))];
    const slaMap: Record<string, typeof DEFAULT_SLA> = {};

    if (tenantIds.length > 0) {
      const { data: configs } = await supabase
        .from("governance_config")
        .select("tenant_id, config_value")
        .eq("config_key", "sla_thresholds")
        .is("deleted_at", null)
        .in("tenant_id", tenantIds);

      for (const cfg of configs ?? []) {
        try {
          const val = cfg.config_value as any;
          if (val && typeof val.approaching_percent === "number") {
            slaMap[cfg.tenant_id] = val;
          }
        } catch {
          // fallback to defaults
        }
      }
    }

    let updated = 0;
    const now = Date.now();

    for (const action of slaActions ?? []) {
      const elapsedMs = now - new Date(action.created_at).getTime();
      const elapsedMinutes = elapsedMs / 60_000;
      const slaMinutes = action.sla_minutes as number;
      const percentUsed = (elapsedMinutes / slaMinutes) * 100;

      const tenantSla = slaMap[action.tenant_id] ?? DEFAULT_SLA;

      let newStatus: string;
      if (percentUsed >= tenantSla.breach_percent) {
        newStatus = "breached";
      } else if (percentUsed >= tenantSla.approaching_percent) {
        newStatus = "approaching_breach";
      } else {
        newStatus = "within_sla";
      }

      if (newStatus !== action.sla_status) {
        const { error: updateErr } = await supabase
          .from("objective_actions")
          .update({ sla_status: newStatus })
          .eq("id", action.id);

        if (!updateErr) updated++;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        actionsScanned: slaActions?.length ?? 0,
        statusUpdates: updated,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
