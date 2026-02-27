import React from 'react';
import { useTranslation } from 'react-i18next';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { CycleStep } from '../types';

interface Props {
  createdCycleId: string | null;
}

export const TabsNav = React.memo(function TabsNav({ createdCycleId }: Props) {
  const { t } = useTranslation();

  return (
    <TabsList className="grid w-full grid-cols-4 mb-6">
      <TabsTrigger value="basics">{t('recognition.cycleBuilder.basics')}</TabsTrigger>
      <TabsTrigger value="themes" disabled={!createdCycleId}>{t('recognition.cycleBuilder.themes')}</TabsTrigger>
      <TabsTrigger value="fairness" disabled={!createdCycleId}>{t('recognition.cycleBuilder.fairness')}</TabsTrigger>
      <TabsTrigger value="review" disabled={!createdCycleId}>{t('recognition.cycleBuilder.review')}</TabsTrigger>
    </TabsList>
  );
});
