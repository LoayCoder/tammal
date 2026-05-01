import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePlatformSettings } from '@/hooks/org/usePlatformSettings';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/auth/useAuth';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageSelector } from '@/components/LanguageSelector';
import { useBranding } from '@/hooks/branding/useBranding';
import { ThemeLogo } from '@/components/branding/ThemeLogo';
import { PWAInstallBanner } from '@/components/pwa/PWAInstallBanner';
import { ArrowRight, Building2, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { cardVariants, typography } from "@/theme/tokens";
import { cn } from "@/lib/utils";

export default function Auth() {
  const { t } = useTranslation();

  const authSchema = z.object({
    email: z.string().email(t('validation.invalidEmail')),
    password: z.string().min(6, t('validation.passwordMinLength')),
  });
  const navigate = useNavigate();
  
  const { user, signIn, signUp, loading } = useAuth();
  
  const { allowSignup, showInvitation, isPending: settingsLoading } = usePlatformSettings();
  const { branding } = useBranding();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  const trustSignals = [
    { label: 'Encrypted authentication', icon: ShieldCheck },
    { label: 'Workspace-aware access', icon: Building2 },
    { label: 'Premium invite support', icon: LockKeyhole },
  ];

  useEffect(() => {
    if (user && !loading) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  // Force login mode when signup is disabled
  useEffect(() => {
    if (!allowSignup && !isLogin) {
      setIsLogin(true);
    }
  }, [allowSignup, isLogin]);

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    try {
      authSchema.parse({ email, password });
    } catch (e) {
      if (e instanceof z.ZodError) {
        e.errors.forEach((err) => {
          if (err.path[0] === 'email') newErrors.email = err.message;
          if (err.path[0] === 'password') newErrors.password = err.message;
        });
      }
    }

    if (!isLogin && password !== confirmPassword) {
      newErrors.confirmPassword = t('auth.passwordMismatch');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const { error } = await signIn(email, password);
        if (error) {
          toast.error(error.message || t('auth.invalidCredentials'));
        } else {
          toast.success(t('toast.loggedIn'));
        }
      } else {
        const { error } = await signUp(email, password);
        if (error) {
          toast.error(error.message);
        } else {
          toast.success(t('toast.accountCreated'));
          setIsLogin(true);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--bg-canvas)] auth-noise">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.12),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(139,92,246,0.14),transparent_34%)]" />
      <PWAInstallBanner />
      <div className="relative flex justify-end gap-2 p-4">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)]/80 p-1 backdrop-blur">
          <div className="flex items-center gap-2">
            <LanguageSelector />
            <ThemeToggle />
          </div>
        </div>
      </div>
      
      <div className="relative flex min-h-[calc(100vh-72px)] items-center justify-center px-4 py-8">
        <div className="grid w-full max-w-5xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <Card className={cn(cardVariants.elevated, "hidden overflow-hidden border-[var(--border-default)] bg-[linear-gradient(160deg,rgba(23,32,51,0.96),rgba(11,16,32,0.92))] lg:block")}>
            <CardContent className="flex h-full flex-col justify-between p-8">
              <div className="space-y-6">
                <Badge variant="outline" className="w-fit rounded-full border-[var(--border-subtle)] bg-[var(--brand-primary-soft)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--brand-primary)]">
                  <Sparkles className="me-1 h-3.5 w-3.5" />
                  Enterprise access
                </Badge>
                <div>
                  <h1 className="text-4xl font-bold tracking-[-0.03em] text-[var(--text-primary)]">Secure sign in for modern workforce operations.</h1>
                  <p className="mt-3 max-w-md text-sm leading-6 text-[var(--text-secondary)]">
                    Premium authentication, branded onboarding continuity, and trust signals aligned with the enterprise Tammal shell.
                  </p>
                </div>
                <div className="space-y-3">
                  {trustSignals.map((signal) => (
                    <div key={signal.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--brand-primary-soft)] text-[var(--brand-primary)]">
                          <signal.icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-[var(--text-primary)]">{signal.label}</p>
                          <p className="text-xs text-[var(--text-secondary)]">Professional, policy-aware access for every workspace session.</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={cn(cardVariants.premiumVip, "w-full max-w-xl border-[rgba(20,184,166,0.18)] bg-[rgba(23,32,51,0.96)] shadow-[var(--shadow-md)] lg:max-w-none")}>
            <CardHeader className="space-y-5 p-6 text-center">
              <div className="flex justify-center">
                <ThemeLogo
                  logoUrl={branding.logo_url}
                  logoLightUrl={branding.logo_light_url}
                  logoDarkUrl={branding.logo_dark_url}
                  className="h-14 w-auto max-w-[180px]"
                  alt="Tammal"
                  fallback={
                    <span className="text-3xl font-bold text-primary">Tammal</span>
                  }
                />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-2xl text-[var(--text-primary)]">
                  {isLogin ? t('auth.loginTitle') : t('auth.signupTitle')}
                </CardTitle>
                <CardDescription className="text-[var(--text-secondary)]">
                  {isLogin ? t('auth.loginSubtitle') : t('auth.signupSubtitle')}
                </CardDescription>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                {trustSignals.map((signal) => (
                  <div key={signal.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3 text-start">
                    <p className={typography.statLabel}>Trust</p>
                    <p className="mt-1 text-xs leading-5 text-[var(--text-secondary)]">{signal.label}</p>
                  </div>
                ))}
              </div>
            </CardHeader>
            <CardContent className="space-y-5 p-6 pt-0">
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('auth.email')}</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={t('placeholders.email')}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    dir="ltr"
                    className="h-11 rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)] focus-visible:ring-[var(--brand-primary)]/40"
                  />
                  {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">{t('auth.password')}</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11 rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)] focus-visible:ring-[var(--brand-primary)]/40"
                  />
                  {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                </div>

                {!isLogin && (
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="h-11 rounded-xl border-[var(--border-subtle)] bg-[var(--bg-surface)] focus-visible:ring-[var(--brand-primary)]/40"
                    />
                    {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
                  </div>
                )}

                <Button type="submit" className="h-11 w-full rounded-xl bg-[var(--brand-primary)] text-slate-950 hover:bg-[var(--brand-primary-hover)]" disabled={isSubmitting || settingsLoading}>
                  {isSubmitting ? t('common.loading') : (isLogin ? t('auth.login') : t('auth.signup'))}
                  {!isSubmitting && <ArrowRight className="ms-2 h-4 w-4" />}
                </Button>
              </form>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)]">
                <p className="font-medium text-[var(--text-primary)]">Trust signals</p>
                <p className="mt-1 leading-6">Protected access, consistent invite handling, and workspace-aware authentication settings are active on this shell.</p>
              </div>

              <div className="space-y-2 text-center text-sm">
                {allowSignup && (
                  isLogin ? (
                    <p className="text-[var(--text-secondary)]">
                      {t('auth.noAccount')}{' '}
                      <button
                        type="button"
                        onClick={() => setIsLogin(false)}
                        className="font-medium text-[var(--brand-primary)] hover:underline"
                      >
                        {t('auth.signup')}
                      </button>
                    </p>
                  ) : (
                    <p className="text-[var(--text-secondary)]">
                      {t('auth.hasAccount')}{' '}
                      <button
                        type="button"
                        onClick={() => setIsLogin(true)}
                        className="font-medium text-[var(--brand-primary)] hover:underline"
                      >
                        {t('auth.login')}
                      </button>
                    </p>
                  )
                )}

                {showInvitation && (
                  <p className="text-[var(--text-secondary)]">
                    {t('auth.haveInviteCode')}{' '}
                    <Link to="/auth/accept-invite" className="font-medium text-[var(--brand-primary)] hover:underline">
                      {t('auth.useInviteCode')}
                    </Link>
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
