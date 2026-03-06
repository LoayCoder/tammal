import { supabase } from '@/integrations/supabase/client';

/** Upload a voice note blob to storage, returns file path or null */
export async function uploadVoiceNote(caseId: string, blob: Blob): Promise<string | null> {
  const fileName = `voice-${Date.now()}.webm`;
  const filePath = `${caseId}/${fileName}`;
  const { error } = await supabase.storage.from('support-attachments').upload(filePath, blob);
  if (error) return null;
  return filePath;
}
