import { Badge } from '@/components/ui/badge';

const riskColors: Record<string, string> = {
  low: 'bg-chart-2/20 text-chart-2 border-chart-2/30',
  medium: 'bg-chart-4/20 text-chart-4 border-chart-4/30',
  high: 'bg-destructive/20 text-destructive border-destructive/30',
};

export function RiskBadge({ level }: { level: string | null }) {
  if (!level) return <Badge variant="outline">N/A</Badge>;
  return (
    <Badge className={riskColors[level] ?? ''} variant="outline">
      {level.toUpperCase()}
    </Badge>
  );
}
