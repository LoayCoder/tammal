import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Upload, ShieldCheck, AlertCircle } from 'lucide-react';

interface EvidenceItem {
  id: string;
  file_url: string;
  status: string;
}

interface TaskEvidenceSectionProps {
  evidence: EvidenceItem[];
  isVerified: boolean;
  isCompleted: boolean;
  uploading: boolean;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onMarkVerified: () => void;
}

export function TaskEvidenceSection({
  evidence, isVerified, isCompleted, uploading, onUpload, onMarkVerified,
}: TaskEvidenceSectionProps) {
  const { t } = useTranslation();
  const hasApprovedEvidence = evidence.some(e => e.status === 'approved');
  const hasAnyEvidence = evidence.length > 0;

  return (
    <div className="space-y-2 border-t pt-3">
      <Label className="flex items-center gap-1.5">
        <Upload className="h-3.5 w-3.5" /> {t('workload.tasks.evidence')}
      </Label>
      {evidence.length > 0 ? (
        <div className="space-y-1">
          {evidence.map(ev => {
            const fileName = ev.file_url.split('/').pop() || 'file';
            return (
              <div key={ev.id} className="flex items-center justify-between text-xs bg-muted/50 rounded p-2">
                <span className="truncate max-w-[200px]">{fileName}</span>
                <Badge variant="outline" className={`text-2xs ${ev.status === 'approved' ? 'text-chart-1' : ev.status === 'rejected' ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {ev.status}
                </Badge>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">{t('workload.tasks.noEvidence')}</p>
      )}
      {!isVerified && (
        <div>
          <input type="file" id="evidence-upload" className="hidden" onChange={onUpload} />
          <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('evidence-upload')?.click()} disabled={uploading}>
            <Upload className="h-3.5 w-3.5 me-1.5" />
            {uploading ? '...' : t('workload.tasks.uploadEvidence')}
          </Button>
        </div>
      )}
      {isCompleted && hasApprovedEvidence && (
        <Button type="button" variant="default" size="sm" className="gap-1.5" onClick={onMarkVerified}>
          <ShieldCheck className="h-3.5 w-3.5" /> {t('workload.tasks.verified')}
        </Button>
      )}
      {isCompleted && !hasApprovedEvidence && (
        <p className="text-xs text-chart-4 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
          {hasAnyEvidence ? t('workload.tasks.completedNotVerified') : t('workload.tasks.evidenceRequired')}
        </p>
      )}
    </div>
  );
}
