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
  language?: string; // 'en' or 'ar'
}

// Email content translations
const translations = {
  en: {
    subject: (tenantName: string) => `You've been invited to join ${tenantName}`,
    welcomeTitle: (tenantName: string) => `Welcome to ${tenantName}!`,
    greeting: (fullName?: string) => `Hello${fullName ? ` ${fullName}` : ''}`,
    inviteText: (tenantName: string) => `You've been invited to join <strong>${tenantName}</strong>. Use the code below:`,
    codeLabel: 'Your Invitation Code',
    buttonText: 'Accept Invitation',
    expiresText: (date: string) => `Expires on <strong>${date}</strong>.`,
  },
  ar: {
    subject: (tenantName: string) => `لقد تمت دعوتك للانضمام إلى ${tenantName}`,
    welcomeTitle: (tenantName: string) => `مرحباً بك في ${tenantName}!`,
    greeting: (fullName?: string) => `مرحباً${fullName ? ` ${fullName}` : ''}`,
    inviteText: (tenantName: string) => `لقد تمت دعوتك للانضمام إلى <strong>${tenantName}</strong>. استخدم الرمز أدناه:`,
    codeLabel: 'رمز الدعوة الخاص بك',
    buttonText: 'قبول الدعوة',
    expiresText: (date: string) => `تنتهي في <strong>${date}</strong>.`,
  },
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, code, tenantName, fullName, expiresAt, inviteUrl, language = 'en' }: InvitationEmailRequest = await req.json();
    console.log("Sending invitation email to:", email, "Code:", code, "Language:", language);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured");
      return new Response(JSON.stringify({ success: true, message: "Email skipped - no API key", code }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Get locale-appropriate date format
    const locale = language === 'ar' ? 'ar-SA' : 'en-US';
    const expiryDate = new Date(expiresAt).toLocaleDateString(locale, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    // Get translations for the selected language
    const t = translations[language as keyof typeof translations] || translations.en;
    const isRTL = language === 'ar';
    const direction = isRTL ? 'rtl' : 'ltr';
    const textAlign = isRTL ? 'right' : 'left';

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Lovable <onboarding@resend.dev>",
        to: [email],
        subject: t.subject(tenantName),
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;direction:${direction}"><div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:30px;border-radius:12px 12px 0 0;text-align:center"><h1 style="color:white;margin:0">${t.welcomeTitle(tenantName)}</h1></div><div style="background:#f9fafb;padding:30px;border-radius:0 0 12px 12px;text-align:${textAlign}"><p>${t.greeting(fullName)},</p><p>${t.inviteText(tenantName)}</p><div style="background:white;border:2px dashed #667eea;border-radius:8px;padding:20px;text-align:center;margin:24px 0"><p style="margin:0 0 8px;font-size:14px;color:#666">${t.codeLabel}</p><p style="margin:0;font-size:32px;font-weight:bold;font-family:monospace;letter-spacing:4px;color:#667eea">${code}</p></div><a href="${inviteUrl}" style="display:block;background:linear-gradient(135deg,#667eea,#764ba2);color:white;text-decoration:none;padding:14px 28px;border-radius:8px;font-weight:600;text-align:center">${t.buttonText}</a><p style="font-size:14px;color:#666;margin-top:24px">${t.expiresText(expiryDate)}</p></div></div>`,
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
