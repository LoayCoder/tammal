import { ShieldCheck } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { Button } from "@/shared/components/ui/button";
import type { IncidentCategory } from "@/theme/tokens";
import { incidentCategories } from "@/theme/tokens";

const CATEGORY_MESSAGES: Record<IncidentCategory, { headline: string; copy: string }> = {
  safety: {
    headline: "All clear — no safety incidents",
    copy: "No workplace safety incidents have been reported. Keep up the great work maintaining a safe environment.",
  },
  injury: {
    headline: "No injuries on record",
    copy: "No personnel injuries have been reported. Your team is taking good care of themselves.",
  },
  property: {
    headline: "All property accounted for",
    copy: "No property or asset damage has been reported. Your facilities are in good hands.",
  },
  environmental: {
    headline: "Environment looks healthy",
    copy: "No environmental incidents have been reported. Thank you for caring for our shared spaces.",
  },
  security: {
    headline: "No security events",
    copy: "No security or access incidents have been reported. Your team's vigilance is appreciated.",
  },
};

const DEFAULT_MESSAGE = {
  headline: "All clear",
  copy: "No incidents have been reported. Your team is doing great — keep up the excellent work.",
};

interface IncidentEmptyStateProps {
  category?: IncidentCategory;
  onCreateNew?: () => void;
  className?: string;
}

export function IncidentEmptyState({
  category,
  onCreateNew,
  className,
}: IncidentEmptyStateProps) {
  const message = category ? CATEGORY_MESSAGES[category] : DEFAULT_MESSAGE;
  const categoryToken = category ? incidentCategories[category] : null;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-5 py-16 px-6 text-center animate-calm-fade-in",
        className
      )}
    >
      {/* Soft icon */}
      <div
        className={cn(
          "w-16 h-16 rounded-2xl flex items-center justify-center",
          categoryToken ? categoryToken.bg : "bg-primary/8"
        )}
      >
        <ShieldCheck
          className={cn(
            "w-8 h-8",
            categoryToken ? categoryToken.color : "text-primary"
          )}
          strokeWidth={1.5}
        />
      </div>

      {/* Copy */}
      <div className="max-w-xs">
        <h3 className="text-base font-semibold text-foreground">{message.headline}</h3>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{message.copy}</p>
      </div>

      {/* Soft CTA */}
      <Button
        variant="outline"
        onClick={onCreateNew}
        className="rounded-xl px-6 h-10 text-sm font-medium border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
      >
        Report an Incident
      </Button>
    </div>
  );
}
