import { useState } from 'react';

export type QuestionPurpose = 'survey' | 'wellness';

export interface ConfigPanelState {
  advancedOpen: boolean;
  createPeriodOpen: boolean;
  categorySearch: string;
  subcategorySearch: string;
  setAdvancedOpen: (v: boolean) => void;
  setCreatePeriodOpen: (v: boolean) => void;
  setCategorySearch: (v: string) => void;
  setSubcategorySearch: (v: string) => void;
}

export function useConfigPanelState(): ConfigPanelState {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [createPeriodOpen, setCreatePeriodOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState('');
  const [subcategorySearch, setSubcategorySearch] = useState('');

  return {
    advancedOpen,
    createPeriodOpen,
    categorySearch,
    subcategorySearch,
    setAdvancedOpen,
    setCreatePeriodOpen,
    setCategorySearch,
    setSubcategorySearch,
  };
}