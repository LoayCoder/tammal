// ── useCycleBuilder — orchestrator hook ──
import { useState, useCallback, useMemo } from 'react';
import { useAwardCycles, type CreateCycleInput } from '@/hooks/recognition/useAwardCycles';
import type { CycleStep, FairnessSettings } from '../types';
import { DEFAULT_FAIRNESS, DEFAULT_FORM, buildFairnessConfig, isBasicsValid } from '../types';

export function useCycleBuilder(onClose: () => void) {
  const { createCycle } = useAwardCycles();
  const [step, setStep] = useState<CycleStep>('basics');
  const [createdCycleId, setCreatedCycleId] = useState<string | null>(null);
  const [form, setForm] = useState<CreateCycleInput>(DEFAULT_FORM);
  const [fairness, setFairness] = useState<FairnessSettings>(DEFAULT_FAIRNESS);

  const updateField = useCallback((key: keyof CreateCycleInput, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateFairness = useCallback(<K extends keyof FairnessSettings>(key: K, value: FairnessSettings[K]) => {
    setFairness(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCreateCycle = useCallback(() => {
    const fairnessConfig = buildFairnessConfig(fairness);
    createCycle.mutate({ ...form, fairness_config: fairnessConfig }, {
      onSuccess: (data) => {
        setCreatedCycleId(data.id);
        setStep('themes');
      },
    });
  }, [form, fairness, createCycle]);

  const goToFairness = useCallback(() => setStep('fairness'), []);
  const goToReview = useCallback(() => setStep('review'), []);

  const basicsValid = useMemo(() => isBasicsValid(form), [form]);

  return {
    step, setStep,
    createdCycleId,
    form, updateField,
    fairness, updateFairness,
    basicsValid,
    isCreating: createCycle.isPending,
    handleCreateCycle,
    goToFairness, goToReview,
    onClose,
  };
}
