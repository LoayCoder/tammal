/**
 * QuestionGeneratorContext — provides all AI generator config state to the subtree.
 * Eliminates prop drilling through ConfigPanel (48 → 0 props).
 */

import { createContext, useContext, type ReactNode } from 'react';
import type { AIGeneratorState } from '../types';

const GeneratorContext = createContext<AIGeneratorState | null>(null);

export function GeneratorProvider({ state, children }: { state: AIGeneratorState; children: ReactNode }) {
  return <GeneratorContext.Provider value={state}>{children}</GeneratorContext.Provider>;
}

export function useGeneratorContext(): AIGeneratorState {
  const ctx = useContext(GeneratorContext);
  if (!ctx) throw new Error('useGeneratorContext must be used within <GeneratorProvider>');
  return ctx;
}
