import { useState, useCallback } from 'react';

/**
 * Lightweight state hook for delete-confirmation flows.
 * Tracks the ID to delete and open/close state.
 */
export function useConfirmDelete() {
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const requestDelete = useCallback((id: string) => {
    setDeleteId(id);
  }, []);

  const cancel = useCallback(() => {
    setDeleteId(null);
  }, []);

  const confirm = useCallback(
    (onDelete: (id: string) => void) => {
      if (deleteId) {
        onDelete(deleteId);
        setDeleteId(null);
      }
    },
    [deleteId],
  );

  return {
    isOpen: deleteId !== null,
    deleteId,
    requestDelete,
    cancel,
    confirm,
    /** Pass to AlertDialog onOpenChange */
    setOpen: (open: boolean) => {
      if (!open) setDeleteId(null);
    },
  };
}
