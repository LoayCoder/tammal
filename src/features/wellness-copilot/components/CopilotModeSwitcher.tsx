import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { CopilotMode } from "../hooks/useCopilotInsight";
import { User, Users, Building2 } from "lucide-react";

interface Props {
  allowedModes: CopilotMode[];
  selectedMode: CopilotMode;
  onModeChange: (mode: CopilotMode) => void;
}

const modeConfig: Record<CopilotMode, { icon: typeof User; labelKey: string }> = {
  personal: { icon: User, labelKey: "copilot.modePersonal" },
  team: { icon: Users, labelKey: "copilot.modeTeam" },
  organization: { icon: Building2, labelKey: "copilot.modeOrganization" },
};

export function CopilotModeSwitcher({ allowedModes, selectedMode, onModeChange }: Props) {
  const { t } = useTranslation();

  if (allowedModes.length <= 1) return null;

  return (
    <div className="flex gap-1 rounded-xl bg-muted/10 p-1">
      {allowedModes.map((mode) => {
        const { icon: Icon, labelKey } = modeConfig[mode];
        const active = mode === selectedMode;
        return (
          <button
            key={mode}
            onClick={() => onModeChange(mode)}
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-2xs font-medium transition-all duration-200",
              active
                ? "bg-primary/10 text-primary shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-muted/10"
            )}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span className="truncate">{t(labelKey)}</span>
          </button>
        );
      })}
    </div>
  );
}
