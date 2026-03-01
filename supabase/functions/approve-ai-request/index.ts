import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Role hierarchy (matches featureGate.ts)
const ADMIN_ROLES = ["tenant_admin", "super_admin"];

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
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Authenticate caller
    const token = authHeader.replace("Bearer ", "");
    const { data: authData } = await supabase.auth.getUser(token);
    if (!authData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = authData.user.id;

    // Resolve tenant
    const { data: tenantId } = await supabase.rpc("get_user_tenant_id", {
      _user_id: userId,
    });
    if (!tenantId) {
      return new Response(JSON.stringify({ error: "No tenant found" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const userRoles = (roles || []).map((r: { role: string }) => r.role);
    const isAdmin = userRoles.some((r: string) => ADMIN_ROLES.includes(r));

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Only admins can approve AI requests" }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    const { pending_request_id, action } = body;

    if (!pending_request_id || !["approve", "reject"].includes(action)) {
      return new Response(
        JSON.stringify({
          error: "Required: pending_request_id and action (approve|reject)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Fetch the pending request (must be same tenant)
    const { data: pending, error: fetchErr } = await supabase
      .from("ai_pending_requests")
      .select("id, tenant_id, status")
      .eq("id", pending_request_id)
      .eq("tenant_id", tenantId)
      .single();

    if (fetchErr || !pending) {
      return new Response(
        JSON.stringify({ error: "Pending request not found" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (pending.status !== "pending") {
      return new Response(
        JSON.stringify({
          error: `Request already ${pending.status}`,
          status: pending.status,
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Update status
    const newStatus = action === "approve" ? "approved" : "rejected";
    const { error: updateErr } = await supabase
      .from("ai_pending_requests")
      .update({
        status: newStatus,
        decided_at: new Date().toISOString(),
        decided_by: userId,
      })
      .eq("id", pending_request_id);

    if (updateErr) {
      console.error("Failed to update pending request:", updateErr.message);
      return new Response(
        JSON.stringify({ error: "Failed to update request" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    console.log(
      `ApproveAIRequest: ${action}d request=${pending_request_id} by=${userId.substring(0, 8)}…`,
    );

    return new Response(
      JSON.stringify({
        success: true,
        pending_request_id,
        status: newStatus,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("Error in approve-ai-request:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
