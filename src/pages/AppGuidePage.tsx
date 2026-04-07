import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOnboardingTour } from '@/hooks/onboarding/useOnboardingTour';

export default function AppGuidePage() {
  const navigate = useNavigate();
  const { resetTour } = useOnboardingTour();

  useEffect(() => {
    resetTour();
    navigate('/', { replace: true });
  }, []);

  return null;
}
