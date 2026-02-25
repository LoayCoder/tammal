import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await createClient(
      SUPABASE_URL,
      Deno.env.get("SUPABASE_ANON_KEY")!
    ).auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // ── ACTION: upload ───────────────────────────────────────────────
    if (req.method === "POST" && action === "upload") {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const caseId = formData.get("case_id") as string;
      const tenantId = formData.get("tenant_id") as string;
      const expiryDays = parseInt(formData.get("expiry_days") as string || "30");

      if (!file || !caseId || !tenantId) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const allowedTypes = [
        "image/jpeg", "image/png", "image/webp", "image/gif",
        "application/pdf",
        "audio/webm", "audio/mpeg", "audio/ogg",
      ];
      if (!allowedTypes.includes(file.type)) {
        return new Response(JSON.stringify({ error: "File type not allowed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (file.size > 10 * 1024 * 1024) {
        return new Response(JSON.stringify({ error: "File too large (max 10MB)" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const storagePath = `${caseId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabaseAdmin.storage
        .from("support-attachments")
        .upload(storagePath, file, { contentType: file.type });

      if (uploadError) {
        return new Response(JSON.stringify({ error: uploadError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiryDays);

      const watermarkText = `Viewed by ${user.email || user.id.substring(0, 8)}`;

      const { data: attachment, error: insertError } = await supabaseAdmin
        .from("mh_secure_attachments")
        .insert({
          tenant_id: tenantId,
          context: "crisis_case",
          context_id: caseId,
          uploader_user_id: user.id,
          filename: file.name,
          mime_type: file.type,
          size_bytes: file.size,
          storage_path: storagePath,
          expires_at: expiresAt.toISOString(),
          watermark_text: watermarkText,
          access_log: [{ user_id: user.id, action: "upload", at: new Date().toISOString() }],
        })
        .select()
        .single();

      if (insertError) {
        await supabaseAdmin.storage.from("support-attachments").remove([storagePath]);
        return new Response(JSON.stringify({ error: insertError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ attachment }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: view ─────────────────────────────────────────────────
    if (req.method === "POST" && action === "view") {
      const { attachment_id } = await req.json();

      const { data: attachment, error: fetchError } = await supabaseAdmin
        .from("mh_secure_attachments")
        .select("*")
        .eq("id", attachment_id)
        .is("deleted_at", null)
        .single();

      if (fetchError || !attachment) {
        return new Response(JSON.stringify({ error: "Attachment not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new Date(attachment.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "Attachment has expired" }), {
          status: 410,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: signedData, error: signError } = await supabaseAdmin.storage
        .from("support-attachments")
        .createSignedUrl(attachment.storage_path, 300);

      if (signError) {
        return new Response(JSON.stringify({ error: signError.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const accessLog = Array.isArray(attachment.access_log) ? attachment.access_log : [];
      accessLog.push({ user_id: user.id, action: "view", at: new Date().toISOString() });

      await supabaseAdmin
        .from("mh_secure_attachments")
        .update({ access_log: accessLog })
        .eq("id", attachment_id);

      return new Response(JSON.stringify({
        url: signedData.signedUrl,
        watermark: `Viewed by ${user.email || user.id.substring(0, 8)} — ${new Date().toISOString()}`,
        expires_at: attachment.expires_at,
        file_type: attachment.mime_type,
        file_name: attachment.filename,
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── ACTION: revoke ───────────────────────────────────────────────
    if (req.method === "POST" && action === "revoke") {
      const { attachment_id } = await req.json();

      const { data: attachment } = await supabaseAdmin
        .from("mh_secure_attachments")
        .select("storage_path")
        .eq("id", attachment_id)
        .is("deleted_at", null)
        .single();

      if (attachment) {
        await supabaseAdmin.storage.from("support-attachments").remove([attachment.storage_path]);
        await supabaseAdmin
          .from("mh_secure_attachments")
          .update({ deleted_at: new Date().toISOString() })
          .eq("id", attachment_id);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
