import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  Smartphone,
  Copy,
  Key,
  AlertTriangle
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/auth/useAuth';

interface MFASetupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type MFAStep = 'status' | 'setup' | 'verify' | 'success' | 'unenroll';

export function MFASetupDialog({ open, onOpenChange }: MFASetupDialogProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [step, setStep] = useState<MFAStep>('status');
  const [isLoading, setIsLoading] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [qrCode, setQrCode] = useState<string>('');
  const [secret, setSecret] = useState<string>('');
  const [factorId, setFactorId] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isUnenrolling, setIsUnenrolling] = useState(false);

  useEffect(() => {
    if (open) {
      checkMFAStatus();
    }
  }, [open]);

  const checkMFAStatus = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) throw error;

      const totpFactors = data.totp || [];
      const verifiedFactor = totpFactors.find(f => f.status === 'verified');
      
      setIsEnrolled(!!verifiedFactor);
      if (verifiedFactor) {
        setFactorId(verifiedFactor.id);
      }
      setStep('status');
    } catch (error) {
      console.error('Failed to check MFA status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartSetup = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      if (data.totp) {
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
        setFactorId(data.id);
        setStep('setup');
      }
    } catch (error) {
      console.error('Failed to start MFA setup:', error);
      toast.error(t('profile.mfaSetupError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async () => {
    if (verifyCode.length !== 6) return;

    setIsVerifying(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      setIsEnrolled(true);
      setStep('success');
      toast.success(t('profile.mfaEnabled'));
    } catch (error) {
      console.error('Failed to verify MFA:', error);
      toast.error(t('profile.mfaVerifyError'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleUnenroll = async () => {
    setIsUnenrolling(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) throw error;

      setIsEnrolled(false);
      setFactorId('');
      setStep('status');
      toast.success(t('profile.mfaDisabled'));
    } catch (error) {
      console.error('Failed to disable MFA:', error);
      toast.error(t('profile.mfaDisableError'));
    } finally {
      setIsUnenrolling(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secret);
    toast.success(t('profile.secretCopied'));
  };

  const handleClose = () => {
    setStep('status');
    setVerifyCode('');
    setQrCode('');
    setSecret('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            {t('profile.twoFactorAuth')}
          </DialogTitle>
          <DialogDescription>
            {t('profile.twoFactorAuthDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : step === 'status' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${isEnrolled ? 'bg-green-100 text-green-600' : 'bg-muted'}`}>
                    {isEnrolled ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{t('profile.authenticatorApp')}</p>
                    <p className="text-sm text-muted-foreground">
                      {isEnrolled ? t('profile.mfaStatusEnabled') : t('profile.mfaStatusDisabled')}
                    </p>
                  </div>
                </div>
                <Badge variant={isEnrolled ? 'default' : 'secondary'}>
                  {isEnrolled ? t('profile.enabled') : t('profile.disabled')}
                </Badge>
              </div>

              {isEnrolled ? (
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => setStep('unenroll')}
                >
                  {t('profile.disableMFA')}
                </Button>
              ) : (
                <Button className="w-full" onClick={handleStartSetup}>
                  <Smartphone className="me-2 h-4 w-4" />
                  {t('profile.enableMFA')}
                </Button>
              )}
            </div>
          ) : step === 'setup' ? (
            <div className="space-y-4">
              <Alert>
                <Smartphone className="h-4 w-4" />
                <AlertDescription>
                  {t('profile.scanQRCode')}
                </AlertDescription>
              </Alert>

              {qrCode && (
                <div className="flex justify-center p-4 bg-white rounded-lg">
                  <img src={qrCode} alt="MFA QR Code" className="w-48 h-48" />
                </div>
              )}

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">
                  {t('profile.manualEntryCode')}
                </Label>
                <div className="flex gap-2">
                  <Input
                    value={secret}
                    readOnly
                    className="font-mono text-sm"
                  />
                  <Button variant="outline" size="icon" onClick={copySecret}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>{t('profile.verificationCode')}</Label>
                <Input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="000000"
                  value={verifyCode}
                  onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, ''))}
                  className="font-mono text-center text-lg tracking-widest"
                />
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleClose}>
                  {t('common.cancel')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleVerify}
                  disabled={verifyCode.length !== 6 || isVerifying}
                >
                  {isVerifying && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t('profile.verifyAndEnable')}
                </Button>
              </div>
            </div>
          ) : step === 'success' ? (
            <div className="space-y-4 text-center">
              <div className="flex justify-center">
                <div className="p-3 bg-green-100 rounded-full text-green-600">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold">{t('profile.mfaSetupComplete')}</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('profile.mfaSetupCompleteDescription')}
                </p>
              </div>
              <Button className="w-full" onClick={handleClose}>
                {t('common.done')}
              </Button>
            </div>
          ) : step === 'unenroll' ? (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {t('profile.disableMFAWarning')}
                </AlertDescription>
              </Alert>

              <p className="text-sm text-muted-foreground">
                {t('profile.disableMFADescription')}
              </p>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => setStep('status')}>
                  {t('common.cancel')}
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleUnenroll}
                  disabled={isUnenrolling}
                >
                  {isUnenrolling && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
                  {t('profile.confirmDisableMFA')}
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
