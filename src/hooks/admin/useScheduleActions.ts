import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { runScheduleNow, fetchSchedulePreview } from '@/services/scheduleService';

export function useScheduleActions() {
  const { t } = useTranslation();
  const [runningId, setRunningId] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [previewQuestions, setPreviewQuestions] = useState<any[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);

  const handleRunNow = async (scheduleId: string) => {
    setRunningId(scheduleId);
    try {
      const message = await runScheduleNow(scheduleId);
      toast.success(message || t('schedules.runSuccess'));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('schedules.runError');
      toast.error(message);
    } finally {
      setRunningId(null);
    }
  };

  const handlePreview = async (scheduleId: string) => {
    setPreviewId(scheduleId);
    setPreviewLoading(true);
    try {
      const merged = await fetchSchedulePreview(scheduleId);
      setPreviewQuestions(merged);
    } catch {
      toast.error(t('common.error'));
      setPreviewQuestions([]);
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreview = () => {
    setPreviewId(null);
    setPreviewQuestions([]);
  };

  return {
    runningId,
    previewId,
    previewQuestions,
    previewLoading,
    handleRunNow,
    handlePreview,
    closePreview,
  };
}
