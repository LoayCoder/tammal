import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSecureAttachments } from '@/hooks/crisis/useSecureAttachments';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Eye, Trash2, Shield, Clock, FileText, Image, Music,
  Users, ChevronDown, ChevronUp,
} from 'lucide-react';

interface Props {
  caseId: string;
  isFirstAider?: boolean;
}

function getFileIcon(type: string) {
  if (type.startsWith('image/')) return <Image className="h-5 w-5" />;
  if (type.startsWith('audio/')) return <Music className="h-5 w-5" />;
  return <FileText className="h-5 w-5" />;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function SecureAttachmentViewer({ caseId, isFirstAider }: Props) {
  const { t } = useTranslation();
  const { attachments, isPending: isLoading, viewAttachment, revokeAttachment } = useSecureAttachments(caseId);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [viewData, setViewData] = useState<{ url: string; watermark: string; file_type: string } | null>(null);
  const [expandedLogs, setExpandedLogs] = useState<string | null>(null);

  const handleView = async (attachmentId: string) => {
    try {
      setViewingId(attachmentId);
      const data = await viewAttachment(attachmentId);
      setViewData({ url: data.url, watermark: data.watermark, file_type: data.file_type });
    } catch {
      toast.error(t('crisisSupport.attachments.viewError'));
      setViewingId(null);
    }
  };

  const handleRevoke = async (attachmentId: string) => {
    try {
      await revokeAttachment.mutateAsync(attachmentId);
      toast.success(t('crisisSupport.attachments.revoked'));
      if (viewingId === attachmentId) {
        setViewingId(null);
        setViewData(null);
      }
    } catch {
      toast.error(t('common.error'));
    }
  };

  const closeViewer = () => {
    setViewingId(null);
    setViewData(null);
  };

  if (isLoading || attachments.length === 0) return null;

  return (
    <div className="space-y-3">
      {/* Inline viewer */}
      {viewData && viewingId && (
        <Card className="rounded-xl overflow-hidden">
          <CardContent className="p-0 relative">
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10 select-none">
              <p className="text-foreground/10 text-lg font-bold rotate-[-30deg] whitespace-nowrap">
                {viewData.watermark}
              </p>
            </div>

            {viewData.file_type.startsWith('image/') ? (
              <img
                src={viewData.url}
                alt="Secure attachment"
                className="w-full max-h-[400px] object-contain bg-muted"
                onContextMenu={e => e.preventDefault()}
                draggable={false}
              />
            ) : viewData.file_type === 'application/pdf' ? (
              <iframe
                src={`${viewData.url}#toolbar=0&navpanes=0`}
                className="w-full h-[400px]"
                title="PDF Viewer"
              />
            ) : viewData.file_type.startsWith('audio/') ? (
              <div className="p-6">
                <audio controls controlsList="nodownload" className="w-full">
                  <source src={viewData.url} type={viewData.file_type} />
                </audio>
              </div>
            ) : null}

            <div className="absolute top-2 end-2 z-20">
              <Button size="sm" variant="secondary" onClick={closeViewer}>
                {t('common.close')}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Attachment list */}
      {attachments.map(att => {
        const isExpired = new Date(att.expires_at) < new Date();
        const accessLog = Array.isArray(att.access_log) ? att.access_log as { user_id: string; action: string; at: string }[] : [];

        return (
          <Card key={att.id} className={`rounded-xl ${isExpired ? 'opacity-60' : ''}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  {getFileIcon(att.mime_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{att.filename}</p>
                  <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                    <span>{formatFileSize(att.size_bytes)}</span>
                    <span>•</span>
                    {isExpired ? (
                      <Badge variant="destructive" className="text-[8px] px-1 py-0">
                        {t('crisisSupport.attachments.expired')}
                      </Badge>
                    ) : (
                      <span className="flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" />
                        {t('crisisSupport.attachments.expiresIn', {
                          time: formatDistanceToNow(new Date(att.expires_at)),
                        })}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  {!isExpired && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => viewingId === att.id ? closeViewer() : handleView(att.id)}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {isFirstAider && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => handleRevoke(att.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {isFirstAider && accessLog.length > 0 && (
                <div className="mt-2">
                  <button
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                    onClick={() => setExpandedLogs(expandedLogs === att.id ? null : att.id)}
                  >
                    <Users className="h-3 w-3" />
                    {t('crisisSupport.attachments.accessLog', { count: accessLog.length })}
                    {expandedLogs === att.id
                      ? <ChevronUp className="h-3 w-3" />
                      : <ChevronDown className="h-3 w-3" />}
                  </button>
                  {expandedLogs === att.id && (
                    <div className="mt-1 space-y-0.5 ps-4">
                      {accessLog.map((log, i) => (
                        <p key={i} className="text-[10px] text-muted-foreground">
                          {log.action} — {format(new Date(log.at), 'MMM d, h:mm a')}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
