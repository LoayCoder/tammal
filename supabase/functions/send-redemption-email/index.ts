import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RedemptionEmailRequest {
  email: string;
  rewardName: string;
  pointsSpent: number;
  fulfillmentInstructions: string;
  language?: string;
  tenantName?: string;
}

const translations = {
  en: {
    subject: (reward: string) => `Your reward is ready: ${reward}`,
    title: "Reward Redeemed Successfully! 🎉",
    greeting: "Congratulations!",
    body: (reward: string, points: number) =>
      `You have successfully redeemed <strong>${reward}</strong> for <strong>${points} points</strong>.`,
    instructionsLabel: "How to Claim Your Reward",
    footer: "If you have any questions, please contact your HR team.",
  },
  ar: {
    subject: (reward: string) => `مكافأتك جاهزة: ${reward}`,
    title: "تم استبدال المكافأة بنجاح! 🎉",
    greeting: "تهانينا!",
    body: (reward: string, points: number) =>
      `لقد استبدلت بنجاح <strong>${reward}</strong> مقابل <strong>${points} نقطة</strong>.`,
    instructionsLabel: "كيفية استلام مكافأتك",
    footer: "إذا كان لديك أي استفسار، يرجى التواصل مع فريق الموارد البشرية.",
  },
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, rewardName, pointsSpent, fulfillmentInstructions, language = "en", tenantName = "Tammal" }: RedemptionEmailRequest = await req.json();
    console.log("Sending redemption email to:", email, "Reward:", rewardName);

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.warn("RESEND_API_KEY not configured — skipping email");
      return new Response(JSON.stringify({ success: true, message: "Email skipped - no API key" }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const t = translations[language as keyof typeof translations] || translations.en;
    const isRTL = language === "ar";
    const direction = isRTL ? "rtl" : "ltr";
    const textAlign = isRTL ? "right" : "left";

    const instructionsHtml = fulfillmentInstructions
      ? `<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:20px;margin:24px 0;text-align:${textAlign}">
           <p style="margin:0 0 8px;font-weight:600;color:#0369a1">${t.instructionsLabel}</p>
           <p style="margin:0;color:#0c4a6e;white-space:pre-line">${fulfillmentInstructions}</p>
         </div>`
      : "";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "Lovable <onboarding@resend.dev>",
        to: [email],
        subject: t.subject(rewardName),
        html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;direction:${direction}">
          <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:30px;border-radius:12px 12px 0 0;text-align:center">
            <h1 style="color:white;margin:0">${t.title}</h1>
          </div>
          <div style="background:#f9fafb;padding:30px;border-radius:0 0 12px 12px;text-align:${textAlign}">
            <p style="font-size:18px;font-weight:600">${t.greeting}</p>
            <p>${t.body(rewardName, pointsSpent)}</p>
            ${instructionsHtml}
            <p style="font-size:13px;color:#666;margin-top:24px">${t.footer}</p>
          </div>
        </div>`,
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
