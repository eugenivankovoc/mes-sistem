import { useEffect } from "react";

/**
 * Shows a browser confirmation dialog when the user tries to leave
 * or refresh the page while there are unsaved changes.
 */
export function useUnsavedChangesGuard(isDirty: boolean) {
  useEffect(() => {
    if (!isDirty) return;

    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Imate nespremljene promjene. Jeste li sigurni da želite napustiti stranicu?";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);
}
