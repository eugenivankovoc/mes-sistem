import { useState, useCallback } from "react";

/**
 * Hook for modals: intercepts close when form is dirty, shows confirm dialog.
 * Returns { guardedOpenChange, showGuard, confirmClose, cancelClose }
 */
export function useConfirmBeforeClose(
  isDirty: boolean,
  onOpenChange: (open: boolean) => void
) {
  const [showGuard, setShowGuard] = useState(false);

  const guardedOpenChange = useCallback(
    (open: boolean) => {
      if (!open && isDirty) {
        setShowGuard(true);
      } else {
        onOpenChange(open);
      }
    },
    [isDirty, onOpenChange]
  );

  const confirmClose = useCallback(() => {
    setShowGuard(false);
    onOpenChange(false);
  }, [onOpenChange]);

  const cancelClose = useCallback(() => {
    setShowGuard(false);
  }, []);

  return { guardedOpenChange, showGuard, confirmClose, cancelClose };
}
