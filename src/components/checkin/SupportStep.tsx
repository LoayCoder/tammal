import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Heart, Wind, Phone, Coffee } from 'lucide-react';

const SUPPORT_ACTIONS = [
  { key: 'meditation', icon: Heart },
  { key: 'breathing', icon: Wind },
  { key: 'talk', icon: Phone },
  { key: 'break', icon: Coffee },
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
    <>
      {showSupport && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('wellness.supportActions')}</CardTitle>
            <CardDescription>{t('wellness.supportDescription')}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {SUPPORT_ACTIONS.map(action => {
                const Icon = action.icon;
                const isActive = supportActions.includes(action.key);
                return (
                  <button
                    key={action.key}
                    onClick={() => onToggleAction(action.key)}
                    className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-start ${
                      isActive ? 'border-primary bg-primary/10' : 'border-border hover:border-primary/40'
                    }`}
                  >
                    <Icon className="h-5 w-5 shrink-0" />
                    <span className="text-sm">{t(`wellness.support.${action.key}`)}</span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-4">
          <Textarea
            value={comment}
            onChange={e => onCommentChange(e.target.value)}
            placeholder={t('wellness.addComment')}
            rows={2}
          />
        </CardContent>
      </Card>
    </>
  );
}
