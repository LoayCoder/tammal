import { Eclipse } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/branding/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label={t('accessibility.toggleTheme')}
    >
      <Eclipse className="h-5 w-5" strokeWidth={1.75} />
    </Button>
  );
}
