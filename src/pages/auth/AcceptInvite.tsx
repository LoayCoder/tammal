import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageSelector } from "@/components/LanguageSelector";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle, AlertCircle, Loader2 } from "lucide-react";

interface InvitationData {
  id: string;
  code: string;
  email: string;
  full_name: string | null;
  tenant_id: string;
  employee_id: string | null;
  tenants: { name: string } | null;
}

export default function AcceptInvite() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState<"code" | "signup" | "success">("code");
  const [code, setCode] = useState(searchParams.get("code") || "");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [codeError, setCodeError] = useState("");

  // Signup form
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

  const verifyCode = async (codeToVerify: string) => {
    setIsVerifying(true);
    setCodeError("");

    try {
      const { data, error } = await supabase
        .from("invitations")
        .select("id, code, email, full_name, tenant_id, employee_id, tenants(name)")
        .eq("code", codeToVerify.toUpperCase())
        .is("deleted_at", null)
        .is("used", false)
        .gt("expires_at", new Date().toISOString())
        .single();

      if (error || !data) {
        // Check if code exists but is used
        const { data: usedCheck } = await supabase
          .from("invitations")
          .select("used")
          .eq("code", codeToVerify.toUpperCase())
          .single();

        if (usedCheck?.used) {
          setCodeError(t("acceptInvite.codeUsed"));
        } else {
          setCodeError(t("acceptInvite.invalidCode"));
        }
        return;
      }

      setInvitation(data as unknown as InvitationData);
      setFullName(data.full_name || "");
      setStep("signup");
    } catch {
      setCodeError(t("acceptInvite.invalidCode"));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (code.length < 8) return;
    verifyCode(code);
  };

  const validateSignup = () => {
    const newErrors: Record<string, string> = {};

    if (!fullName.trim()) {
      newErrors.fullName = t("profile.fullNameRequired");
    }
    if (password.length < 6) {
      newErrors.password = t("validation.passwordMinLength");
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = t("auth.passwordMismatch");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignup() || !invitation) return;

    setIsSubmitting(true);

    try {
      // 1. Create user account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: invitation.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (signUpError) throw signUpError;
      if (!signUpData.user) throw new Error("User creation failed");

      const userId = signUpData.user.id;

      // 2. Update profile with tenant_id
      await supabase
        .from("profiles")
        .update({
          tenant_id: invitation.tenant_id,
          full_name: fullName,
        })
        .eq("user_id", userId);

      // 3. Link or create employee record
      if (invitation.employee_id) {
        // Link existing employee record
        await supabase
          .from("employees")
          .update({ user_id: userId })
          .eq("id", invitation.employee_id);
      } else {
        // Auto-create employee record if none exists
        const { data: newEmp } = await supabase
          .from("employees")
          .insert({
            tenant_id: invitation.tenant_id,
            user_id: userId,
            full_name: fullName,
            email: invitation.email,
            status: "active",
          })
          .select("id")
          .single();

        if (newEmp) {
          await supabase
            .from("invitations")
            .update({ employee_id: newEmp.id })
            .eq("id", invitation.id);
        }
      }

      // 4. Mark invitation as used
      await supabase
        .from("invitations")
        .update({
          used: true,
          used_at: new Date().toISOString(),
          used_by: userId,
        })
        .eq("id", invitation.id);

      // 5. Assign default user role
      await supabase.from("user_roles").insert({
        user_id: userId,
        role: "user" as const,
      });

      setStep("success");
    } catch (error: any) {
      toast.error(error.message || t("acceptInvite.createError"));
    } finally {
      setIsSubmitting(false);
    }
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
                    onChange={(e) => {
                      setCode(e.target.value.toUpperCase());
                      setCodeError("");
                    }}
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
                <Button
                  type="submit"
                  className="w-full"
                  disabled={code.length < 8 || isVerifying}
                >
                  {isVerifying ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : null}
                  {t("acceptInvite.verifyCode")}
                </Button>
              </form>

              <div className="mt-4 text-center text-sm">
                <button
                  type="button"
                  onClick={() => navigate("/auth")}
                  className="text-primary hover:underline"
                >
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
              <CardDescription>
                {invitation.tenants?.name || t("acceptInvite.title")}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSignup} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t("auth.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={invitation.email}
                    disabled
                    className="bg-muted"
                    dir="ltr"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fullName">{t("employees.name")}</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={t("profile.fullNamePlaceholder")}
                    required
                  />
                  {errors.fullName && (
                    <p className="text-sm text-destructive">{errors.fullName}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">{t("auth.password")}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">{t("auth.confirmPassword")}</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin me-2" />
                  ) : null}
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
              <p className="text-muted-foreground">
                {t("acceptInvite.verifyEmailNote")}
              </p>
              <Button onClick={() => navigate("/auth")} className="w-full">
                {t("auth.login")}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
