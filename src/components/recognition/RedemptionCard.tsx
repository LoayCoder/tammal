import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Coins, Gift, Clock, Coffee, Heart, ShoppingBag } from 'lucide-react';
import type { RedemptionOption } from '@/hooks/recognition/useRedemption';

interface RedemptionCardProps {
  option: RedemptionOption;
  balance: number;
  onRedeem: (optionId: string, cost: number) => void;
  isRedeeming?: boolean;
}

const categoryIcon = (category: string) => {
  switch (category) {
    case 'time_off': return Clock;
    case 'cash_equivalent': return Coins;
    case 'experience': return Coffee;
    case 'charity': return Heart;
    case 'merchandise': return ShoppingBag;
    default: return Gift;
  }
};

export function RedemptionCard({ option, balance, onRedeem, isRedeeming }: RedemptionCardProps) {
  const { t, i18n } = useTranslation();
  const Icon = categoryIcon(option.category);
  const name = i18n.language === 'ar' && option.name_ar ? option.name_ar : option.name;
  const description = i18n.language === 'ar' && option.description_ar ? option.description_ar : option.description;
  const canAfford = balance >= option.points_cost;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="gap-1">
            <Icon className="h-3 w-3" />
            {t(`recognition.points.categories.${option.category}`, option.category)}
          </Badge>
          <span className="text-sm font-semibold text-primary flex items-center gap-1">
            <Coins className="h-3.5 w-3.5" />
            {option.points_cost}
          </span>
        </div>
        <CardTitle className="text-base mt-2">{name}</CardTitle>
        {description && <CardDescription className="text-sm">{description}</CardDescription>}
      </CardHeader>
      <CardContent className="flex-1">
        {option.max_per_year && (
          <p className="text-xs text-muted-foreground">
            {t('recognition.points.maxPerYear', { count: option.max_per_year })}
          </p>
        )}
        {option.min_tenure_months && (
          <p className="text-xs text-muted-foreground">
            {t('recognition.points.minTenure', { months: option.min_tenure_months })}
          </p>
        )}
      </CardContent>
      <CardFooter>
        <Button
          className="w-full"
          disabled={!canAfford || isRedeeming}
          onClick={() => onRedeem(option.id, option.points_cost)}
        >
          {canAfford ? t('recognition.points.redeem') : t('recognition.points.insufficientPoints')}
        </Button>
      </CardFooter>
    </Card>
  );
}
