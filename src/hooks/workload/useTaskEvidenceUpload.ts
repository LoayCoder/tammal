import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Evidence {
  id: string;
  file_url: string;
  status: string;
}

/** Encapsulates task evidence loading + upload logic */
export function useTaskEvidenceUpload(tenantId: string) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadEvidence = async (taskId: string) => {
    const { data } = await supabase
      .from('task_evidence')
      .select('id, file_url, status')
      .eq('action_id', taskId)
      .is('deleted_at', null);
    setEvidence(data ?? []);
  };

  const uploadEvidence = async (taskId: string, employeeId: string, file: File) => {
    setUploading(true);
    try {
      const filePath = `${tenantId}/${taskId}/${crypto.randomUUID()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from('support-attachments').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('support-attachments').getPublicUrl(filePath);

      const { error: insertError } = await supabase.from('task_evidence').insert({
        tenant_id: tenantId,
        action_id: taskId,
        uploaded_by: employeeId,
        file_url: urlData.publicUrl,
        file_type: file.type || 'application/octet-stream',
        status: 'pending',
      });
      if (insertError) throw insertError;

      await loadEvidence(taskId);
      return true;
    } catch {
      return false;
    } finally {
      setUploading(false);
    }
  };

  return { evidence, uploading, loadEvidence, uploadEvidence };
}
