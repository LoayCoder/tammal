import { CheckCircle2, Circle, Clock } from "lucide-react";
import { cn } from "@/shared/utils/utils";
import { Progress } from "@/shared/components/ui/progress";

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  assignee?: string;
  completedAt?: string;
  dueDate?: string;
}

const DEFAULT_STEPS: WorkflowStep[] = [
  {
    id: "reported",
    title: "Reported",
    description: "Incident has been submitted and acknowledged",
    assignee: "System",
    completedAt: "Today, 09:15",
  },
  {
    id: "review",
    title: "Under Review",
    description: "Initial review and priority classification",
    assignee: "Safety Manager",
    completedAt: "Today, 10:30",
  },
  {
    id: "investigating",
    title: "Investigating",
    description: "Gathering facts and interviewing witnesses",
    assignee: "Investigations Team",
    dueDate: "Tomorrow",
  },
  {
    id: "resolution",
    title: "Resolution",
    description: "Corrective actions and preventive measures",
    assignee: "Department Head",
    dueDate: "In 3 days",
  },
  {
    id: "closed",
    title: "Closed",
    description: "Incident resolved and documented",
    dueDate: "In 5 days",
  },
];

interface InvestigationWorkflowProps {
  steps?: WorkflowStep[];
  currentStepIndex?: number;
  incidentId?: string;
  className?: string;
}

export function InvestigationWorkflow({
  steps = DEFAULT_STEPS,
  currentStepIndex = 2,
  className,
}: InvestigationWorkflowProps) {
  const completedCount = currentStepIndex;
  const progressPercent = Math.round((completedCount / (steps.length - 1)) * 100);

  return (
    <div className={cn("flex flex-col gap-5", className)}>
      {/* Header + Progress */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-base font-semibold text-foreground">Investigation Progress</h3>
            <p className="text-sm text-muted-foreground mt-0.5">
              Step {currentStepIndex + 1} of {steps.length}
            </p>
          </div>
          <span className="text-sm font-semibold text-primary tabular-nums">
            {progressPercent}%
          </span>
        </div>
        <Progress
          value={progressPercent}
          className="h-1.5 rounded-full bg-muted"
        />
      </div>

      {/* Steps */}
      <ol className="flex flex-col gap-0">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent  = index === currentStepIndex;
          const isPending   = index > currentStepIndex;

          return (
            <li key={step.id} className="flex gap-4">
              {/* Connector column */}
              <div className="flex flex-col items-center">
                {/* Step indicator */}
                <div className="relative flex items-center justify-center">
                  {isCurrent && (
                    <span
                      className="absolute w-7 h-7 rounded-full bg-primary/20 animate-step-ping"
                      aria-hidden="true"
                    />
                  )}
                  <div
                    className={cn(
                      "relative z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                      isCompleted && "bg-primary",
                      isCurrent  && "bg-primary ring-2 ring-primary/30 ring-offset-2 ring-offset-background",
                      isPending  && "bg-muted border-2 border-border"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={2.5} />
                    ) : isCurrent ? (
                      <Circle className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
                    ) : (
                      <Circle className="w-3 h-3 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Vertical connector */}
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      "w-px flex-1 my-1 min-h-[2rem] transition-colors duration-300",
                      isCompleted ? "bg-primary/40" : "bg-border"
                    )}
                  />
                )}
              </div>

              {/* Step content */}
              <div
                className={cn(
                  "flex-1 pb-6",
                  index === steps.length - 1 && "pb-0"
                )}
              >
                <div
                  className={cn(
                    "rounded-xl border p-4 transition-all duration-200",
                    isCompleted && "border-primary/20 bg-primary/5",
                    isCurrent  && "border-primary/30 bg-primary/8 shadow-sm shadow-primary/10",
                    isPending  && "border-border/50 bg-card/50"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          isCompleted && "text-primary",
                          isCurrent  && "text-foreground",
                          isPending  && "text-muted-foreground"
                        )}
                      >
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                        {step.description}
                      </p>
                    </div>

                    {(step.completedAt || step.dueDate) && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {step.completedAt ?? step.dueDate}
                        </span>
                      </div>
                    )}
                  </div>

                  {step.assignee && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-2xs font-semibold text-muted-foreground shrink-0">
                        {step.assignee.charAt(0)}
                      </div>
                      <span className="text-xs text-muted-foreground">{step.assignee}</span>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
