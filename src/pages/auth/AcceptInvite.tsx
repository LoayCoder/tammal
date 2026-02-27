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
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useAcceptInvite } from "@/hooks/auth/useAcceptInvite";

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
    if (code.length < 8) return;
    verifyCode(code);
  };

  const validateSignup = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName.trim()) newErrors.fullName = t("profile.fullNameRequired");
    if (password.length < 6) newErrors.password = t("validation.passwordMinLength");
    if (password !== confirmPassword) newErrors.confirmPassword = t("auth.passwordMismatch");
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const onSubmitSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup()) return;
    handleSignup(fullName, password);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="flex justify-end gap-2 p-4">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        {step === "code" && (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t("acceptInvite.title")}</CardTitle>
              <CardDescription>{t("acceptInvite.enterCode")}</CardDescription>
            </CardHeader>
            <CardContent>
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
                </div>
                <Button type="submit" className="w-full" disabled={code.length < 8 || isVerifying}>
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
          </Card>
        )}

        {step === "signup" && invitation && (
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{t("acceptInvite.createAccount")}</CardTitle>
              <CardDescription>{invitation.tenants?.name || t("acceptInvite.title")}</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={onSubmitSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input id="email" type="email" value={invitation.email} disabled className="bg-muted" dir="ltr" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("employees.name")}</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder={t("profile.fullNamePlaceholder")} required />
                  {errors.fullName && <p className="text-sm text-destructive">{errors.fullName}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                  <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                  {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin me-2" /> : null}
                  {t("acceptInvite.createAccount")}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {step === "success" && (
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center space-y-4">
              <CheckCircle className="h-16 w-16 text-primary mx-auto" />
              <h2 className="text-2xl font-bold">{t("acceptInvite.accountCreated")}</h2>
              <p className="text-muted-foreground">{t("acceptInvite.verifyEmailNote")}</p>
              <Button onClick={goToLogin} className="w-full">{t("auth.login")}</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
