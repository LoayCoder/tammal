import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** Encapsulates avatar upload/remove to the avatars storage bucket */
export function useAvatarUpload() {
  const [isUploading, setIsUploading] = useState(false);

  const upload = async (userId: string, croppedBlob: Blob): Promise<string | null> => {
    setIsUploading(true);
    try {
      const fileName = `${userId}-${Date.now()}.jpeg`;
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, croppedBlob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      return publicUrl;
    } catch {
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  return { upload, isUploading };
}
