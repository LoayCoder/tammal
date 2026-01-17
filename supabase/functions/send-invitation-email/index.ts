import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationEmailRequest {
  email: string;
  code: string;
  tenantName: string;
  fullName?: string;
  expiresAt: string;
  inviteUrl: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, tenantName, fullName, expiresAt, inviteUrl }: InvitationEmailRequest = await req.json();
    console.log("Sending invitation email to:", email, "Code:", code);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ success: true, message: "Email skipped - no API key", code }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const expiryDate = new Date(expiresAt).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Lovable <onboarding@resend.dev>",
        to: [email],
        subject: `You've been invited to join ${tenantName}`,
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto"><div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:30px;border-radius:12px 12px 0 0;text-align:center"><h1 style="color:white;margin:0">Welcome to ${tenantName}!</h1></div><div style="background:#f9fafb;padding:30px;border-radius:0 0 12px 12px"><p>Hello${fullName ? ` ${fullName}` : ''},</p><p>You've been invited to join <strong>${tenantName}</strong>. Use the code below:</p><div style="background:white;border:2px dashed #667eea;border-radius:8px;padding:20px;text-align:center;margin:24px 0"><p style="margin:0 0 8px;font-size:14px;color:#666">Your Invitation Code</p><p style="margin:0;font-size:32px;font-weight:bold;font-family:monospace;letter-spacing:4px;color:#667eea">${code}</p></div><a href="${inviteUrl}" style="display:block;background:linear-gradient(135deg,#667eea,#764ba2);color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;text-align:center">Accept Invitation</a><p style="font-size:14px;color:#666;margin-top:24px">Expires on <strong>${expiryDate}</strong>.</p></div></div>`,
      }),
    });

    const result = await res.json();
    console.log("Email sent:", result);

    return new Response(JSON.stringify({ success: true, result }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
