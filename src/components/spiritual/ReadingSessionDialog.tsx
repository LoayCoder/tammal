import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useQuranSessions } from '@/hooks/spiritual/useQuranSessions';

interface ReadingSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surahName: string;
  juzNumber: number | null;
  durationMinutes: number;
  durationSeconds: number;
  totalAyahs?: number;
}

export function ReadingSessionDialog({
  open,
  onOpenChange,
  surahName,
  juzNumber,
  durationMinutes,
  durationSeconds,
  totalAyahs,
}: ReadingSessionDialogProps) {
  const { t } = useTranslation();
  const [reflection, setReflection] = useState('');
  const { logSession } = useQuranSessions();

  const formattedDuration = durationMinutes >= 1
    ? `${durationMinutes} ${t('spiritual.quran.min', 'min')}`
    : `${durationSeconds}s`;

  const handleSave = () => {
    logSession.mutate({
      duration_minutes: Math.max(1, durationMinutes),
      surah_name: surahName || undefined,
      juz_number: juzNumber ?? undefined,
      reflection_notes: reflection.trim() || undefined,
      ayahs_read: totalAyahs ?? 0,
    });
    setReflection('');
    onOpenChange(false);
  };

  const handleDiscard = () => {
    setReflection('');
    onOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('spiritual.quran.sessionDialog.title', 'Save Reading Session?')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('spiritual.quran.sessionDialog.description', 'You read {{surah}} for {{duration}}. Would you like to log this session?', {
              surah: surahName,
              duration: formattedDuration,
            })}
            {totalAyahs ? ` (${totalAyahs} ${t('spiritual.quran.ayahsRead', 'ayahs')})` : ''}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <Textarea
          value={reflection}
          onChange={(e) => setReflection(e.target.value)}
          placeholder={t('spiritual.quran.sessionDialog.reflection', 'Add a reflection (optional)')}
          className="min-h-[80px]"
        />

        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleDiscard}>
            {t('spiritual.quran.sessionDialog.discard', 'Discard')}
          </AlertDialogCancel>
          <AlertDialogAction onClick={handleSave} disabled={logSession.isPending}>
            {t('spiritual.quran.sessionDialog.save', 'Save Session')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
