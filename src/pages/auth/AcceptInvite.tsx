import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { CheckCircle, AlertCircle, Loader2, ShieldCheck, Sparkles, Building2, Mail } from "lucide-react";
import { useAcceptInvite } from "@/hooks/auth/useAcceptInvite";
import { cardVariants, typography } from "@/theme/tokens";
import { cn } from "@/lib/utils";

export default function AcceptInvite() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const {
    step,
    invitation,
    isVerifying,
    isSubmitting,
    codeError,
    verifyCode,
    handleSignup,
    goToLogin,
  } = useAcceptInvite();

  const [code, setCode] = useState(searchParams.get("code") || "");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const passwordChecks = [
    { label: t("validation.passwordMinLength"), valid: password.length >= 8 },
    { label: "Uppercase letter", valid: /[A-Z]/.test(password) },
    { label: "Passwords match", valid: password.length > 0 && password === confirmPassword },
  ];
  const verifyCodeSchema = z.object({
    code: z.string().trim().length(8, t("acceptInvite.codePlaceholder")),
  });
  const signupSchema = z.object({
    fullName: z.string().trim().min(2, t("profile.fullNameRequired")),
    password: z.string().min(8, t("validation.passwordMinLength")),
    confirmPassword: z.string().min(1, t("auth.confirmPassword")),
  }).refine((v) => v.password === v.confirmPassword, {
    message: t("auth.passwordMismatch"),
    path: ["confirmPassword"],
  });

  // Auto-verify if code is in URL
  useEffect(() => {
    const urlCode = searchParams.get("code");
    if (urlCode && urlCode.length === 8) {
      verifyCode(urlCode);
    }
  }, []);

  // Sync invitation name
  useEffect(() => {
    if (invitation?.full_name) setFullName(invitation.full_name);
  }, [invitation]);

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = verifyCodeSchema.safeParse({ code });
    if (!parsed.success) {
      setErrors({ code: parsed.error.flatten().fieldErrors.code?.[0] || "Invalid code" });
      return;
    }
    setErrors({});
    verifyCode(parsed.data.code);
  };

  const onSubmitSignup = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = signupSchema.safeParse({ fullName, password, confirmPassword });
    if (!parsed.success) {
      const fieldErrors = parsed.error.flatten().fieldErrors;
      setErrors({
        fullName: fieldErrors.fullName?.[0] || "",
        password: fieldErrors.password?.[0] || "",
        confirmPassword: fieldErrors.confirmPassword?.[0] || "",
      });
      return;
    }
    setErrors({});
    handleSignup(parsed.data.fullName.trim(), parsed.data.password);
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-canvas)] auth-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_32%)]" />
      <div className="relative flex justify-end gap-2 p-4">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 p-1 backdrop-blur">
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      </div>

      <div className="relative flex flex-1 items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className={cn(cardVariants.elevated, "hidden lg:block overflow-hidden")}>
            <CardContent className="flex h-full flex-col justify-between p-8">
              <div className="space-y-5">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[var(--border-subtle)] bg-[var(--brand-primary-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--brand-primary)]">
                  <Sparkles className="h-3 w-3" />
                  Premium invite flow
                </div>
                <div>
                  <h1 className="text-4xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">Join your workspace with confidence.</h1>
                  <p className="mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                    Secure onboarding, clear organization context, and password guidance designed for enterprise teams.
                  </p>
                </div>
                <div className="space-y-3">
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                    <p className={typography.statLabel}>Organization</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <Building2 className="h-4 w-4 text-[var(--brand-primary)]" />
                      {invitation?.tenants?.name || t("acceptInvite.title")}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                    <p className={typography.statLabel}>Account</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <Mail className="h-4 w-4 text-[var(--chart-2)]" />
                      {invitation?.email || "Pending verification"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                    <p className={typography.statLabel}>Security</p>
                    <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-[var(--text-primary)]">
                      <ShieldCheck className="h-4 w-4 text-[var(--chart-6)]" />
                      Password rules and invite validation
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(cardVariants.premiumVip, "w-full max-w-xl lg:max-w-none")}>
            <CardContent className="p-0">
        {step === "code" && (
          <div>
            <CardHeader className="space-y-2 p-6 text-center">
              <CardTitle className="text-2xl text-[var(--text-primary)]">{t("acceptInvite.title")}</CardTitle>
              <CardDescription>{t("acceptInvite.enterCode")}</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <form onSubmit={handleVerifyCode} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">{t("invitations.code")}</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => { setCode(e.target.value.toUpperCase()); }}
                    placeholder={t("acceptInvite.codePlaceholder")}
                    maxLength={8}
                    className="text-center text-lg tracking-widest font-mono"
                    dir="ltr"
                  />
                  {codeError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {codeError}
                    </p>
                  )}
                  {errors.code && <p className="text-sm text-destructive">{errors.code}</p>}
                </div>
                <Button type="submit" className="h-11 w-full rounded-xl bg-[var(--brand-primary)] text-slate-950 hover:bg-[var(--brand-primary-hover)]" disabled={code.length < 8 || isVerifying}>
                  {isVerifying ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                  {t("acceptInvite.verifyCode")}
                </Button>
              </form>
              <div className="mt-4 text-center text-sm">
                <button type="button" onClick={goToLogin} className="text-primary hover:underline">
                  {t("auth.hasAccount")} {t("auth.login")}
                </button>
              </div>
            </CardContent>
          </div>
        )}

        {step === "signup" && invitation && (
          <div>
            <CardHeader className="space-y-2 p-6 text-center">
              <CardTitle className="text-2xl text-[var(--text-primary)]">{t("acceptInvite.createAccount")}</CardTitle>
              <CardDescription>{invitation.tenants?.name || t("acceptInvite.title")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 p-6 pt-0">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                  <p className={typography.statLabel}>Organization</p>
                  <p className="mt-2 text-sm font-semibold text-[var(--text-primary)]">{invitation.tenants?.name || t("acceptInvite.title")}</p>
                </div>
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                  <p className={typography.statLabel}>Invite code</p>
                  <p className="mt-2 font-mono text-sm tracking-[0.24em] text-[var(--text-primary)]">{invitation.code}</p>
                </div>
              </div>

              <form onSubmit={onSubmitSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input id="email" type="email" value={invitation.email} disabled className="h-11 rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)]" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("employees.name")}</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("profile.fullNamePlaceholder")} className="h-11 rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)]" required />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-11 rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)]" required />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="h-11 rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)]" required />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                  <p className={typography.statLabel}>Password feedback</p>
                  <div className="mt-3 space-y-2">
                    {passwordChecks.map((check) => (
                      <div key={check.label} className="flex items-center gap-2 text-xs">
                        <span className={cn("h-2 w-2 rounded-full", check.valid ? "bg-[var(--chart-6)]" : "bg-[var(--text-muted)]")} />
                        <span className={check.valid ? "text-[var(--text-secondary)]" : "text-[var(--text-muted)]"}>{check.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Button type="submit" className="h-11 w-full rounded-xl bg-[var(--brand-primary)] text-slate-950 hover:bg-[var(--brand-primary-hover)]" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                  {t("acceptInvite.createAccount")}
                </Button>
              </form>
            </CardContent>
          </div>
        )}

        {step === "success" && (
          <div>
            <CardContent className="space-y-4 p-8 text-center">
              <CheckCircle className="h-16 w-16 text-primary mx-auto" />
              <h2 className={typography.metric}>{t("acceptInvite.accountCreated")}</h2>
              <p className="text-muted-foreground">{t("acceptInvite.verifyEmailNote")}</p>
              <Button onClick={goToLogin} className="h-11 w-full rounded-xl bg-[var(--brand-primary)] text-slate-950 hover:bg-[var(--brand-primary-hover)]">{t("auth.login")}</Button>
            </CardContent>
          </div>
        )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
