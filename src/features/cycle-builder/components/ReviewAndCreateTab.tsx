import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { typography } from "@/theme/tokens";

interface Props {
  cycleName: string;
  onClose: () => void;
}

export const ReviewAndCreateTab = React.memo(function ReviewAndCreateTab({ cycleName, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className={typography.sectionTitle}>{cycleName}</h3>
        <p className={typography.subtitle}>{t('recognition.cycleBuilder.reviewNote')}</p>
      </div>
      <div className="flex justify-end">
        <Button onClick={onClose}>{t('common.done')}</Button>
      </div>
    </div>
  );
});
