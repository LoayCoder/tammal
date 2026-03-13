import { useEffect, useState } from 'react';
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
} from '@/shared/components/ui/alert-dialog';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { useQuranSessions } from '@/features/spiritual/hooks/spiritual/useQuranSessions';

interface ReadingSessionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  surahName: string;
  juzNumber: number | null;
  durationMinutes: number;
  durationSeconds: number;
  totalAyahs?: number;
  lastAyahPosition?: number;
}

export function ReadingSessionDialog({
  open,
  onOpenChange,
  surahName,
  juzNumber,
  durationMinutes,
  durationSeconds,
  totalAyahs,
  lastAyahPosition,
}: ReadingSessionDialogProps) {
  const { t } = useTranslation();
  const [reflection, setReflection] = useState('');
  const [lastAyahInput, setLastAyahInput] = useState('1');
  const { logSession } = useQuranSessions();

  useEffect(() => {
    if (!open) return;
    const initialLastAyah = Math.max(1, lastAyahPosition ?? totalAyahs ?? 1);
    setLastAyahInput(String(initialLastAyah));
  }, [open, lastAyahPosition, totalAyahs]);

  const maxAyah = Math.max(1, totalAyahs ?? 1);
  const parsedLastAyah = Number.parseInt(lastAyahInput, 10);
  const safeLastAyah = Number.isNaN(parsedLastAyah)
    ? Math.max(1, lastAyahPosition ?? 1)
    : Math.min(maxAyah, Math.max(1, parsedLastAyah));

  const formattedDuration = durationMinutes >= 1
    ? `${durationMinutes} ${t('spiritual.quran.min', 'min')}`
    : `${durationSeconds}s`;

  const handleSave = () => {
    logSession.mutate({
      duration_minutes: Math.max(1, durationMinutes),
      surah_name: surahName || undefined,
      juz_number: juzNumber ?? undefined,
      reflection_notes: reflection.trim() || undefined,
      ayahs_read: safeLastAyah,
      last_ayah_position: safeLastAyah,
    });
    setReflection('');
    setLastAyahInput('1');
    onOpenChange(false);
  };

  const handleDiscard = () => {
    setReflection('');
    setLastAyahInput('1');
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground" htmlFor="last-ayah-input">
            {t('spiritual.quran.sessionDialog.lastAyahLabel', 'Last ayah reached')}
          </label>
          <Input
            id="last-ayah-input"
            type="number"
            min={1}
            max={maxAyah}
            value={lastAyahInput}
            onChange={(e) => setLastAyahInput(e.target.value)}
            placeholder={t('spiritual.quran.sessionDialog.lastAyahPlaceholder', 'Enter ayah number')}
          />
          <p className="text-xs text-muted-foreground">
            {t('spiritual.quran.sessionDialog.lastAyahHint', 'You can resume later from this ayah.')}
          </p>
        </div>

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

