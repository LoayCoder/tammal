import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Wind, Phone, Coffee, CheckCircle2 } from 'lucide-react';

const SUPPORT_ACTIONS = [
  { key: 'meditation', icon: Heart, emoji: '🧘' },
  { key: 'breathing', icon: Wind, emoji: '🌬️' },
  { key: 'talk', icon: Phone, emoji: '💬' },
  { key: 'break', icon: Coffee, emoji: '☕' },
] as const;

interface SupportStepProps {
  showSupport: boolean;
  supportActions: string[];
  onToggleAction: (key: string) => void;
  comment: string;
  onCommentChange: (value: string) => void;
}

export function SupportStep({ showSupport, supportActions, onToggleAction, comment, onCommentChange }: SupportStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-4">
      {showSupport && (
        <div className="space-y-3">
          <div className="text-center space-y-1">
            <h3 className="text-lg font-semibold">{t('wellness.supportActions')}</h3>
            <p className="text-sm text-muted-foreground">{t('wellness.supportDescription')}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {SUPPORT_ACTIONS.map(action => {
              const isActive = supportActions.includes(action.key);
              return (
                <button
                  key={action.key}
                  onClick={() => onToggleAction(action.key)}
                  className={`relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 text-start hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] ${
                    isActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                  }`}
                >
                  <span className="text-2xl">{action.emoji}</span>
                  <span className="text-sm font-medium">{t(`wellness.support.${action.key}`)}</span>
                  {isActive && (
                    <CheckCircle2 className="absolute top-2 end-2 h-4 w-4 text-primary animate-in zoom-in-50 duration-200" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <Card className="border-dashed hover:shadow-md transition-shadow duration-200">
        <CardContent className="pt-5 pb-4">
          <Textarea
            value={comment}
            onChange={e => onCommentChange(e.target.value)}
            placeholder={t('wellness.addComment')}
            rows={3}
            className="border-none shadow-none resize-none focus-visible:ring-0 p-0"
          />
        </CardContent>
      </Card>
    </div>
  );
}
