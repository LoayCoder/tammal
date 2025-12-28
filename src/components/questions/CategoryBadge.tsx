import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";

interface CategoryBadgeProps {
  name: string;
  nameAr?: string | null;
  color: string;
}

export function CategoryBadge({ name, nameAr, color }: CategoryBadgeProps) {
  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  const displayName = isRTL && nameAr ? nameAr : name;

  return (
    <Badge 
      variant="outline" 
      className="font-normal"
      style={{ 
        borderColor: color, 
        backgroundColor: `${color}15`,
        color: color 
      }}
    >
      {displayName}
    </Badge>
  );
}
