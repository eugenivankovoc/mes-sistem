import { useEffect } from "react";

/**
 * Global keyboard shortcuts.
 * - Ctrl+K: placeholder for search (prevents default)
 * - Escape: handled natively by Radix dialogs
 */
export function useKeyboardShortcuts() {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+K / Cmd+K – future search
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        // TODO: open search modal when implemented
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
