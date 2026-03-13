import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Badge } from '@/shared/components/ui/badge';
import { Button } from '@/shared/components/ui/button';
import { FileText, Upload, CheckCircle, XCircle, Clock } from 'lucide-react';

export interface EvidenceItem {
  id: string;
  file_name: string;
  file_type: string;
  uploaded_at: string;
  status: 'pending' | 'approved' | 'rejected';
  verifier_name?: string;
}

interface Props {
  evidence: EvidenceItem[];
  onUpload?: () => void;
  readOnly?: boolean;
}

const statusConfig: Record<string, { icon: typeof Clock; variant: 'default' | 'secondary' | 'destructive' }> = {
  pending: { icon: Clock, variant: 'secondary' },
  approved: { icon: CheckCircle, variant: 'default' },
  rejected: { icon: XCircle, variant: 'destructive' },
};

export function EvidencePanel({ evidence, onUpload, readOnly }: Props) {
  const { t } = useTranslation();

  return (
    <Card className="border-0 glass-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            {t('governance.evidence.title')}
          </CardTitle>
          {!readOnly && onUpload && (
            <Button size="sm" variant="outline" onClick={onUpload}>
              <Upload className="h-3.5 w-3.5 me-1.5" />
              {t('governance.evidence.upload')}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {evidence.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            {t('governance.evidence.empty')}
          </p>
        ) : (
          <div className="space-y-2">
            {evidence.map(item => {
              const cfg = statusConfig[item.status] ?? statusConfig.pending;
              const Icon = cfg.icon;
              return (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.file_name}</p>
                    {item.verifier_name && (
                      <p className="text-xs text-muted-foreground">{item.verifier_name}</p>
                    )}
                  </div>
                  <Badge variant={cfg.variant} className="text-xs gap-1">
                    <Icon className="h-3 w-3" />
                    {t(`governance.evidence.status.${item.status}`)}
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
