import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  verifyInviteCode,
  acceptInvite,
  type InvitationData,
  type VerifyResult,
} from '@/services/inviteService';

export function useAcceptInvite() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [codeError, setCodeError] = useState('');
  const [step, setStep] = useState<'code' | 'signup' | 'success'>('code');

  const verifyCode = async (code: string) => {
    setIsVerifying(true);
    setCodeError('');

    try {
      const result: VerifyResult = await verifyInviteCode(code);

      if (result.status === 'used') {
        setCodeError(t('acceptInvite.codeUsed'));
      } else if (result.status === 'invalid') {
        setCodeError(t('acceptInvite.invalidCode'));
      } else {
        setInvitation(result.invitation);
        setStep('signup');
      }
    } catch {
      setCodeError(t('acceptInvite.invalidCode'));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSignup = async (fullName: string, password: string) => {
    if (!invitation) return;
    setIsSubmitting(true);

    try {
      await acceptInvite({
        invitation,
        fullName,
        password,
        redirectUrl: `${window.location.origin}/`,
      });
      setStep('success');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('acceptInvite.createError');
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToLogin = () => navigate('/auth');

  return {
    step, setStep,
    invitation,
    isVerifying,
    isSubmitting,
    codeError,
    verifyCode,
    handleSignup,
    goToLogin,
  };
}
