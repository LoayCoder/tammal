import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, X, Sparkles } from 'lucide-react';
import { tourSteps } from './tourSteps';
import { cn } from '@/lib/utils';

interface AppGuidedTourProps {
  open: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function AppGuidedTour({ open, onComplete, onSkip }: AppGuidedTourProps) {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const isRTL = document.documentElement.dir === 'rtl';

  const step = tourSteps[currentStep];
  const isFirst = currentStep === 0;
  const isLast = currentStep === tourSteps.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  }, [isLast, onComplete]);

  const handleBack = useCallback(() => {
    if (!isFirst) {
      setCurrentStep(prev => prev - 1);
    }
  }, [isFirst]);

  const StepIcon = step.icon;

  if (!open) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="tour-backdrop"
        className="fixed inset-0 z-[9999] flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Card */}
        <motion.div
          key={step.id}
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.96 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={cn(
            "relative z-10 w-[90vw] max-w-lg mx-4",
            "bg-card/95 backdrop-blur-xl border border-border/50",
            "rounded-2xl shadow-2xl overflow-hidden"
          )}
        >
          {/* Skip button */}
          <button
            onClick={onSkip}
            className="absolute top-4 end-4 p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors z-10"
            aria-label={t('common.close')}
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header gradient */}
          <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-transparent flex items-center justify-center">
            <motion.div
              key={`icon-${step.id}`}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.3 }}
              className="h-16 w-16 rounded-2xl bg-primary/15 border border-primary/20 flex items-center justify-center"
            >
              <StepIcon className="h-8 w-8 text-primary" />
            </motion.div>
            {/* Step counter chip */}
            <div className="absolute top-4 start-4 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              {currentStep + 1} / {tourSteps.length}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-6 pt-4 space-y-4">
            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                {t(step.titleKey)}
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {t(step.descriptionKey)}
              </p>
            </div>

            {/* Progress dots */}
            <div className="flex items-center justify-center gap-1.5 py-2">
              {tourSteps.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-1.5 rounded-full transition-all duration-300",
                    i === currentStep
                      ? "w-6 bg-primary"
                      : i < currentStep
                        ? "w-1.5 bg-primary/40"
                        : "w-1.5 bg-muted-foreground/20"
                  )}
                />
              ))}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleBack}
                disabled={isFirst}
                className="gap-1.5"
              >
                {isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
                {t('common.back')}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onSkip}
                  className="text-muted-foreground"
                >
                  {t('onboarding.skip')}
                </Button>
                <Button
                  size="sm"
                  onClick={handleNext}
                  className="gap-1.5 min-w-[100px]"
                >
                  {isLast ? t('onboarding.finish') : t('common.next')}
                  {!isLast && (isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />)}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
