import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { ThemeBuilder } from '@/components/recognition/ThemeBuilder';

interface Props {
  cycleId: string | null;
  onNext: () => void;
}

export const ThemeBuilderTab = React.memo(function ThemeBuilderTab({ cycleId, onNext }: Props) {
  const { t } = useTranslation();

  return (
    <div>
      {cycleId && <ThemeBuilder cycleId={cycleId} />}
      <div className="flex justify-end mt-4">
        <Button onClick={onNext}>{t('common.next')}</Button>
      </div>
    </div>
  );
});
