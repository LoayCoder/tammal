import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface Props {
  current: number;
  previous: number;
  /** Whether higher is better (default true). Set false for metrics like burnout risk. */
  higherIsBetter?: boolean;
  className?: string;
}

export function TrendIndicator({ current, previous, higherIsBetter = true, className }: Props) {
  if (previous === 0 && current === 0) return null;

  const diff = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;

  if (diff === 0) {
    return (
      <span className={`inline-flex items-center gap-0.5 text-2xs text-muted-foreground ${className ?? ''}`}>
        <Minus className="h-3 w-3" />0%
      </span>
    );
  }

  const isPositive = diff > 0;
  const isGood = higherIsBetter ? isPositive : !isPositive;

  return (
    <span className={`inline-flex items-center gap-0.5 text-2xs font-medium ${isGood ? 'text-chart-2' : 'text-destructive'} ${className ?? ''}`}>
      {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {isPositive ? '+' : ''}{diff}%
    </span>
  );
}
