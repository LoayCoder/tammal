import { useTranslation } from "react-i18next";
import { Info, Database } from "lucide-react";

interface Props {
  reasoning: string;
  basisStatement: string;
}

export function CopilotReasoningBlock({ reasoning, basisStatement }: Props) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl bg-muted/[0.04] px-3 py-2.5 space-y-2">
      <div className="flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
        <div className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("copilot.whyMatters")}
          </span>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{reasoning}</p>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <Database className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" strokeWidth={1.5} />
        <div className="min-w-0">
          <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
            {t("copilot.basedOn")}
          </span>
          <p className="text-xs text-muted-foreground leading-relaxed mt-0.5">{basisStatement}</p>
        </div>
      </div>
    </div>
  );
}
