import { useState, useCallback } from 'react';

interface FormDialogState<T> {
  isOpen: boolean;
  mode: 'create' | 'edit';
  selected: T | null;
}

export function useFormDialog<T>() {
  const [state, setState] = useState<FormDialogState<T>>({
    isOpen: false,
    mode: 'create',
    selected: null,
  });

  const openCreate = useCallback(() => {
    setState({ isOpen: true, mode: 'create', selected: null });
  }, []);

  const openEdit = useCallback((record: T) => {
    setState({ isOpen: true, mode: 'edit', selected: record });
  }, []);

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const setOpen = useCallback((open: boolean) => {
    if (!open) {
      setState((prev) => ({ ...prev, isOpen: false }));
    }
  }, []);

  return {
    isOpen: state.isOpen,
    mode: state.mode,
    selected: state.selected,
    openCreate,
    openEdit,
    close,
    setOpen,
  };
}
